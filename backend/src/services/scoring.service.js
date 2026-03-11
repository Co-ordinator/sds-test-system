const { Answer, Assessment, Occupation, EducationLevel, AuditLog, User, Course, CourseRequirement, CourseInstitution, Institution, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Holland Code → Suggested High School Subjects mapping
 * Used to populate the "Suggested Subjects" section of career reports.
 */
const HOLLAND_SUBJECTS = {
  R: ['Mathematics', 'Physical Science', 'Technical Drawing', 'Agricultural Science', 'Computer Science'],
  I: ['Mathematics', 'Physical Science', 'Biology', 'Chemistry', 'Computer Science'],
  A: ['Art', 'Music', 'English Language', 'Literature', 'Drama', 'Design & Technology'],
  S: ['Biology', 'English Language', 'History', 'Religious Education', 'Home Economics'],
  E: ['Business Studies', 'Economics', 'Accounting', 'English Language', 'Mathematics'],
  C: ['Accounting', 'Business Studies', 'Mathematics', 'Computer Science', 'Economics']
};

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

      const hollandCode = Object.entries(totals)
        .sort(([, valA], [, valB]) => valB - valA)
        .slice(0, 3)
        .map(([key]) => key)
        .join('');

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
   * Get suggested subjects for a Holland code (top 3 letters).
   * Returns deduplicated list of subjects relevant to the code.
   */
  getSuggestedSubjects(hollandCode) {
    if (!hollandCode) return [];
    const subjects = new Set();
    hollandCode.split('').forEach(letter => {
      (HOLLAND_SUBJECTS[letter] || []).forEach(s => subjects.add(s));
    });
    return Array.from(subjects).slice(0, 8);
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
    let occupations = await Occupation.findAll({
      where: { code },
      include: [{ model: EducationLevel, as: 'education' }],
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
        include: [{ model: EducationLevel, as: 'education' }],
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
          }
        ],
        limit: 12,
        ...opts
      });
    } catch (_err) {
      courses = [];
    }

    // 4. Suggested subjects from Holland code
    const suggestedSubjects = this.getSuggestedSubjects(code);

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