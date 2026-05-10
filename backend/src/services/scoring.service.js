const { Answer, Assessment, Occupation, EducationLevel, AuditLog, User, Course, CourseRequirement, CourseInstitution, Institution, Subject, OccupationCourse, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/errors/appError');
const { decorateOccupation } = require('../utils/occupationDisplay');

/**
 * Holland Code → Career Focus description per user type
 */
const CAREER_FOCUS = {
  high_school_student: 'Your results focus on school subjects, study pathways, and career fields to explore next.',
  university_student: 'Your results focus on tertiary pathways, specializations, and opportunities after your current studies.',
  professional: 'Your results focus on relevant career opportunities, transitions, and upskilling pathways.'
};

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
const BINARY_SECTIONS = new Set(['activities', 'competencies', 'occupations']);
const VALID_SECTIONS = new Set(['activities', 'competencies', 'occupations', 'self_estimates']);
const MAX_OCCUPATION_RECOMMENDATIONS = 8;
const MAX_COURSE_RECOMMENDATIONS = 8;
const STRICT_OCCUPATION_THRESHOLD = 150;
const FALLBACK_OCCUPATION_THRESHOLD = 100;
const STRICT_COURSE_THRESHOLD = 150;
const FALLBACK_COURSE_THRESHOLD = 95;

const QUALIFICATION_RANK = {
  certificate: 1,
  tvet: 2,
  short_course: 2,
  diploma: 3,
  bachelor: 4,
  honours: 5,
  postgrad_diploma: 5,
  masters: 6,
  doctorate: 7,
  other: 0
};

const BOOK_SOURCE_RANK = {
  OES: 5,
  SOC: 4,
  COC: 3,
  DOT: 2
};

/**
 * SDS Scoring Service
 * Handles the calculation of RIASEC scores, career matching,
 * and the full careers → courses → institutions recommendation chain.
 */
class ScoringService {
  normalizeHollandCode(code) {
    return String(code || '').toUpperCase().replace(/[^RIASEC]/g, '').slice(0, 3);
  }

  normalizeUserType(userType) {
    const normalized = String(userType || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
    if (normalized.includes('professional')) return 'professional';
    if (normalized.includes('university') || normalized.includes('tertiary')) return 'university_student';
    if (normalized.includes('school') || normalized.includes('learner') || normalized.includes('student')) {
      return 'high_school_student';
    }
    return 'high_school_student';
  }

  getCourseAudienceConfig(userType) {
    const type = this.normalizeUserType(userType);
    if (type === 'professional') {
      return {
        type,
        label: 'Career Growth and Upskilling',
        suggestedSubjectMode: 'none',
        allowedQualifications: null,
        qualificationBonus: {
          masters: 65,
          doctorate: 58,
          honours: 52,
          postgrad_diploma: 52,
          short_course: 16,
          bachelor: 0,
          diploma: -8,
          tvet: -12,
          certificate: -12
        }
      };
    }

    if (type === 'university_student') {
      return {
        type,
        label: 'Tertiary Pathways and Opportunities',
        suggestedSubjectMode: 'none',
        allowedQualifications: new Set(['diploma', 'bachelor', 'honours', 'postgrad_diploma', 'masters', 'doctorate', 'short_course', 'other']),
        qualificationBonus: {
          masters: 18,
          honours: 16,
          postgrad_diploma: 16,
          bachelor: 8,
          diploma: 0,
          short_course: 4,
          tvet: -10,
          certificate: -12
        }
      };
    }

    return {
      type,
      label: 'School Subjects, Study Options, and Career Paths',
      suggestedSubjectMode: 'high_school',
      allowedQualifications: new Set(['certificate', 'tvet', 'short_course', 'diploma', 'bachelor', 'other']),
      qualificationBonus: {
        bachelor: 12,
        diploma: 10,
        tvet: 8,
        certificate: 6,
        short_course: 4,
        honours: -25,
        postgrad_diploma: -25,
        masters: -35,
        doctorate: -40
      }
    };
  }

  getOccupationSourceRank(occupation) {
    const source = String(occupation?.source || '').toUpperCase();
    const key = Object.keys(BOOK_SOURCE_RANK).find((candidate) => source.includes(candidate));
    return key ? BOOK_SOURCE_RANK[key] : 1;
  }

  getAudienceCourseBonus(course, audience) {
    const type = course?.qualificationType || course?.qualification_type || 'other';
    return Number(audience?.qualificationBonus?.[type] || 0);
  }

  isCourseAllowedForAudience(course, audience) {
    if (!audience?.allowedQualifications) return true;
    return audience.allowedQualifications.has(course?.qualificationType || course?.qualification_type || 'other');
  }

  getCandidateCodes(record) {
    const values = [];
    if (record?.code) values.push(record.code);
    const hollandCodes = record?.hollandCodes || record?.holland_codes;
    if (Array.isArray(hollandCodes)) values.push(...hollandCodes);
    const riasecCodes = record?.riasecCodes || record?.riasec_codes;
    if (Array.isArray(riasecCodes)) values.push(...riasecCodes);
    return [...new Set(values.map((value) => this.normalizeHollandCode(value)).filter((value) => value.length === 3))];
  }

  parseDisplayCodeGroups(displayCode) {
    const raw = String(displayCode || '').toUpperCase().trim();
    if (!raw) return [];
    return raw
      .split(/\s+/)
      .flatMap((group) => {
        const cleaned = group.replace(/[^RIASEC/]/g, '');
        if (!cleaned) return [];
        if (!cleaned.includes('/')) {
          return cleaned.split('').filter((letter) => RIASEC_KEYS.includes(letter)).map((letter) => [letter]);
        }
        return [cleaned
          .split('/')
          .map((letter) => letter.trim())
          .filter((letter) => RIASEC_KEYS.includes(letter))];
      })
      .filter((group) => group.length > 0);
  }

  getRankGroupsForMatching(code, displayCode = null) {
    const primary = this.normalizeHollandCode(code);
    const groups = this.parseDisplayCodeGroups(displayCode || code);
    const rankGroups = groups
      .slice(0, 3)
      .map((group) => [...new Set(group.filter((letter) => RIASEC_KEYS.includes(letter)))])
      .filter((group) => group.length > 0);

    while (rankGroups.length < 3 && primary[rankGroups.length]) {
      rankGroups.push([primary[rankGroups.length]]);
    }

    return rankGroups.slice(0, 3);
  }

  getLettersForMatching(code, displayCode = null) {
    const rankGroups = this.getRankGroupsForMatching(code, displayCode);
    const letters = rankGroups.flat();
    if (letters.length > 0) return [...new Set(letters)];
    return this.normalizeHollandCode(code).split('');
  }

  getPrimaryLettersForMatching(code, displayCode = null) {
    const rankGroups = this.getRankGroupsForMatching(code, displayCode);
    const firstRank = rankGroups[0] || [];
    if (firstRank.length > 0) return [...new Set(firstRank)];
    const primary = this.normalizeHollandCode(code).charAt(0);
    return primary ? [primary] : [];
  }

  buildCodeVariants(code, displayCode = null) {
    const variants = new Set();
    const primary = this.normalizeHollandCode(code);
    if (primary.length === 3) variants.add(primary);

    const rankGroups = this.getRankGroupsForMatching(primary, displayCode);
    const maxVariants = 24;
    const addVariant = (letters) => {
      if (variants.size >= maxVariants) return;
      const variant = this.normalizeHollandCode(letters.join(''));
      if (variant.length === 3) variants.add(variant);
    };
    const pickPermutations = (letters, size) => {
      const unique = [...new Set(letters)];
      if (size <= 0) return [[]];
      if (size > unique.length) return [];
      const output = [];
      const walk = (remaining, chosen) => {
        if (chosen.length === size) {
          output.push(chosen);
          return;
        }
        remaining.forEach((letter, index) => {
          walk(
            remaining.filter((_, candidateIndex) => candidateIndex !== index),
            [...chosen, letter]
          );
        });
      };
      walk(unique, []);
      return output;
    };

    if (rankGroups.length === 3 && rankGroups.every((group) => group.length > 0)) {
      const generated = [];
      const walk = (index, letters) => {
        if (generated.length >= maxVariants) return;
        if (index === 3) {
          generated.push(letters.join(''));
          return;
        }
        rankGroups[index].forEach((letter) => walk(index + 1, [...letters, letter]));
      };
      walk(0, []);
      generated.forEach((variant) => variants.add(variant));
    }

    // Also include compact top-three interpretations when a tie group spans
    // multiple code positions, e.g. "A/E R I" -> AER and EAR.
    const buildCompactVariants = (groupIndex, letters) => {
      if (variants.size >= maxVariants || letters.length === 3) {
        addVariant(letters);
        return;
      }
      const group = rankGroups[groupIndex];
      if (!group) return;
      const remainingSlots = 3 - letters.length;
      const takeCount = Math.min(remainingSlots, group.length);
      pickPermutations(group, takeCount).forEach((choice) => {
        buildCompactVariants(groupIndex + 1, [...letters, ...choice]);
      });
    };
    buildCompactVariants(0, []);

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
    const rankWeights = [1.0, 0.9, 0.75];

    variants.forEach((variant) => {
      this.normalizeHollandCode(variant).split('').forEach((letter, index) => {
        weights[letter] = Math.max(weights[letter], rankWeights[index] || 0);
      });
    });

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

  bestWeightedCodeScore(weights, candidateCodes = []) {
    const codes = Array.isArray(candidateCodes) ? candidateCodes : [];
    return codes.reduce((max, code) => {
      const score = this.scoreCandidateByWeights(weights, code);
      return score > max ? score : max;
    }, 0);
  }

  hasPrimaryCodeMatch(candidateCodes = [], primaryLetter) {
    if (!primaryLetter) return false;
    return (Array.isArray(candidateCodes) ? candidateCodes : [])
      .some((code) => this.normalizeHollandCode(code).charAt(0) === primaryLetter);
  }

  hasAnyPrimaryCodeMatch(candidateCodes = [], primaryLetters = []) {
    const allowed = new Set((Array.isArray(primaryLetters) ? primaryLetters : [primaryLetters])
      .filter((letter) => RIASEC_KEYS.includes(letter)));
    if (allowed.size === 0) return false;
    return (Array.isArray(candidateCodes) ? candidateCodes : [])
      .some((code) => allowed.has(this.normalizeHollandCode(code).charAt(0)));
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
    const threshold = Number.isFinite(Number(tieThreshold)) ? Number(tieThreshold) : 0;
    const rankGroups = [];
    ranked.forEach((row) => {
      if (rankGroups.length === 0) {
        rankGroups.push([row]);
        return;
      }
      const lastGroup = rankGroups[rankGroups.length - 1];
      if (Math.abs(lastGroup[0].score - row.score) <= threshold) {
        lastGroup.push(row);
      } else {
        rankGroups.push([row]);
      }
    });

    // Show top three ranking groups, using "/" for tied letters and spaces between ranks.
    const displayCode = rankGroups
      .slice(0, 3)
      .map((group) => group.map((entry) => entry.letter).join('/'))
      .join(' ')
      .trim() || primaryCode;

    return { primaryCode, displayCode, ranked };
  }

  getScoreTotals(source = {}) {
    return RIASEC_KEYS.reduce((acc, key) => {
      const snakeKey = `score_${key.toLowerCase()}`;
      acc[key] = Number(
        source?.[`score${key}`] ??
        source?.[snakeKey] ??
        source?.get?.(`score${key}`) ??
        source?.get?.(snakeKey) ??
        0
      );
      return acc;
    }, {});
  }

  getDisplayCodeFromScores(scores = {}, fallbackCode = '') {
    const hasScores = RIASEC_KEYS.some((key) => Number(scores?.[key] || 0) > 0);
    if (!hasScores) return fallbackCode || '';
    return this.buildHollandCodes(scores, 0).displayCode || fallbackCode || '';
  }

  getAssessmentDisplayCode(assessment, fallbackCode = '') {
    if (!assessment) return fallbackCode || '';
    const totals = this.getScoreTotals(assessment);
    const storedDisplay = assessment?.hollandCodeDisplay || assessment?.holland_code_display || assessment?.get?.('hollandCodeDisplay') || assessment?.get?.('holland_code_display');
    const storedPrimary = assessment?.hollandCode || assessment?.holland_code || assessment?.get?.('hollandCode') || assessment?.get?.('holland_code');
    return this.getDisplayCodeFromScores(totals, storedDisplay || storedPrimary || fallbackCode || '');
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

      if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');

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
        hollandCodeDisplay,
        status: 'completed',
        completedAt: new Date(),
        educationLevelAtTest: assessment.user.educationLevel 
      }, { transaction });

      const recommendations = await this.getRecommendations(
        hollandCode, 
        assessment.user.educationLevel,
        transaction,
        {
          scores: totals,
          displayCode: hollandCodeDisplay,
          userType: assessment.user?.userType,
          degreeProgram: assessment.user?.degreeProgram,
          yearOfStudy: assessment.user?.yearOfStudy,
          yearsExperience: assessment.user?.yearsExperience
        }
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
  async getSuggestedSubjects(hollandCode, transaction = null, userType = null) {
    if (!hollandCode) return [];
    const audience = this.getCourseAudienceConfig(userType);
    if (audience.suggestedSubjectMode === 'none') return [];
    
    try {
      const opts = transaction ? { transaction } : {};
      const letters = [...new Set(String(hollandCode || '').toUpperCase().replace(/[^RIASEC]/g, '').split('').filter(Boolean))];
      if (letters.length === 0) return [];
      
      const subjects = await Subject.findAll({
        where: {
          isActive: true,
          level: { [Op.in]: ['high_school', 'both'] },
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
    const audience = this.getCourseAudienceConfig(profile?.userType);
    const matchLetters = this.getLettersForMatching(normalizedCode, profile?.displayCode);
    const codeLetters = matchLetters.length
      ? matchLetters
      : RIASEC_KEYS
          .filter((k) => Number(weights?.[k] || 0) > 0)
          .sort((a, b) => Number(weights[b] || 0) - Number(weights[a] || 0))
          .slice(0, 3);
    const primaryLetters = this.getPrimaryLettersForMatching(normalizedCode, profile?.displayCode);
    const candidateCodeSet = [...new Set([...variants, normalizedCode].filter((value) => this.normalizeHollandCode(value).length === 3))];

    // 1. Validate education level
    const levelExists = eduLevel
      ? await EducationLevel.findByPk(eduLevel, opts)
      : null;

    // 2. Find matching occupations (exact code match or any letter overlap)
    const occupationBaseIncludes = [];
    const occupationHydrateIncludes = [
      { model: EducationLevel, as: 'education' },
      {
        model: Course, as: 'courses', required: false,
        through: { attributes: ['relevanceScore', 'isPrimaryPathway'] },
        attributes: ['id', 'name', 'qualificationType', 'durationYears', 'riasecCodes', 'fundingPriority'],
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
        ...(candidateCodeSet.length > 0 ? [{ code: { [Op.in]: candidateCodeSet } }] : []),
        ...(candidateCodeSet.length > 0 ? [{ hollandCodes: { [Op.overlap]: candidateCodeSet } }] : []),
        ...(primaryLetters.length > 0 ? [{ primaryRiasec: { [Op.in]: primaryLetters } }] : []),
      ]
    };

    let occupations = await Occupation.findAll({
      where: occupationWhere,
      attributes: [
        'id', 'code', 'name', 'hollandCodes', 'primaryRiasec',
        'secondaryRiasec', 'availableInEswatini', 'source', 'consistencyScore'
      ],
      include: occupationBaseIncludes,
      ...opts
    });
    const rankedOccupations = occupations
      .map((occ) => {
        const candidateCodes = this.getCandidateCodes(occ);
        const weightedScore = this.bestWeightedCodeScore(weights, candidateCodes);
        occ.setDataValue('relevanceScore', Number((weightedScore * 100).toFixed(2)));
        occ.setDataValue('sourceRank', this.getOccupationSourceRank(occ));
        return occ;
      })
      .filter((occ) => {
        const relevance = occ.getDataValue('relevanceScore');
        if (relevance >= STRICT_OCCUPATION_THRESHOLD) return true;
        const candidateCodes = this.getCandidateCodes(occ);
        return relevance >= FALLBACK_OCCUPATION_THRESHOLD && this.hasAnyPrimaryCodeMatch(candidateCodes, primaryLetters);
      })
      .sort((a, b) => {
        const byScore = b.getDataValue('relevanceScore') - a.getDataValue('relevanceScore');
        if (byScore !== 0) return byScore;
        const bySource = b.getDataValue('sourceRank') - a.getDataValue('sourceRank');
        if (bySource !== 0) return bySource;
        const byConsistency = Number(b.consistencyScore || 0) - Number(a.consistencyScore || 0);
        if (byConsistency !== 0) return byConsistency;
        return a.name.localeCompare(b.name);
      })
      .slice(0, MAX_OCCUPATION_RECOMMENDATIONS * 2);

    if (rankedOccupations.length > 0) {
      const rankedMeta = new Map(rankedOccupations.map((occ, index) => [occ.id, {
        order: index,
        relevanceScore: occ.getDataValue('relevanceScore'),
        sourceRank: occ.getDataValue('sourceRank')
      }]));
      const hydrated = await Occupation.findAll({
        where: { id: { [Op.in]: rankedOccupations.map((occ) => occ.id) } },
        include: occupationHydrateIncludes,
        ...opts
      });
      occupations = hydrated
        .map((occ) => {
          const meta = rankedMeta.get(occ.id);
          occ.setDataValue('relevanceScore', meta?.relevanceScore || 0);
          occ.setDataValue('sourceRank', meta?.sourceRank || 0);
          occ.setDataValue('recommendationOrder', meta?.order ?? 999);
          return decorateOccupation(occ);
        })
        .sort((a, b) => a.getDataValue('recommendationOrder') - b.getDataValue('recommendationOrder'))
        .filter((occ, index, list) => {
          const displayName = String(occ.getDataValue('displayName') || occ.name || '').toLowerCase();
          return displayName && list.findIndex((item) => String(item.getDataValue('displayName') || item.name || '').toLowerCase() === displayName) === index;
        })
        .slice(0, MAX_OCCUPATION_RECOMMENDATIONS);
    } else {
      occupations = [];
    }

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
          }
        ],
        order: [['funding_priority', 'DESC'], ['name', 'ASC']],
        ...opts
      });

      courses = broadCourses
        .filter((course) => this.isCourseAllowedForAudience(course, audience))
        .map((course) => {
          const candidateCodes = Array.isArray(course.riasecCodes) ? course.riasecCodes : [];
          const weightedScore = this.bestWeightedCodeScore(weights, candidateCodes);
          const hasInstitutionLink = Array.isArray(course.courseInstitutions) && course.courseInstitutions.length > 0;
          const institutionScore = hasInstitutionLink ? 10 : 0;
          const priorityScore = course.fundingPriority ? 4 : 0;
          const audienceScore = this.getAudienceCourseBonus(course, audience);
          const baseRelevanceScore = Number((weightedScore * 100).toFixed(2)) + institutionScore + priorityScore;
          const relevanceScore = baseRelevanceScore + audienceScore;
          course.setDataValue('baseRelevanceScore', baseRelevanceScore);
          course.setDataValue('relevanceScore', relevanceScore);
          return course;
        })
        .filter((course) => {
          const relevance = course.getDataValue('baseRelevanceScore');
          if (relevance >= STRICT_COURSE_THRESHOLD) return true;
          const candidateCodes = Array.isArray(course.riasecCodes) ? course.riasecCodes : [];
          return relevance >= FALLBACK_COURSE_THRESHOLD && this.hasAnyPrimaryCodeMatch(candidateCodes, primaryLetters);
        })
        .sort((a, b) => {
          const byScore = b.getDataValue('relevanceScore') - a.getDataValue('relevanceScore');
          if (byScore !== 0) return byScore;
          const byRank = (QUALIFICATION_RANK[b.qualificationType] || 0) - (QUALIFICATION_RANK[a.qualificationType] || 0);
          if (audience.type === 'professional' && byRank !== 0) return byRank;
          return a.name.localeCompare(b.name);
        })
        .slice(0, MAX_COURSE_RECOMMENDATIONS);
    } catch (_err) {
      courses = [];
    }

    // 4. Suggested subjects from Holland code (dynamic from database)
    const suggestedSubjects = await this.getSuggestedSubjects(profile?.displayCode || code, transaction, audience.type);

    // 5. Government Funding Priority Alignment (driven by course.funding_priority)
    const fundingAlignment = this.computeFundingAlignment(normalizedCode, courses);

    return {
      occupations,
      courses,
      suggestedSubjects,
      fundingAlignment,
      hollandCode: normalizedCode,
      educationLevel: levelExists,
      audience: {
        type: audience.type,
        label: audience.label,
        focusMessage: this.getCareerFocusMessage(audience.type)
      }
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
    const type = this.normalizeUserType(userType);
    return CAREER_FOCUS[type] || CAREER_FOCUS.high_school_student;
  }
}

module.exports = new ScoringService();
