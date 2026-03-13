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
      where: assessmentWhere,
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
    completedByRegion.forEach(row => {
      const r = (row.region || '').toLowerCase();
      if (regionMap[r]) {
        regionMap[r].completedAssessments = parseInt(row.completedAssessments, 10) || 0;
        ['R','I','A','S','E','C'].forEach(l => {
          regionMap[r][`avg${l}`] = parseFloat(row[`avg${l}`] || 0).toFixed(1);
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
  getKnowledgeGraph: async () => {
    const demandDistribution = await Occupation.findAll({
      attributes: ['demandLevel', [fn('COUNT', col('id')), 'count']],
      where: { demandLevel: { [Op.ne]: null } },
      group: ['demandLevel'], order: [[literal('"count"'), 'DESC']], raw: true
    });

    const localDemandDist = await Occupation.findAll({
      attributes: ['localDemand', [fn('COUNT', col('id')), 'count']],
      where: { localDemand: { [Op.ne]: null } },
      group: ['localDemand'], order: [[literal('"count"'), 'DESC']], raw: true
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
        'institutionId',
        [fn('COUNT', col('CourseInstitution.id')), 'courseCount']
      ],
      where: { isActive: true },
      include: [{ model: Institution, as: 'institution', attributes: ['name', 'type', 'region'] }],
      group: ['institutionId', 'institution.id'],
      order: [[literal('"courseCount"'), 'DESC']],
      raw: true, nest: true
    });

    const allOccupations = await Occupation.findAll({
      attributes: ['skills', 'primaryRiasec', 'name', 'demandLevel', 'localDemand', 'category'], raw: true
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
      where: { status: 'completed', hollandCode: { [Op.ne]: null } },
      attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'assessmentCount']],
      group: ['hollandCode'], order: [[literal('"assessmentCount"'), 'DESC']],
      limit: 15, raw: true
    });

    const genderDist = await Assessment.findAll({
      where: { status: 'completed' },
      include: [{ model: User, as: 'user', required: true, attributes: [], where: { gender: { [Op.ne]: null } } }],
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
      .map(o => ({ name: o.name, primaryRiasec: o.primaryRiasec, demandLevel: o.demandLevel, localDemand: o.localDemand, category: o.category }))
      .slice(0, 50);

    const [totalOccupations, totalCourses, totalInstitutions, totalCourseLinks, totalCareerPathways] = await Promise.all([
      Occupation.count(),
      Course.count({ where: { isActive: true } }),
      Institution.count(),
      CourseInstitution.count({ where: { isActive: true } }),
      OccupationCourse.count()
    ]);

    const coursesPerRiasec = [];
    for (const letter of ['R','I','A','S','E','C']) {
      const count = await Course.count({ where: { isActive: true, riasecCodes: { [Op.contains]: [letter] } } });
      coursesPerRiasec.push({ letter, count });
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const completionByDow = await Assessment.findAll({
      where: { status: 'completed', completedAt: { [Op.gte]: ninetyDaysAgo } },
      attributes: [
        [fn('EXTRACT', literal('DOW FROM completed_at')), 'dow'],
        [fn('COUNT', col('id')), 'count']
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

    const [currentDist, priorDist, allTimeDist, emergingCareers] = await Promise.all([
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
      Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        include: assessmentInclude,
        attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
        group: ['hollandCode'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        raw: true
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

    return { hollandPipeline, allTimeDist, emergingCareers };
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
            where: assessmentWhere,
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

  /* ── Expose buildFilters for controller use (e.g. filter labels) ─────────── */
  buildFilters
};

module.exports = analyticsService;
