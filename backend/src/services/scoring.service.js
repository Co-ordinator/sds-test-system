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

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
const BINARY_SECTIONS = new Set(['activities', 'competencies', 'occupations']);
const VALID_SECTIONS = new Set(['activities', 'competencies', 'occupations', 'self_estimates']);
const MAX_OCCUPATION_RECOMMENDATIONS = 8;
const MAX_COURSE_RECOMMENDATIONS = 8;

/**
 * SDS Scoring Service
 * Handles the calculation of RIASEC scores, career matching,
 * and the full careers → courses → institutions recommendation chain.
 */
class ScoringService {
  normalizeHollandCode(code) {
    return String(code || '').toUpperCase().replace(/[^RIASEC]/g, '').slice(0, 3);
  }

  buildCodeVariants(code, displayCode = null) {
    const variants = new Set();
    const primary = this.normalizeHollandCode(code);
    if (primary.length === 3) variants.add(primary);

    const raw = String(displayCode || code || '').toUpperCase().trim();
    const tieMatch = raw.match(/^([RIASEC]{3})\/([RIASEC])$/);
    if (tieMatch) {
      variants.add(tieMatch[1]);
      variants.add(`${tieMatch[1].slice(0, 2)}${tieMatch[2]}`);
    }

    return Array.from(variants);
  }

  buildWeightsFromScores(scores = {}) {
    const values = RIASEC_KEYS.map((k) => Number(scores[k] || 0));
    const max = Math.max(...values, 0);
    if (max <= 0) return null;

    const weights = {};
    RIASEC_KEYS.forEach((k) => {
      weights[k] = Number(scores[k] || 0) / max;
    });
    return weights;
  }

  buildWeightsFromCodeVariants(code, variants = []) {
    const weights = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const primary = this.normalizeHollandCode(code);
    const rankedLetters = primary.split('');

    if (rankedLetters[0]) weights[rankedLetters[0]] = Math.max(weights[rankedLetters[0]], 1.0);
    if (rankedLetters[1]) weights[rankedLetters[1]] = Math.max(weights[rankedLetters[1]], 0.9);
    if (rankedLetters[2]) weights[rankedLetters[2]] = Math.max(weights[rankedLetters[2]], 0.75);

    // Preserve tie signal from extended code variants (e.g., RIA/S -> RIS).
    variants.forEach((variant) => {
      if (variant.slice(0, 2) === primary.slice(0, 2) && variant[2] && variant[2] !== primary[2]) {
        weights[variant[2]] = Math.max(weights[variant[2]], 0.7);
      }
    });

    return weights;
  }

  scoreCandidateByWeights(weights, candidateCode) {
    const code = this.normalizeHollandCode(candidateCode);
    if (!code || !weights) return 0;
    const multipliers = [1.0, 0.8, 0.6];
    return code.split('').reduce((sum, letter, idx) => sum + (Number(weights[letter] || 0) * multipliers[idx]), 0);
  }

  scoreCodeAlignment(targetCode, candidateCode) {
    const target = this.normalizeHollandCode(targetCode);
    const candidate = this.normalizeHollandCode(candidateCode);
    if (!target || !candidate) return 0;

    const [t1, t2, t3] = target.split('');
    const [c1, c2, c3] = candidate.split('');
    let score = 0;

    if (candidate === target) score += 120;
    if (c1 === t1) score += 45;
    if (c2 === t2) score += 30;
    if (c3 === t3) score += 20;

    const overlap = [...new Set(candidate.split(''))].filter((l) => target.includes(l)).length;
    score += overlap * 10;

    // Penalize weak/accidental overlaps to reduce irrelevant recommendations.
    if (overlap < 2) score -= 50;
    return score;
  }

  bestAlignmentScore(targetCode, candidateCodes = []) {
    const codes = Array.isArray(candidateCodes) ? candidateCodes : [];
    const scores = codes.map((c) => this.scoreCodeAlignment(targetCode, c));
    return scores.length ? Math.max(...scores) : 0;
  }

  /**
   * Build Holland codes from RIASEC totals.
   * - primaryCode: strict 3-letter deterministic code (used for DB matching)
   * - displayCode: extended code that preserves meaningful ties for UI/reporting
   */
  buildHollandCodes(totals, tieThreshold = 0) {
    const deterministicOrder = RIASEC_KEYS;
    const ranked = deterministicOrder
      .map((letter, index) => ({ letter, score: Number(totals[letter] || 0), index }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      });

    const primaryCode = ranked.slice(0, 3).map((x) => x.letter).join('') || 'RIA';
    const third = ranked[2];
    const fourth = ranked[3];
    const hasThirdPlaceTie = third && fourth && Math.abs(third.score - fourth.score) <= tieThreshold;
    const displayCode = hasThirdPlaceTie
      ? `${ranked[0].letter}${ranked[1].letter}${ranked[2].letter}/${ranked[3].letter}`
      : primaryCode;

    return { primaryCode, displayCode, ranked };
  }

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
        const section = ans.section;
        const type = ans.riasecType;

        // Defensive scoring: ignore malformed rows instead of polluting totals.
        if (!VALID_SECTIONS.has(section) || !RIASEC_KEYS.includes(type)) {
          return;
        }

        if (BINARY_SECTIONS.has(section)) {
          const value = String(ans.value || '').trim().toUpperCase();
          if (value === 'YES') totals[type] += 1;
          return;
        }

        if (section === 'self_estimates') {
          const rating = parseInt(String(ans.value || '').trim(), 10);
          if (Number.isInteger(rating) && rating >= 1 && rating <= 6) {
            totals[type] += rating;
          }
        }
      });

      const { primaryCode: hollandCode, displayCode: hollandCodeDisplay } = this.buildHollandCodes(totals, 0);

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
        transaction,
        { scores: totals, displayCode: hollandCodeDisplay }
      );

      await transaction.commit();

      try {
        const student = assessment.user;
        await AuditLog.create({
          userId: assessment.userId,
          actionType: 'ASSESSMENT_COMPLETED_NOTIFY',
          description: `${student?.firstName || 'Student'} ${student?.lastName || ''} completed their SDS assessment. Holland Code: ${hollandCodeDisplay}`,
          details: {
            assessmentId,
            userId: assessment.userId,
            studentName: `${student?.firstName || ''} ${student?.lastName || ''}`.trim(),
            studentEmail: student?.email || null,
            institutionId: student?.institutionId || null,
            hollandCode,
            hollandCodeDisplay,
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
        hollandCodeDisplay,
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
  async getRecommendations(code, eduLevel, transaction = null, profile = null) {
    const opts = transaction ? { transaction } : {};
    const normalizedCode = this.normalizeHollandCode(code);
    const variants = this.buildCodeVariants(normalizedCode, profile?.displayCode);
    const weights = this.buildWeightsFromScores(profile?.scores) || this.buildWeightsFromCodeVariants(normalizedCode, variants);
    const codeLetters = normalizedCode.length
      ? normalizedCode.split('')
      : RIASEC_KEYS
          .filter((k) => Number(weights?.[k] || 0) > 0)
          .sort((a, b) => Number(weights[b] || 0) - Number(weights[a] || 0))
          .slice(0, 3);

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

    const occupationWhere = {
      [Op.or]: [
        ...(variants.length > 0 ? [{ code: { [Op.in]: variants } }] : []),
        ...codeLetters.map((letter) => ({ code: { [Op.iLike]: `%${letter}%` } })),
      ]
    };

    let occupations = await Occupation.findAll({
      where: occupationWhere,
      include: occupationIncludes,
      ...opts
    });
    occupations = occupations
      .map((occ) => {
        const weightedScore = this.scoreCandidateByWeights(weights, occ.code);
        occ.setDataValue('relevanceScore', Number((weightedScore * 100).toFixed(2)));
        return occ;
      })
      .filter((occ) => occ.getDataValue('relevanceScore') >= 90)
      .sort((a, b) => b.getDataValue('relevanceScore') - a.getDataValue('relevanceScore') || a.name.localeCompare(b.name))
      .slice(0, MAX_OCCUPATION_RECOMMENDATIONS);

    // 3. Find matching courses by RIASEC code overlap
    let courses = [];
    try {
      const broadCourses = await Course.findAll({
        where: {
          isActive: true,
          [Op.or]: codeLetters.map((letter) => (
            sequelize.where(
              sequelize.fn('array_to_string', sequelize.col('riasec_codes'), ','),
              { [Op.iLike]: `%${letter}%` }
            )
          ))
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
        order: [['funding_priority', 'DESC'], ['name', 'ASC']],
        ...opts
      });

      courses = broadCourses
        .map((course) => {
          const candidateCodes = Array.isArray(course.riasecCodes) ? course.riasecCodes : [];
          const weightedScore = candidateCodes.reduce((max, c) => {
            const score = this.scoreCandidateByWeights(weights, c);
            return score > max ? score : max;
          }, 0);
          const hasInstitutionLink = Array.isArray(course.courseInstitutions) && course.courseInstitutions.length > 0;
          const institutionScore = hasInstitutionLink ? 10 : 0;
          const relevanceScore = Number((weightedScore * 100).toFixed(2)) + institutionScore;
          course.setDataValue('relevanceScore', relevanceScore);
          return course;
        })
        .filter((course) => course.getDataValue('relevanceScore') >= 80)
        .sort((a, b) => {
          const byScore = b.getDataValue('relevanceScore') - a.getDataValue('relevanceScore');
          if (byScore !== 0) return byScore;
          return a.name.localeCompare(b.name);
        })
        .slice(0, MAX_COURSE_RECOMMENDATIONS);
    } catch (_err) {
      courses = [];
    }

    // 4. Suggested subjects from Holland code (dynamic from database)
    const suggestedSubjects = await this.getSuggestedSubjects(profile?.displayCode || code, transaction);

    // 5. Government Funding Priority Alignment (driven by course.funding_priority)
    const fundingAlignment = this.computeFundingAlignment(normalizedCode, courses);

    return {
      occupations,
      courses,
      suggestedSubjects,
      fundingAlignment,
      hollandCode: normalizedCode,
      educationLevel: levelExists
    };
  }

  /**
   * Government Funding Priority Alignment
   *
   * Uses courses already matched by RIASEC in getRecommendations().
   * Each course has `fundingPriority` (boolean): true = SLAS priority programme.
   *
   * Groups matched courses by fieldOfStudy and reports per-field alignment
   * plus an overall funding alignment level.
   *
   * Source: https://slas.gov.sz/LoanProcess/ApplicationRequirements.aspx
   */
  computeFundingAlignment(hollandCode, courses = []) {
    if (!hollandCode || courses.length === 0) {
      return {
        overall: 'LOW',
        fields: [],
        allFields: [],
        interpretation: '',
        priorityFieldCount: 0,
        nonPriorityFieldCount: 0,
      };
    }

    const fieldMap = {};

    for (const course of courses) {
      const field = course.fieldOfStudy || 'Other';
      const isPriority = course.fundingPriority === true;

      if (!fieldMap[field]) {
        fieldMap[field] = { field, hasPriorityCourse: false, courses: [] };
      }

      fieldMap[field].courses.push({
        id: course.id,
        name: course.name,
        qualificationType: course.qualificationType,
        fundingPriority: isPriority,
      });

      if (isPriority) fieldMap[field].hasPriorityCourse = true;
    }

    const fields = Object.values(fieldMap)
      .map(f => ({
        field: f.field,
        alignment: f.hasPriorityCourse ? 'HIGH' : 'LOW',
        courseCount: f.courses.length,
        courses: f.courses.slice(0, 4),
      }))
      .sort((a, b) => {
        const r = { HIGH: 0, LOW: 1 };
        return r[a.alignment] - r[b.alignment];
      });

    const priorityFieldCount = fields.filter(f => f.alignment === 'HIGH').length;
    const nonPriorityFieldCount = fields.filter(f => f.alignment === 'LOW').length;

    let overall;
    if (priorityFieldCount >= 2) {
      overall = 'HIGH';
    } else if (priorityFieldCount >= 1) {
      overall = 'MEDIUM';
    } else {
      overall = 'LOW';
    }

    const topPriority = fields.filter(f => f.alignment === 'HIGH').slice(0, 3);
    let interpretation = '';

    if (overall === 'HIGH') {
      const names = topPriority.map(f => f.field).join(', ');
      interpretation = `Your interests strongly align with ${names} \u2014 these are government priority programmes. This significantly increases your chances of receiving funding through the Eswatini Government Scholarship loan. Pursuing courses in these fields is recommended if you intend to apply for government financial support.`;
    } else if (overall === 'MEDIUM') {
      const names = topPriority.map(f => f.field).join(', ');
      interpretation = `You have alignment with at least one priority programme${names ? ` (${names})` : ''}. Consider focusing your studies on priority areas where possible to improve your chances of receiving government funding.`;
    } else {
      interpretation = 'Your current interests do not strongly align with the government\u2019s priority programmes. This does not disqualify you from applying, but your chances of receiving funding may be lower. Consider speaking with a career counsellor about how your skills might apply to priority fields, or explore alternative funding sources.';
    }

    return {
      overall,
      fields: fields.filter(f => f.alignment !== 'LOW').slice(0, 8),
      allFields: fields,
      interpretation,
      priorityFieldCount,
      nonPriorityFieldCount,
      applicationUrl: 'https://slas.gov.sz/WelcomeToApplication.aspx',
      applicationFormUrl: 'https://slas.gov.sz/Documents/SCHOLARSHIP%20APPLICATION%20FORM.pdf',
      deadlines: {
        local: 'June 30th of each year',
        southAfrica: 'December 31st of each year',
      }
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
