'use strict';

const {
  User, Assessment, Institution, Occupation, Course,
  CourseInstitution, OccupationCourse
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');

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

    const distribution = await Assessment.findAll({
      where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
      attributes: [
        'hollandCode',
        [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']
      ],
      include: assessmentInclude,
      group: ['hollandCode'],
      order: [[Assessment.sequelize.literal('"count"'), 'DESC']],
      raw: true
    });

    return { distribution };
  },

  /* ── 3. Monthly Assessment Trend ────────────────────────────────────────── */
  getTrend: async (query = {}) => {
    const { assessmentWhere, assessmentInclude } = buildFilters(query);

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
        [Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at')), 'month'],
        [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('id')), 'total'],
        [Assessment.sequelize.fn('SUM', Assessment.sequelize.literal("CASE WHEN status='completed' THEN 1 ELSE 0 END")), 'completed']
      ],
      group: [Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at'))],
      order: [[Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at')), 'ASC']],
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

    const [usersByRegion, completedByRegion, hollandByRegion, userTypeDistribution] = await Promise.all([
      User.findAll({
        where: userWhere, include: userInclude,
        attributes: ['region', [fn('COUNT', col('User.id')), 'totalUsers']],
        group: ['region'], raw: true
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
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        include: assessmentInclude,
        attributes: [
          [col('user.region'), 'region'],
          'hollandCode',
          [fn('COUNT', col('Assessment.id')), 'count']
        ],
        group: [col('user.region'), 'Assessment.holland_code'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        raw: true
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
      regionMap[r] = { region: r, totalUsers: 0, completedAssessments: 0, topCode: null, avgR: 0, avgI: 0, avgA: 0, avgS: 0, avgE: 0, avgC: 0 };
    });
    usersByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r]) regionMap[r].totalUsers = parseInt(row.totalUsers, 10) || 0;
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
  getInstitutionBreakdown: async () => {
    const institutions = await Institution.findAll({ order: [['name', 'ASC']] });

    const results = await Promise.all(institutions.map(async (inst) => {
      const totalStudents = await User.count({ where: { institutionId: inst.id, role: 'Test Taker' } });
      const totalAssessments = await Assessment.count({
        include: [{ model: User, as: 'user', required: true, where: { institutionId: inst.id } }]
      });
      const completedAssessments = await Assessment.count({
        where: { status: 'completed' },
        include: [{ model: User, as: 'user', required: true, where: { institutionId: inst.id } }]
      });
      return {
        institutionId: inst.id,
        institutionName: inst.name,
        region: inst.region,
        type: inst.type,
        totalStudents,
        totalAssessments,
        completedAssessments,
        completionRate: totalAssessments > 0 ? Number(((completedAssessments / totalAssessments) * 100).toFixed(1)) : 0
      };
    }));

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

    const topHollandCareerMatches = await Assessment.findAll({
      where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
      include: assessmentInclude,
      attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'assessmentCount']],
      group: ['hollandCode'], order: [[literal('"assessmentCount"'), 'DESC']],
      limit: 15, raw: true
    });

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
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        include: [{ model: User, as: 'user', required: true, attributes: [], where: { ...userWhere, gender: { [Op.ne]: null } }, include: userInclude }],
        attributes: [
          [col('user.gender'), 'gender'],
          'hollandCode',
          [fn('COUNT', col('Assessment.id')), 'count']
        ],
        group: [col('user.gender'), 'Assessment.holland_code'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        raw: true
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
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null }, completedAt: { [Op.gte]: currentStart } },
        include: assessmentInclude,
        attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
        group: ['hollandCode'], raw: true
      }),
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null }, completedAt: { [Op.gte]: priorStart, [Op.lt]: currentStart } },
        include: assessmentInclude,
        attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
        group: ['hollandCode'], raw: true
      }),
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
      const growth = prior === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prior) / prior) * 100);
      return { code: d.hollandCode, current, prior, growth };
    }).sort((a, b) => b.growth - a.growth);

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
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        attributes: ['hollandCode', [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']],
        include: assessmentInclude, group: ['hollandCode'],
        order: [[Assessment.sequelize.literal('"count"'), 'DESC']], raw: true
      }),
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
      attributes: ['id', 'hollandCode', 'userId', 'completedAt'],
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

    // Process each assessment to compute funding alignment
    const scoringService = require('./scoring.service');
    const alignmentResults = [];

    const RIASEC_LETTERS = new Set(['R', 'I', 'A', 'S', 'E', 'C']);

    for (const assessment of assessmentsWithAlignment) {
      const codeLetters = [...new Set(
        String(assessment.hollandCode || '')
          .replace(/\//g, '')
          .split('')
          .filter((c) => RIASEC_LETTERS.has(c.toUpperCase()))
          .map((c) => c.toUpperCase())
      )];
      const matchedCourses = codeLetters.length === 0 ? [] : await Course.findAll({
        where: {
          isActive: true,
          [Op.or]: codeLetters.map((l) => sequelize.where(
            sequelize.fn('array_to_string', sequelize.col('riasec_codes'), ','),
            { [Op.iLike]: `%${l}%` }
          ))
        },
        attributes: ['fieldOfStudy', 'fundingPriority'],
        order: [['funding_priority', 'ASC'], ['name', 'ASC']]
      });

      const alignment = scoringService.computeFundingAlignment(assessment.hollandCode, matchedCourses);
      alignmentResults.push({
        hollandCode: assessment.hollandCode,
        overall: alignment.overall,
        highCount: alignment.highCount,
        mediumCount: alignment.mediumCount,
        lowCount: alignment.lowCount,
        allFields: alignment.allFields,
        userId: assessment.userId,
        completedAt: assessment.completedAt
      });
    }

    // Get user details for grouping
    const userIds = [...new Set(assessmentsWithAlignment.map(a => a.userId))];
    const users = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: ['id', 'region', 'userType', 'institutionId'],
      include: [{ model: Institution, as: 'institution', attributes: ['name', 'type', 'region'] }]
    });

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

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
        const alignKey = String(f.alignment || 'LOW').toLowerCase();
        if (!['high', 'medium', 'low'].includes(alignKey)) return;
        if (!fieldMap[f.field]) {
          fieldMap[f.field] = { field: f.field, high: 0, medium: 0, low: 0, total: 0 };
        }
        fieldMap[f.field][alignKey]++;
        fieldMap[f.field].total++;
      });
    });

    const fieldAlignment = Object.values(fieldMap)
      .map(f => ({
        ...f,
        highPercentage: f.total > 0 ? ((f.high / f.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.high - a.high)
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
