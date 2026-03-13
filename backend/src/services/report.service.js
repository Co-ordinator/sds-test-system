'use strict';

const { User, Assessment, Institution, Occupation } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const BASE_TAKER = { role: 'Test Taker' };

const REGIONS = ['hhohho', 'manzini', 'lubombo', 'shiselweni'];
const GENDERS  = ['male', 'female', 'other', 'prefer_not_to_say'];

/* ── Query helpers ───────────────────────────────────────────────────────── */
const buildQ = (f = {}) => {
  const { institutionId, region, userType, gender, startDate, endDate } = f;
  const uw = { ...BASE_TAKER };
  const aw = { status: 'completed' };

  if (institutionId) uw.institutionId = institutionId;
  if (region)        uw.region        = region;
  if (userType)      uw.userType      = userType;
  if (gender)        uw.gender        = gender;

  if (startDate || endDate) {
    aw.completedAt = {};
    if (startDate) aw.completedAt[Op.gte] = new Date(`${startDate}T00:00:00Z`);
    if (endDate)   aw.completedAt[Op.lte] = new Date(`${endDate}T23:59:59Z`);
  }

  const ui = (w) => [{ model: User, as: 'user', required: true, attributes: [], where: w }];
  return { uw, aw, ui };
};

const getTopCode = async (aw, ui, uw) => {
  const row = await Assessment.findOne({
    where: { ...aw, holland_code: { [Op.ne]: null } },
    attributes: ['holland_code', [fn('COUNT', col('Assessment.id')), 'cnt']],
    include: ui(uw),
    group: ['Assessment.holland_code'],
    order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
    raw: true,
  });
  return row?.holland_code || '—';
};

/* ── Report Service ──────────────────────────────────────────────────────── */
module.exports = {

  /* 1 ── Executive Summary ───────────────────────────────────────────────── */
  async getExecutiveSummary(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const [totalUsers, totalAssessments, completedAssessments] = await Promise.all([
      User.count({ where: uw }),
      Assessment.count({ include: ui(uw) }),
      Assessment.count({ where: aw, include: ui(uw) }),
    ]);

    const completionRate = totalAssessments > 0
      ? Math.round((completedAssessments / totalAssessments) * 100) : 0;

    const [hollandDist, genderDist, regionDist, userTypeDist] = await Promise.all([
      Assessment.findAll({
        where: { ...aw, holland_code: { [Op.ne]: null } },
        attributes: ['holland_code', [fn('COUNT', col('Assessment.id')), 'count']],
        include: ui(uw),
        group: ['Assessment.holland_code'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        limit: 10, raw: true,
      }),
      User.findAll({
        where: { ...uw, gender: { [Op.ne]: null } },
        attributes: ['gender', [fn('COUNT', col('User.id')), 'count']],
        group: ['User.gender'], raw: true,
      }),
      User.findAll({
        where: { ...uw, region: { [Op.ne]: null } },
        attributes: ['region', [fn('COUNT', col('User.id')), 'count']],
        group: ['User.region'],
        order: [[fn('COUNT', col('User.id')), 'DESC']],
        raw: true,
      }),
      User.findAll({
        where: { ...uw, userType: { [Op.ne]: null } },
        attributes: ['user_type', [fn('COUNT', col('User.id')), 'count']],
        group: ['User.user_type'], raw: true,
      }),
    ]);

    const topHolland = hollandDist[0]?.holland_code || '—';
    return { totalUsers, totalAssessments, completedAssessments, completionRate, topHolland, hollandDist, genderDist, regionDist, userTypeDist };
  },

  /* 2 ── Regional Distribution ───────────────────────────────────────────── */
  async getRegionalReport(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const regions = await Promise.all(REGIONS.map(async (region) => {
      const rw = { ...uw, region };
      const [totalUsers, completedAssessments, topCode] = await Promise.all([
        User.count({ where: rw }),
        Assessment.count({ where: aw, include: ui(rw) }),
        getTopCode(aw, ui, rw),
      ]);
      const completionRate = totalUsers > 0
        ? Math.round((completedAssessments / totalUsers) * 100) : 0;
      return { region, totalUsers, completedAssessments, completionRate, topCode };
    }));

    const totals = regions.reduce((acc, r) => ({
      totalUsers: acc.totalUsers + r.totalUsers,
      completedAssessments: acc.completedAssessments + r.completedAssessments,
    }), { totalUsers: 0, completedAssessments: 0 });

    return { regions, totals };
  },

  /* 3 ── Gender & Demographics ───────────────────────────────────────────── */
  async getGenderReport(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const [genderBreakdown, userTypeDist, regionGenderDist] = await Promise.all([
      Promise.all(GENDERS.map(async (gender) => {
        const gw = { ...uw, gender };
        const [totalUsers, completedAssessments, topCode] = await Promise.all([
          User.count({ where: gw }),
          Assessment.count({ where: aw, include: ui(gw) }),
          getTopCode(aw, ui, gw),
        ]);
        return { gender, totalUsers, completedAssessments, topCode };
      })),
      User.findAll({
        where: { ...uw, userType: { [Op.ne]: null }, gender: { [Op.ne]: null } },
        attributes: ['user_type', 'gender', [fn('COUNT', col('User.id')), 'count']],
        group: ['User.user_type', 'User.gender'], raw: true,
      }),
      User.findAll({
        where: { ...uw, region: { [Op.ne]: null }, gender: { [Op.ne]: null } },
        attributes: ['region', 'gender', [fn('COUNT', col('User.id')), 'count']],
        group: ['User.region', 'User.gender'], raw: true,
      }),
    ]);

    return { genderBreakdown: genderBreakdown.filter(g => g.totalUsers > 0), userTypeDist, regionGenderDist };
  },

  /* 4 ── Career Intelligence ─────────────────────────────────────────────── */
  async getCareerIntelligenceReport(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const [hollandDist, riasecRow, topOccupations] = await Promise.all([
      Assessment.findAll({
        where: { ...aw, holland_code: { [Op.ne]: null } },
        attributes: ['holland_code', [fn('COUNT', col('Assessment.id')), 'count']],
        include: ui(uw),
        group: ['Assessment.holland_code'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        limit: 15, raw: true,
      }),
      Assessment.findOne({
        where: aw,
        attributes: [
          [fn('ROUND', fn('AVG', col('score_r')), 1), 'avgR'],
          [fn('ROUND', fn('AVG', col('score_i')), 1), 'avgI'],
          [fn('ROUND', fn('AVG', col('score_a')), 1), 'avgA'],
          [fn('ROUND', fn('AVG', col('score_s')), 1), 'avgS'],
          [fn('ROUND', fn('AVG', col('score_e')), 1), 'avgE'],
          [fn('ROUND', fn('AVG', col('score_c')), 1), 'avgC'],
        ],
        include: ui(uw), raw: true,
      }),
      Occupation.findAll({
        where: { status: 'approved' },
        attributes: ['name', 'code'],
        order: [['name', 'ASC']], limit: 20,
      }),
    ]);

    return { hollandDist, riasecAverages: riasecRow, topOccupations };
  },

  /* 5 ── Institution Performance ─────────────────────────────────────────── */
  async getInstitutionReport(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const institutions = await Institution.findAll({
      attributes: ['id', 'name', 'type', 'region'],
      order: [['name', 'ASC']],
    });

    const rows = await Promise.all(institutions.map(async (inst) => {
      const iw = { ...uw, institutionId: inst.id };
      const [totalStudents, completedAssessments] = await Promise.all([
        User.count({ where: iw }),
        Assessment.count({ where: aw, include: ui(iw) }),
      ]);
      if (totalStudents === 0) return null;
      return {
        name: inst.name,
        type: inst.type || '—',
        region: inst.region || '—',
        totalStudents,
        completedAssessments,
        completionRate: Math.round((completedAssessments / totalStudents) * 100),
      };
    }));

    const sorted = rows.filter(Boolean).sort((a, b) => b.completionRate - a.completionRate);
    return { institutions: sorted };
  },

  /* 6 ── Assessment Trends ───────────────────────────────────────────────── */
  async getTrendsReport(filters = {}) {
    const { uw, aw, ui } = buildQ(filters);

    const [completionTrend, registrationTrend] = await Promise.all([
      Assessment.findAll({
        where: { status: 'completed' },
        attributes: [
          [fn('TO_CHAR', fn('DATE_TRUNC', 'month', col('Assessment.completed_at')), 'YYYY-MM'), 'month'],
          [fn('COUNT', col('Assessment.id')), 'completed'],
        ],
        include: ui(uw),
        group: [fn('DATE_TRUNC', 'month', col('Assessment.completed_at'))],
        order: [[fn('DATE_TRUNC', 'month', col('Assessment.completed_at')), 'ASC']],
        raw: true,
      }),
      User.findAll({
        where: uw,
        attributes: [
          [fn('TO_CHAR', fn('DATE_TRUNC', 'month', col('created_at')), 'YYYY-MM'), 'month'],
          [fn('COUNT', col('id')), 'registrations'],
        ],
        group: [fn('DATE_TRUNC', 'month', col('created_at'))],
        order: [[fn('DATE_TRUNC', 'month', col('created_at')), 'ASC']],
        raw: true,
      }),
    ]);

    const map = {};
    completionTrend.forEach(r => {
      if (r.month) map[r.month] = { month: r.month, completed: Number(r.completed), registrations: 0 };
    });
    registrationTrend.forEach(r => {
      if (r.month) {
        if (map[r.month]) map[r.month].registrations = Number(r.registrations);
        else map[r.month] = { month: r.month, completed: 0, registrations: Number(r.registrations) };
      }
    });

    const trendData = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    const totalCompleted = trendData.reduce((s, r) => s + r.completed, 0);
    const totalRegistrations = trendData.reduce((s, r) => s + r.registrations, 0);

    return { trendData, totalCompleted, totalRegistrations };
  },
};
