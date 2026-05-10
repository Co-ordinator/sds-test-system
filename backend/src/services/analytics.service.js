'use strict';

const {
  User, Assessment, Institution, Occupation, Course,
  CourseInstitution, OccupationCourse
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const scoringService = require('./scoring.service');

const ASSESSMENT_SCORE_ATTRIBUTES = [
  'id', 'hollandCode', 'hollandCodeDisplay',
  'scoreR', 'scoreI', 'scoreA', 'scoreS', 'scoreE', 'scoreC'
];

/* ─────────────────────────────────────────────────────────────────────────────
 * Internal helpers (private to this module)
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Build Sequelize where/include clauses from flat query-string filter params.
 */
const buildFilters = (query = {}) => {
  const { institutionId, region, userType, institutionType, startDate, endDate } = query;
  const userWhere = {};
  const institutionWhere = {};
  const assessmentWhere = {};

  if (institutionId) userWhere.institutionId = institutionId;
  if (region) userWhere.region = region;
  if (userType) userWhere.userType = userType;
  if (institutionType) institutionWhere.type = institutionType;

  if (startDate || endDate) {
    assessmentWhere.createdAt = {};
    if (startDate) assessmentWhere.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) assessmentWhere.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
  }

  const userInclude = Object.keys(institutionWhere).length > 0
    ? [{ model: Institution, as: 'institution', required: true, attributes: [], where: institutionWhere }]
    : [];

  const assessmentInclude = Object.keys(userWhere).length > 0 || userInclude.length > 0
    ? [{ model: User, as: 'user', required: true, attributes: [], where: userWhere, include: userInclude }]
    : [];

  return { userWhere, institutionWhere, assessmentWhere, userInclude, assessmentInclude };
};

/**
 * Count users matching combined where + include constraints.
 */
const countUsers = ({ userWhere, userInclude, extraWhere = {} }) => {
  if (userInclude.length > 0) {
    return User.count({ where: { ...userWhere, ...extraWhere }, include: userInclude, distinct: true, col: 'id' });
  }
  return User.count({ where: { ...userWhere, ...extraWhere } });
};

const getAssessmentDisplayCode = (assessment) => {
  return scoringService.getAssessmentDisplayCode(assessment, '') || '';
};

const getIncludedUser = (assessment) => assessment?.user || assessment?.get?.('user') || null;

const mapDisplayCodeCounts = (assessments, { limit, countKey = 'count' } = {}) => {
  const counts = assessments.reduce((acc, assessment) => {
    const code = getAssessmentDisplayCode(assessment);
    if (!code) return acc;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {});

  const rows = Object.entries(counts)
    .map(([code, count]) => ({
      hollandCode: code,
      hollandCodeDisplay: code,
      count,
      [countKey]: count
    }))
    .sort((a, b) => Number(b[countKey]) - Number(a[countKey]) || a.hollandCode.localeCompare(b.hollandCode));

  return limit ? rows.slice(0, limit) : rows;
};

const getDisplayCodeDistribution = async (assessmentWhere, assessmentInclude, { extraWhere = {}, limit, countKey = 'count' } = {}) => {
  const assessments = await Assessment.findAll({
    where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null }, ...extraWhere },
    include: assessmentInclude,
    attributes: ASSESSMENT_SCORE_ATTRIBUTES
  });
  return mapDisplayCodeCounts(assessments, { limit, countKey });
};

const getGroupedDisplayCodeDistribution = async ({ assessmentWhere, include, groupKey, groupGetter }) => {
  const assessments = await Assessment.findAll({
    where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
    include,
    attributes: ASSESSMENT_SCORE_ATTRIBUTES
  });

  const counts = assessments.reduce((acc, assessment) => {
    const groupValue = groupGetter(assessment);
    const code = getAssessmentDisplayCode(assessment);
    if (!groupValue || !code) return acc;
    const key = `${groupValue}::${code}`;
    if (!acc[key]) acc[key] = { [groupKey]: groupValue, hollandCode: code, hollandCodeDisplay: code, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(counts)
    .sort((a, b) => Number(b.count) - Number(a.count) || String(a[groupKey]).localeCompare(String(b[groupKey])) || a.hollandCode.localeCompare(b.hollandCode));
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Analytics Service — pure data layer, no HTTP concerns
 * ──────────────────────────────────────────────────────────────────────────── */

const analyticsService = {

  /* ── 1. Overview KPIs ────────────────────────────────────────────────────── */
  getOverview: async (query = {}) => {
    const { userWhere, assessmentWhere, userInclude, assessmentInclude } = buildFilters(query);

    const [testTakerCount, testAdministratorCount] = await Promise.all([
      countUsers({ userWhere, userInclude: assessmentInclude[0]?.include || [], extraWhere: { role: 'Test Taker' } }),
      User.count({ where: { role: 'Test Administrator' } })
    ]);

    const totalAssessments = await Assessment.count({ where: assessmentWhere, include: assessmentInclude });
    const completedAssessments = await Assessment.count({ where: { ...assessmentWhere, status: 'completed' }, include: assessmentInclude });
    const completionRate = totalAssessments === 0 ? 0 : (completedAssessments / totalAssessments) * 100;

    const averages = await Assessment.findOne({
      where: { ...assessmentWhere, status: 'completed' },
      attributes: [
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
      ],
      include: assessmentInclude,
      raw: true
    });

    const totalUsers = await countUsers({ userWhere, userInclude });

    return {
      totals: { users: totalUsers, testTakers: testTakerCount, testAdministrators: testAdministratorCount, assessments: totalAssessments, completedAssessments },
      completionRate: Number(completionRate.toFixed(2)),
      riasecAverages: averages
    };
  },

  /* ── 2. Holland Code Distribution ───────────────────────────────────────── */
  getHollandDistribution: async (query = {}) => {
    const { assessmentWhere, assessmentInclude } = buildFilters(query);

    const distribution = await getDisplayCodeDistribution(assessmentWhere, assessmentInclude);

    return { distribution };
  },

  /* ── 3. Monthly Assessment Trend ────────────────────────────────────────── */
  getTrend: async (query = {}) => {
    const { assessmentWhere, assessmentInclude } = buildFilters(query);
    const assessmentCreatedAt = Assessment.sequelize.col('Assessment.created_at');
    const assessmentId = Assessment.sequelize.col('Assessment.id');

    const trendWhere = { ...assessmentWhere };
    if (!trendWhere.createdAt) {
      trendWhere.createdAt = { [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) };
    } else if (!trendWhere.createdAt[Op.gte]) {
      trendWhere.createdAt[Op.gte] = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    }

    const trend = await Assessment.findAll({
      where: trendWhere,
      include: assessmentInclude,
      attributes: [
        [Assessment.sequelize.fn('DATE_TRUNC', 'month', assessmentCreatedAt), 'month'],
        [Assessment.sequelize.fn('COUNT', assessmentId), 'total'],
        [Assessment.sequelize.fn('SUM', Assessment.sequelize.literal("CASE WHEN status='completed' THEN 1 ELSE 0 END")), 'completed']
      ],
      group: [Assessment.sequelize.fn('DATE_TRUNC', 'month', assessmentCreatedAt)],
      order: [[Assessment.sequelize.fn('DATE_TRUNC', 'month', assessmentCreatedAt), 'ASC']],
      raw: true
    });

    return { trend };
  },

  /* ── 4. Regional Breakdown ──────────────────────────────────────────────── */
  getRegional: async (query = {}) => {
    const { userWhere: baseUserWhere, assessmentWhere, userInclude } = buildFilters(query);
    const userWhere = { ...baseUserWhere, role: 'Test Taker', region: baseUserWhere.region || { [Op.ne]: null } };

    const assessmentInclude = [{
      model: User, as: 'user', attributes: [], where: userWhere, required: true, include: userInclude
    }];

    const [usersByRegion, assessmentsByRegion, completedByRegion, hollandByRegion, userTypeDistribution] = await Promise.all([
      User.findAll({
        where: userWhere, include: userInclude,
        attributes: ['region', [fn('COUNT', col('User.id')), 'totalUsers']],
        group: ['region'], raw: true
      }),
      Assessment.findAll({
        where: assessmentWhere,
        include: assessmentInclude,
        attributes: [
          [col('user.region'), 'region'],
          [fn('COUNT', col('Assessment.id')), 'totalAssessments'],
        ],
        group: [col('user.region')], raw: true
      }),
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed' },
        include: assessmentInclude,
        attributes: [
          [col('user.region'), 'region'],
          [fn('COUNT', col('Assessment.id')), 'completedAssessments'],
          [fn('AVG', col('Assessment.score_r')), 'avgR'],
          [fn('AVG', col('Assessment.score_i')), 'avgI'],
          [fn('AVG', col('Assessment.score_a')), 'avgA'],
          [fn('AVG', col('Assessment.score_s')), 'avgS'],
          [fn('AVG', col('Assessment.score_e')), 'avgE'],
          [fn('AVG', col('Assessment.score_c')), 'avgC'],
        ],
        group: [col('user.region')], raw: true
      }),
      getGroupedDisplayCodeDistribution({
        assessmentWhere,
        include: [{
          model: User,
          as: 'user',
          attributes: ['region'],
          where: userWhere,
          required: true,
          include: userInclude
        }],
        groupKey: 'region',
        groupGetter: (assessment) => getIncludedUser(assessment)?.region
      }),
      User.findAll({
        where: { ...userWhere, userType: userWhere.userType || { [Op.ne]: null } },
        attributes: ['userType', [fn('COUNT', col('id')), 'count']],
        group: ['userType'], raw: true
      })
    ]);

    const REGIONS = ['hhohho', 'manzini', 'lubombo', 'shiselweni'];
    const regionMap = {};
    REGIONS.forEach(r => {
      regionMap[r] = { region: r, totalUsers: 0, totalAssessments: 0, completedAssessments: 0, topCode: null, avgR: 0, avgI: 0, avgA: 0, avgS: 0, avgE: 0, avgC: 0 };
    });
    usersByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r]) regionMap[r].totalUsers = parseInt(row.totalUsers, 10) || 0;
    });
    assessmentsByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r]) regionMap[r].totalAssessments = parseInt(row.totalAssessments, 10) || 0;
    });
    const pickAvg = (row, l) => {
      const k = `avg${l}`;
      const v = row[k] ?? row[k.toLowerCase()];
      return parseFloat(v ?? 0);
    };
    completedByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r]) {
        regionMap[r].completedAssessments = parseInt(row.completedAssessments, 10) || 0;
        ['R', 'I', 'A', 'S', 'E', 'C'].forEach((l) => {
          regionMap[r][`avg${l}`] = pickAvg(row, l).toFixed(1);
        });
      }
    });
    const seen = {};
    hollandByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r] && !seen[r]) { regionMap[r].topCode = row.hollandCode; seen[r] = true; }
    });

    const totalUsers = await countUsers({ userWhere, userInclude });
    const totalAssessments = await Assessment.count({ where: assessmentWhere, include: assessmentInclude });
    const completedAssessments = await Assessment.count({ where: { ...assessmentWhere, status: 'completed' }, include: assessmentInclude });

    return {
      summary: { totalUsers, totalAssessments, completedAssessments },
      regions: Object.values(regionMap),
      hollandByRegion,
      userTypeDistribution
    };
  },

  /* ── 5. Per-Institution Breakdown ───────────────────────────────────────── */
  getInstitutionBreakdown: async (query = {}) => {
    const { userWhere, institutionWhere, assessmentWhere } = buildFilters(query);
    const institutionInclude = {
      model: Institution,
      as: 'institution',
      attributes: ['id', 'name', 'region', 'type'],
      required: Object.keys(institutionWhere).length > 0,
      where: institutionWhere
    };

    const assessments = await Assessment.findAll({
      where: assessmentWhere,
      include: [{
        model: User,
        as: 'user',
        required: true,
        attributes: ['id', 'institutionId', 'region', 'userType'],
        where: { ...userWhere, role: 'Test Taker' },
        include: [institutionInclude]
      }],
      attributes: [...ASSESSMENT_SCORE_ATTRIBUTES, 'status', 'userId', 'createdAt', 'completedAt']
    });

    const institutionMap = {};
    assessments.forEach((assessment) => {
      const user = assessment.user || assessment.get?.('user');
      const institution = user?.institution || user?.get?.('institution');
      const key = institution?.id || user?.institutionId || `unknown:${user?.region || 'unknown'}`;
      if (!institutionMap[key]) {
        institutionMap[key] = {
          institutionId: institution?.id || null,
          institutionName: institution?.name || 'Unknown Institution',
          region: institution?.region || user?.region || 'unknown',
          type: institution?.type || 'unknown',
          userIds: new Set(),
          totalAssessments: 0,
          completedAssessments: 0,
          codeCounts: {}
        };
      }

      const row = institutionMap[key];
      if (user?.id) row.userIds.add(user.id);
      row.totalAssessments += 1;
      if (assessment.status === 'completed') {
        row.completedAssessments += 1;
        const code = getAssessmentDisplayCode(assessment);
        if (code) row.codeCounts[code] = (row.codeCounts[code] || 0) + 1;
      }
    });

    const results = Object.values(institutionMap)
      .map((row) => {
        const topCode = Object.entries(row.codeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        return {
          institutionId: row.institutionId,
          institutionName: row.institutionName,
          region: row.region,
          type: row.type,
          totalStudents: row.userIds.size,
          totalAssessments: row.totalAssessments,
          completedAssessments: row.completedAssessments,
          completionRate: row.totalAssessments > 0 ? Number(((row.completedAssessments / row.totalAssessments) * 100).toFixed(1)) : 0,
          topCode
        };
      })
      .sort((a, b) => b.totalAssessments - a.totalAssessments || a.institutionName.localeCompare(b.institutionName));

    return { institutions: results };
  },

  /* ── 6. Career Knowledge Graph ──────────────────────────────────────────── */
  getKnowledgeGraph: async (query = {}) => {
    const { userWhere, assessmentWhere, userInclude, assessmentInclude } = buildFilters(query);
    /* Include NULL — bulk occupation seed often leaves demand_level unset */
    const demandDistribution = await Occupation.findAll({
      attributes: ['demandLevel', [fn('COUNT', col('id')), 'count']],
      group: ['demandLevel'],
      order: [[literal('"count"'), 'DESC']],
      raw: true
    });

    /* Include NULL so catalogs seeded without local_demand (common) still show an honest slice */
    const localDemandDist = await Occupation.findAll({
      attributes: ['localDemand', [fn('COUNT', col('id')), 'count']],
      group: ['localDemand'],
      order: [[literal('"count"'), 'DESC']],
      raw: true
    });

    const riasecCareerFlow = await Occupation.findAll({
      attributes: ['primaryRiasec', [fn('COUNT', col('id')), 'count']],
      where: { primaryRiasec: { [Op.ne]: null } },
      group: ['primaryRiasec'], order: [[literal('"count"'), 'DESC']], raw: true
    });

    const coursesByQualType = await Course.findAll({
      attributes: ['qualificationType', [fn('COUNT', col('id')), 'count']],
      where: { isActive: true },
      group: ['qualificationType'], order: [[literal('"count"'), 'DESC']], raw: true
    });

    const institutionCoverage = await CourseInstitution.findAll({
      attributes: [
        [col('CourseInstitution.institution_id'), 'institutionId'],
        [fn('COUNT', col('CourseInstitution.id')), 'courseCount']
      ],
      where: { isActive: true },
      include: [{ model: Institution, as: 'institution', attributes: ['name', 'type', 'region'] }],
      group: [col('CourseInstitution.institution_id'), col('institution.id')],
      order: [[fn('COUNT', col('CourseInstitution.id')), 'DESC']],
      raw: true, nest: true
    });

    const allOccupations = await Occupation.findAll({
      attributes: ['id', 'skills', 'primaryRiasec', 'name', 'demandLevel', 'localDemand', 'category'],
      order: [['name', 'ASC']],
      raw: true
    });
    const skillFreq = {};
    allOccupations.forEach(occ => {
      (occ.skills || []).forEach(skill => {
        const s = skill.trim();
        if (s) skillFreq[s] = (skillFreq[s] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillFreq)
      .sort(([, a], [, b]) => b - a).slice(0, 30)
      .map(([skill, count]) => ({ skill, count }));

    const topHollandCareerMatches = await getDisplayCodeDistribution(
      assessmentWhere,
      assessmentInclude,
      { limit: 15, countKey: 'assessmentCount' }
    );

    const genderDist = await Assessment.findAll({
      where: { ...assessmentWhere, status: 'completed' },
      include: [{
        model: User, as: 'user', required: true, attributes: [],
        where: { ...userWhere, gender: { [Op.ne]: null } },
        include: userInclude
      }],
      attributes: [[col('user.gender'), 'gender'], [fn('COUNT', col('Assessment.id')), 'count']],
      group: [col('user.gender')], raw: true
    });

    const careerCategories = await Occupation.findAll({
      attributes: ['category', [fn('COUNT', col('id')), 'count']],
      where: { category: { [Op.ne]: null } },
      group: ['category'], order: [[literal('"count"'), 'DESC']], raw: true
    });

    const topCareers = allOccupations
      .filter(o => o.primaryRiasec)
      .map(o => ({
        id: o.id,
        name: o.name,
        primaryRiasec: o.primaryRiasec,
        demandLevel: o.demandLevel,
        localDemand: o.localDemand,
        category: o.category
      }));

    const [totalOccupations, totalCourses, totalInstitutions, totalCourseLinks, totalCareerPathways] = await Promise.all([
      Occupation.count(),
      Course.count({ where: { isActive: true } }),
      Institution.count(),
      CourseInstitution.count({ where: { isActive: true } }),
      OccupationCourse.count()
    ]);

    /* Count active courses that align with each RIASEC letter. Course.riasec_codes may store
     * single letters (e.g. ['R','I']) or Holland profile strings (e.g. ['IRS','SAE']) from seed/admin.
     * Op.contains: ['R'] only matches an element exactly 'R', so Holland-style rows were missed. */
    const sq = Course.sequelize;
    const coursesPerRiasec = await Promise.all(
      ['R', 'I', 'A', 'S', 'E', 'C'].map(async (letter) => {
        const count = await Course.count({
          where: {
            [Op.and]: [
              { isActive: true },
              sq.where(
                sq.fn('COALESCE', sq.fn('array_to_string', sq.col('riasec_codes'), ','), ''),
                { [Op.iLike]: `%${letter}%` }
              )
            ]
          }
        });
        return { letter, count };
      })
    );

    /* PG: EXTRACT(DOW FROM ts) → 0=Sun … 6=Sat — matches frontend DOW_LABELS */
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const completionByDow = await Assessment.findAll({
      where: { ...assessmentWhere, status: 'completed', completedAt: { [Op.gte]: ninetyDaysAgo } },
      include: assessmentInclude,
      attributes: [
        [fn('EXTRACT', literal('DOW FROM completed_at')), 'dow'],
        [fn('COUNT', col('Assessment.id')), 'count']
      ],
      group: [fn('EXTRACT', literal('DOW FROM completed_at'))],
      order: [[fn('EXTRACT', literal('DOW FROM completed_at')), 'ASC']],
      raw: true
    });

    return {
      summary: { totalOccupations, totalCourses, totalInstitutions, totalCourseLinks, totalCareerPathways },
      demandDistribution, localDemandDist, riasecCareerFlow, coursesByQualType, institutionCoverage,
      topSkills, topHollandCareerMatches, genderDist, careerCategories, topCareers,
      coursesPerRiasec, completionByDow
    };
  },

  /* ── 7. Segmentation (gender × RIASEC, userType × RIASEC, Holland by gender) */
  getSegmentation: async (query = {}) => {
    const { userWhere, assessmentWhere, userInclude } = buildFilters(query);

    const [riasecByGender, riasecByUserType, hollandByGender] = await Promise.all([
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed' },
        include: [{ model: User, as: 'user', required: true, attributes: [], where: { ...userWhere, gender: { [Op.ne]: null } }, include: userInclude }],
        attributes: [
          [col('user.gender'), 'gender'],
          [fn('COUNT', col('Assessment.id')), 'count'],
          [fn('AVG', col('Assessment.score_r')), 'avgR'],
          [fn('AVG', col('Assessment.score_i')), 'avgI'],
          [fn('AVG', col('Assessment.score_a')), 'avgA'],
          [fn('AVG', col('Assessment.score_s')), 'avgS'],
          [fn('AVG', col('Assessment.score_e')), 'avgE'],
          [fn('AVG', col('Assessment.score_c')), 'avgC'],
        ],
        group: [col('user.gender')], raw: true
      }),
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed' },
        include: [{ model: User, as: 'user', required: true, attributes: [], where: { ...userWhere, userType: { [Op.ne]: null } }, include: userInclude }],
        attributes: [
          [col('user.user_type'), 'userType'],
          [fn('COUNT', col('Assessment.id')), 'count'],
          [fn('AVG', col('Assessment.score_r')), 'avgR'],
          [fn('AVG', col('Assessment.score_i')), 'avgI'],
          [fn('AVG', col('Assessment.score_a')), 'avgA'],
          [fn('AVG', col('Assessment.score_s')), 'avgS'],
          [fn('AVG', col('Assessment.score_e')), 'avgE'],
          [fn('AVG', col('Assessment.score_c')), 'avgC'],
        ],
        group: [col('user.user_type')], raw: true
      }),
      getGroupedDisplayCodeDistribution({
        assessmentWhere,
        include: [{
          model: User,
          as: 'user',
          required: true,
          attributes: ['gender'],
          where: { ...userWhere, gender: { [Op.ne]: null } },
          include: userInclude
        }],
        groupKey: 'gender',
        groupGetter: (assessment) => getIncludedUser(assessment)?.gender
      })
    ]);

    return { riasecByGender, riasecByUserType, hollandByGender };
  },

  /* ── 8. Skills Pipeline (30-day Holland momentum + emerging careers) ──────── */
  getSkillsPipeline: async (query = {}) => {
    const { assessmentWhere, assessmentInclude } = buildFilters(query);

    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 30);
    const priorStart = new Date(currentStart);
    priorStart.setDate(priorStart.getDate() - 30);

    const [currentDist, priorDist, emergingCareers] = await Promise.all([
      getDisplayCodeDistribution(assessmentWhere, assessmentInclude, { extraWhere: { completedAt: { [Op.gte]: currentStart } } }),
      getDisplayCodeDistribution(assessmentWhere, assessmentInclude, { extraWhere: { completedAt: { [Op.gte]: priorStart, [Op.lt]: currentStart } } }),
      Occupation.findAll({
        where: { localDemand: { [Op.in]: ['critical', 'high'] } },
        attributes: ['name', 'primaryRiasec', 'localDemand', 'demandLevel', 'category'],
        order: [['name', 'ASC']], limit: 20, raw: true
      })
    ]);

    const priorMap = {};
    priorDist.forEach(d => { priorMap[d.hollandCode] = Number(d.count); });

    const hollandPipeline = currentDist.map(d => {
      const current = Number(d.count);
      const prior = priorMap[d.hollandCode] || 0;
      const isNew = prior === 0 && current > 0;
      const growth = prior === 0 ? null : Math.round(((current - prior) / prior) * 100);
      return { code: d.hollandCode, current, prior, growth, isNew };
    }).sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      const growthA = Number.isFinite(Number(a.growth)) ? Number(a.growth) : -Infinity;
      const growthB = Number.isFinite(Number(b.growth)) ? Number(b.growth) : -Infinity;
      return growthB - growthA || b.current - a.current || a.code.localeCompare(b.code);
    });

    return { hollandPipeline, emergingCareers };
  },

  /* ── 9. Export data (raw rows for CSV/PDF generation in controller) ───────── */
  getExportData: async (query = {}) => {
    const { userWhere, assessmentWhere, userInclude, assessmentInclude } = buildFilters(query);

    const [overviewData, hollandDist, regionalDist] = await Promise.all([
      (async () => {
        const [studentCount, totalUsers, totalAssessments, completedAssessments, averages] = await Promise.all([
          countUsers({ userWhere, userInclude: assessmentInclude[0]?.include || [], extraWhere: { role: 'Test Taker' } }),
          countUsers({ userWhere, userInclude }),
          Assessment.count({ where: assessmentWhere, include: assessmentInclude }),
          Assessment.count({ where: { ...assessmentWhere, status: 'completed' }, include: assessmentInclude }),
          Assessment.findOne({
            where: { ...assessmentWhere, status: 'completed' },
            attributes: [
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
              [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
            ],
            include: assessmentInclude, raw: true
          })
        ]);
        return { totalUsers, studentCount, totalAssessments, completedAssessments, completionRate: totalAssessments === 0 ? 0 : Number(((completedAssessments / totalAssessments) * 100).toFixed(2)), averages: averages || {} };
      })(),
      getDisplayCodeDistribution(assessmentWhere, assessmentInclude),
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed' },
        include: [{ model: User, as: 'user', required: true, attributes: [], where: { ...userWhere, role: 'Test Taker', region: userWhere.region || { [Op.ne]: null } }, include: userInclude }],
        attributes: [[Assessment.sequelize.col('user.region'), 'region'], [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'completedAssessments']],
        group: [Assessment.sequelize.col('user.region')], raw: true
      })
    ]);

    return { overviewData, hollandDist, regionalDist, filters: query };
  },

  /* ── 10. Government Funding Priority Alignment Analytics ──────────── */
  getFundingAlignmentAnalytics: async (query = {}) => {
    const { assessmentWhere, assessmentInclude } = buildFilters(query);
    const sequelize = Assessment.sequelize;

    // Get completed assessments with funding alignment data
    const assessmentsWithAlignment = await Assessment.findAll({
      where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
      include: assessmentInclude,
      attributes: [...ASSESSMENT_SCORE_ATTRIBUTES, 'userId', 'completedAt'],
      raw: false
    });

    if (assessmentsWithAlignment.length === 0) {
      return {
        summary: { totalAssessments: 0, highAlignment: 0, mediumAlignment: 0, lowAlignment: 0 },
        alignmentDistribution: [],
        fieldAlignment: [],
        regionalAlignment: [],
        userTypeAlignment: [],
        trends: []
      };
    }

    const userIds = [...new Set(assessmentsWithAlignment.map(a => a.userId))];
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'region', 'userType', 'institutionId'],
      include: [{ model: Institution, as: 'institution', attributes: ['name', 'type', 'region'] }]
    });

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const alignmentResults = [];

    for (const assessment of assessmentsWithAlignment) {
      const displayCode = getAssessmentDisplayCode(assessment);
      const codeLetters = scoringService.getLettersForMatching(assessment.hollandCode, displayCode);
      const audience = scoringService.getCourseAudienceConfig(userMap[assessment.userId]?.userType);
      const rawMatchedCourses = codeLetters.length === 0 ? [] : await Course.findAll({
        where: {
          isActive: true,
          [Op.or]: codeLetters.map((l) => sequelize.where(
            sequelize.fn('array_to_string', sequelize.col('riasec_codes'), ','),
            { [Op.iLike]: `%${l}%` }
          ))
        },
        attributes: ['id', 'name', 'qualificationType', 'fieldOfStudy', 'fundingPriority', 'riasecCodes'],
        order: [['funding_priority', 'DESC'], ['name', 'ASC']]
      });
      const matchedCourses = rawMatchedCourses.filter((course) => scoringService.isCourseAllowedForAudience(course, audience));

      const alignment = scoringService.computeFundingAlignment(displayCode || assessment.hollandCode, matchedCourses);
      alignmentResults.push({
        hollandCode: displayCode || assessment.hollandCode,
        overall: alignment.overall,
        priorityFieldCount: alignment.priorityFieldCount,
        nonPriorityFieldCount: alignment.nonPriorityFieldCount,
        allFields: alignment.allFields,
        userId: assessment.userId,
        completedAt: assessment.completedAt
      });
    }

    // Overall summary
    const totalAssessments = alignmentResults.length;
    const highAlignment = alignmentResults.filter(r => r.overall === 'HIGH').length;
    const mediumAlignment = alignmentResults.filter(r => r.overall === 'MEDIUM').length;
    const lowAlignment = alignmentResults.filter(r => r.overall === 'LOW').length;

    // Alignment distribution by overall level
    const alignmentDistribution = [
      { level: 'HIGH', count: highAlignment, percentage: totalAssessments > 0 ? ((highAlignment / totalAssessments) * 100).toFixed(1) : 0 },
      { level: 'MEDIUM', count: mediumAlignment, percentage: totalAssessments > 0 ? ((mediumAlignment / totalAssessments) * 100).toFixed(1) : 0 },
      { level: 'LOW', count: lowAlignment, percentage: totalAssessments > 0 ? ((lowAlignment / totalAssessments) * 100).toFixed(1) : 0 }
    ];

    // Field-level alignment (use allFields so LOW counts are included; alignment.fields omits LOW)
    const fieldMap = {};
    alignmentResults.forEach((result) => {
      (result.allFields || []).forEach((f) => {
        const isHigh = f.alignment === 'HIGH';
        if (!fieldMap[f.field]) {
          fieldMap[f.field] = { field: f.field, priority: 0, other: 0, total: 0 };
        }
        if (isHigh) fieldMap[f.field].priority += 1;
        else fieldMap[f.field].other += 1;
        fieldMap[f.field].total += 1;
      });
    });

    const fieldAlignment = Object.values(fieldMap)
      .map(f => ({
        ...f,
        priorityPercentage: f.total > 0 ? ((f.priority / f.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);

    // Regional alignment
    const regionalMap = {};
    alignmentResults.forEach(result => {
      const user = userMap[result.userId];
      const region = user?.region || user?.institution?.region || 'unknown';
      if (!regionalMap[region]) {
        regionalMap[region] = { region, total: 0, high: 0, medium: 0, low: 0 };
      }
      regionalMap[region].total++;
      regionalMap[region][result.overall.toLowerCase()]++;
    });

    const regionalAlignment = Object.values(regionalMap)
      .map(r => ({
        ...r,
        highPercentage: r.total > 0 ? ((r.high / r.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.high - a.high);

    // User type alignment
    const userTypeMap = {};
    alignmentResults.forEach(result => {
      const userType = userMap[result.userId]?.userType || 'unknown';
      if (!userTypeMap[userType]) {
        userTypeMap[userType] = { userType, total: 0, high: 0, medium: 0, low: 0 };
      }
      userTypeMap[userType].total++;
      userTypeMap[userType][result.overall.toLowerCase()]++;
    });

    const userTypeAlignment = Object.values(userTypeMap)
      .map(u => ({
        ...u,
        highPercentage: u.total > 0 ? ((u.high / u.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.high - a.high);

    const monthBucket = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    };

    const byMonth = {};
    alignmentResults.forEach((r) => {
      const key = monthBucket(r.completedAt);
      if (!key) return;
      if (!byMonth[key]) {
        byMonth[key] = { month: `${key}-01T00:00:00.000Z`, total: 0, high: 0, medium: 0, low: 0 };
      }
      byMonth[key].total += 1;
      const lvl = String(r.overall || '').toUpperCase();
      if (lvl === 'HIGH') byMonth[key].high += 1;
      else if (lvl === 'MEDIUM') byMonth[key].medium += 1;
      else if (lvl === 'LOW') byMonth[key].low += 1;
    });

    const monthlyAlignment = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));

    return {
      summary: { totalAssessments, highAlignment, mediumAlignment, lowAlignment },
      alignmentDistribution,
      fieldAlignment,
      regionalAlignment,
      userTypeAlignment,
      trends: monthlyAlignment
    };
  },

  /* ── Expose buildFilters for controller use (e.g. filter labels) ─────────── */
  buildFilters
};

module.exports = analyticsService;
