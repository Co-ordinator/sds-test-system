const { Answer, Assessment, Occupation, EducationLevel, AuditLog, User, Course, CourseRequirement, CourseInstitution, Institution, Subject, OccupationCourse, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Holland Code → Career Focus description per user type
 */
const CAREER_FOCUS = {
  school_student: 'Based on your interests, here are careers and study paths available in Eswatini.',
  university_student: 'Your profile suggests these career specializations and graduate pathways.',
  professional: 'Based on your RIASEC profile, here are career transition opportunities and upskilling paths.'
};

/**
 * SDS Scoring Service
 * Handles the calculation of RIASEC scores, career matching,
 * and the full careers → courses → institutions recommendation chain.
 */
class ScoringService {
  /**
   * Main entry point to finalize an assessment
   */
  async finalizeAssessment(assessmentId) {
    const transaction = await sequelize.transaction();

    try {
      const assessment = await Assessment.findByPk(assessmentId, {
        include: ['user'],
        transaction
      });

      if (!assessment) throw new Error('Assessment not found');

      const answers = await Answer.findAll({ 
        where: { assessmentId },
        transaction 
      });

      const totals = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

      answers.forEach(ans => {
        const type = ans.riasecType;
        if (['activities', 'competencies', 'occupations'].includes(ans.section)) {
          if (ans.value.toUpperCase() === 'YES') {
            totals[type] += 1;
          }
        } else if (ans.section === 'self_estimates') {
          const rating = parseInt(ans.value, 10);
          if (!isNaN(rating)) {
            totals[type] += rating;
          }
        }
      });

      // Calculate Holland code with tie handling (slash format for ties)
      const sorted = Object.entries(totals).sort(([, valA], [, valB]) => valB - valA);
      
      const hollandParts = [];
      let currentGroup = [];
      let currentScore = null;
      let totalLetters = 0;
      
      for (const [letter, score] of sorted) {
        if (totalLetters >= 6) break;
        
        if (currentScore === null || score === currentScore) {
          currentGroup.push(letter);
          currentScore = score;
        } else {
          if (currentGroup.length > 0) {
            hollandParts.push(currentGroup.join('/'));
            totalLetters += currentGroup.length;
          }
          if (totalLetters >= 6) break;
          currentGroup = [letter];
          currentScore = score;
        }
      }
      
      if (currentGroup.length > 0 && totalLetters < 6) {
        const remaining = 6 - totalLetters;
        if (currentGroup.length <= remaining) {
          hollandParts.push(currentGroup.join('/'));
          totalLetters += currentGroup.length;
        } else {
          hollandParts.push(currentGroup.slice(0, remaining).join('/'));
        }
      }
      
      let hollandCode = hollandParts.join('');
      const letterCount = hollandCode.replace(/\//g, '').length;
      
      if (letterCount < 3) {
        const usedLetters = new Set(hollandCode.replace(/\//g, '').split(''));
        const additionalLetters = sorted
          .map(([letter]) => letter)
          .filter(letter => !usedLetters.has(letter))
          .slice(0, 3 - letterCount);
        hollandCode = hollandCode + additionalLetters.join('');
      }
      
      hollandCode = hollandCode || 'RIA';

      await assessment.update({
        scoreR: totals.R,
        scoreI: totals.I,
        scoreA: totals.A,
        scoreS: totals.S,
        scoreE: totals.E,
        scoreC: totals.C,
        hollandCode,
        status: 'completed',
        completedAt: new Date(),
        educationLevelAtTest: assessment.user.educationLevel 
      }, { transaction });

      const recommendations = await this.getRecommendations(
        hollandCode, 
        assessment.user.educationLevel,
        transaction
      );

      await transaction.commit();

      try {
        const student = assessment.user;
        await AuditLog.create({
          userId: assessment.userId,
          actionType: 'ASSESSMENT_COMPLETED_NOTIFY',
          description: `${student?.firstName || 'Student'} ${student?.lastName || ''} completed their SDS assessment. Holland Code: ${hollandCode}`,
          details: {
            assessmentId,
            userId: assessment.userId,
            studentName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
            studentEmail: student?.email || null,
            institutionId: student?.institutionId || null,
            hollandCode,
            isRead: false
          },
          ipAddress: '127.0.0.1',
          userAgent: 'system'
        });
      } catch (_notifyErr) {
        // Notification failure must not break the assessment flow
      }

      return {
        scores: totals,
        hollandCode,
        recommendations
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get suggested subjects for a Holland code.
   * Returns deduplicated list of subjects relevant to the code from database.
   */
  async getSuggestedSubjects(hollandCode, transaction = null) {
    if (!hollandCode) return [];
    
    try {
      const opts = transaction ? { transaction } : {};
      const cleanCode = hollandCode.replace(/\//g, '');
      const letters = cleanCode.split('');
      
      const subjects = await Subject.findAll({
        where: {
          isActive: true,
          [Op.or]: letters.map(letter => 
            sequelize.where(
              sequelize.fn('array_to_string', sequelize.col('riasec_codes'), ','),
              { [Op.iLike]: `%${letter}%` }
            )
          )
        },
        order: [['display_order', 'ASC'], ['name', 'ASC']],
        limit: 10,
        ...opts
      });
      
      return subjects.map(s => s.name);
    } catch (err) {
      return [];
    }
  }

  /**
   * Matches Holland Code against occupations and enriches with:
   * - Suggested subjects
   * - Matching courses (qualification pathways)
   * - Institutions offering those courses
   * - Entry requirements per course
   */
  async getRecommendations(code, eduLevel, transaction = null) {
    const opts = transaction ? { transaction } : {};

    // 1. Validate education level
    const levelExists = eduLevel
      ? await EducationLevel.findByPk(eduLevel, opts)
      : null;

    // 2. Find matching occupations (exact code match or any letter overlap)
    const occupationIncludes = [
      { model: EducationLevel, as: 'education' },
      {
        model: Course, as: 'courses', required: false,
        through: { attributes: ['relevanceScore', 'isPrimaryPathway'] },
        attributes: ['id', 'name', 'qualificationType', 'durationYears', 'riasecCodes'],
        include: [
          {
            model: CourseInstitution, as: 'courseInstitutions', required: false,
            where: { isActive: true },
            include: [{ model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region'] }]
          }
        ]
      }
    ];

    let occupations = await Occupation.findAll({
      where: { code },
      include: occupationIncludes,
      ...opts
    });

    // Fallback: try partial match on any 2 of 3 letters
    if (occupations.length === 0 && code && code.length >= 2) {
      const letters = code.split('');
      occupations = await Occupation.findAll({
        where: {
          [Op.or]: letters.map(l => ({
            code: { [Op.iLike]: `%${l}%` }
          }))
        },
        limit: 15,
        include: occupationIncludes,
        ...opts
      });
    }

    // 3. Find matching courses by RIASEC code overlap
    let courses = [];
    try {
      // Match courses whose riasec_codes array contains any letter from the holland code
      const codeLetters = code ? code.split('') : [];
      
      courses = await Course.findAll({
        where: {
          isActive: true,
          [Op.or]: codeLetters.length > 0
            ? codeLetters.map(l => sequelize.where(
                sequelize.fn('array_to_string', sequelize.col('riasec_codes'), ','),
                { [Op.iLike]: `%${l}%` }
              ))
            : [{ id: { [Op.ne]: null } }]
        },
        include: [
          { model: CourseRequirement, as: 'requirements' },
          {
            model: CourseInstitution,
            as: 'courseInstitutions',
            where: { isActive: true },
            required: false,
            include: [
              {
                model: Institution,
                as: 'institution',
                attributes: ['id', 'name', 'type', 'region', 'website', 'accredited']
              }
            ]
          },
          {
            model: Occupation, as: 'occupations', required: false,
            through: { attributes: ['relevanceScore', 'isPrimaryPathway'] },
            attributes: ['id', 'name', 'primaryRiasec', 'code', 'demandLevel', 'localDemand', 'category']
          }
        ],
        limit: 12,
        ...opts
      });
    } catch (_err) {
      courses = [];
    }

    // 4. Suggested subjects from Holland code (dynamic from database)
    const suggestedSubjects = await this.getSuggestedSubjects(code, transaction);

    return {
      occupations,
      courses,
      suggestedSubjects,
      hollandCode: code,
      educationLevel: levelExists
    };
  }

  /**
   * Get career focus message by user type
   */
  getCareerFocusMessage(userType) {
    return CAREER_FOCUS[userType] || CAREER_FOCUS.school_student;
  }
}

module.exports = new ScoringService();