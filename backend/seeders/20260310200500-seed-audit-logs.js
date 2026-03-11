"use strict";

const { v4: uuidv4 } = require('uuid');

/**
 * Audit Logs Seeder
 * Creates realistic audit log entries for seeded users covering
 * REGISTER, LOGIN, TEST_START, TEST_COMPLETE, PROFILE_UPDATE and SYSTEM events.
 */

module.exports = {
  async up(queryInterface) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, username, first_name, last_name, email, role
       FROM users
       ORDER BY created_at`
    );

    if (users.length === 0) {
      console.warn('No users found – skipping audit logs seeder.');
      return;
    }

    const byUsername = (un) => users.find(u => u.username === un);
    const byEmail    = (em) => users.find(u => u.email === em);

    const admin     = byEmail('admin@labor.gov.sz');
    const c1        = byEmail('counselor1@labor.gov.sz');
    const c2        = byEmail('counselor2@labor.gov.sz');
    const c3        = byEmail('counselor3@labor.gov.sz');
    const thabo     = byUsername('20250101');
    const siphiwe   = byUsername('20250102');
    const lungelo   = byUsername('20250201');
    const zanele    = byUsername('zanele.motsa');
    const mandla    = byUsername('mandla.dlamini');
    const demo      = byEmail('student@test.sz');

    const ips = [
      '197.248.10.5', '197.248.10.6', '41.76.200.12',
      '197.248.55.3', '41.76.110.44', '197.248.22.90',
      '127.0.0.1'
    ];
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const entry = (userId, actionType, description, details, daysAgo, ip) => ({
      id: uuidv4(),
      user_id: userId || null,
      action_type: actionType,
      description,
      details: JSON.stringify(details),
      ip_address: ip || ips[Math.floor(Math.random() * ips.length)],
      user_agent: ua,
      created_at: new Date(Date.now() - daysAgo * 86400000),
      updated_at: new Date(Date.now() - daysAgo * 86400000)
    });

    const logs = [];

    // ── SYSTEM boot ────────────────────────────────────────────────
    logs.push(entry(null, 'SYSTEM', 'SDS Test System initialised and database seeded', { version: '1.0.0', environment: 'production' }, 30, '127.0.0.1'));

    // ── Admin activity ─────────────────────────────────────────────
    if (admin) {
      logs.push(entry(admin.id, 'REGISTER', 'Admin account created during system setup', { role: 'admin' }, 30, '127.0.0.1'));
      logs.push(entry(admin.id, 'LOGIN', 'Admin logged in successfully', { role: 'admin', method: 'email' }, 29, ips[0]));
      logs.push(entry(admin.id, 'LOGIN', 'Admin logged in successfully', { role: 'admin', method: 'email' }, 15, ips[0]));
      logs.push(entry(admin.id, 'LOGIN', 'Admin logged in successfully', { role: 'admin', method: 'email' }, 3,  ips[0]));
      logs.push(entry(admin.id, 'PROFILE_UPDATE', 'Admin updated system configuration', { field: 'organization' }, 20, ips[0]));
    }

    // ── Counselor registrations & logins ──────────────────────────
    for (const [counselor, daysReg, daysLogin, ipIdx] of [
      [c1, 28, 1, 1],
      [c2, 27, 2, 2],
      [c3, 26, 3, 3]
    ]) {
      if (!counselor) continue;
      logs.push(entry(counselor.id, 'REGISTER', `Counselor account created: ${counselor.first_name} ${counselor.last_name}`, { role: 'counselor' }, daysReg, ips[ipIdx]));
      logs.push(entry(counselor.id, 'LOGIN', `${counselor.first_name} ${counselor.last_name} logged in`, { role: 'counselor' }, daysLogin, ips[ipIdx]));
      logs.push(entry(counselor.id, 'LOGIN', `${counselor.first_name} ${counselor.last_name} logged in`, { role: 'counselor' }, daysReg - 5, ips[ipIdx]));
    }

    // ── Student registrations, test starts & completions ─────────
    const studentTestEvents = [
      { user: thabo,   reg: 25, start: 20, complete: 20, hollandCode: 'IRS', hours: 1 },
      { user: siphiwe, reg: 24, start: 19, complete: 19, hollandCode: 'SAE', hours: 1 },
      { user: lungelo, reg: 22, start: 17, complete: 17, hollandCode: 'RIE', hours: 1 },
      { user: zanele,  reg: 20, start: 15, complete: 15, hollandCode: 'ICS', hours: 2 },
      { user: mandla,  reg: 18, start: 13, complete: 13, hollandCode: 'CES', hours: 1 },
      { user: demo,    reg: 10, start:  5, complete:  5, hollandCode: 'ESC', hours: 1 }
    ];

    for (const { user, reg, start, complete, hollandCode } of studentTestEvents) {
      if (!user) continue;
      logs.push(entry(user.id, 'REGISTER', `${user.first_name} ${user.last_name} registered`, { userType: 'school_student' }, reg, ips[4]));
      logs.push(entry(user.id, 'LOGIN', `${user.first_name} ${user.last_name} logged in`, {}, reg, ips[4]));
      logs.push(entry(user.id, 'TEST_START', `${user.first_name} ${user.last_name} started SDS assessment`, { section: 'activities' }, start, ips[4]));
      logs.push(entry(user.id, 'TEST_COMPLETE', `${user.first_name} ${user.last_name} completed SDS assessment. Holland Code: ${hollandCode}`, {
        hollandCode,
        isRead: false,
        studentName: `${user.first_name} ${user.last_name}`,
        studentEmail: user.email
      }, complete, ips[4]));
    }

    // ── In-progress student (Nokwanda) ────────────────────────────
    const nokwanda = byUsername('20250202');
    if (nokwanda) {
      logs.push(entry(nokwanda.id, 'REGISTER', `${nokwanda.first_name} ${nokwanda.last_name} registered`, { userType: 'school_student' }, 8, ips[5]));
      logs.push(entry(nokwanda.id, 'LOGIN', `${nokwanda.first_name} ${nokwanda.last_name} logged in`, {}, 5, ips[5]));
      logs.push(entry(nokwanda.id, 'TEST_START', `${nokwanda.first_name} ${nokwanda.last_name} started SDS assessment`, { section: 'activities' }, 4, ips[5]));
    }

    // ── University students ───────────────────────────────────────
    const uniStudents = [
      byUsername('sibusiso.lukhele'),
      byUsername('phumzile.hlophe')
    ];
    for (const u of uniStudents) {
      if (!u) continue;
      logs.push(entry(u.id, 'REGISTER', `${u.first_name} ${u.last_name} registered`, { userType: 'university_student' }, 16, ips[3]));
      logs.push(entry(u.id, 'LOGIN', `${u.first_name} ${u.last_name} logged in`, {}, 5, ips[3]));
    }

    // ── Professional logins ───────────────────────────────────────
    const ntombi = byUsername('ntombi.vilakazi');
    if (ntombi) {
      logs.push(entry(ntombi.id, 'REGISTER', `${ntombi.first_name} ${ntombi.last_name} registered`, { userType: 'professional' }, 14, ips[2]));
      logs.push(entry(ntombi.id, 'LOGIN', `${ntombi.first_name} ${ntombi.last_name} logged in`, {}, 3, ips[2]));
    }

    // ── Access denied events ───────────────────────────────────────
    logs.push(entry(null, 'ACCESS_DENIED', 'Unauthorised access attempt to admin dashboard', { path: '/admin', method: 'GET' }, 12, '41.76.150.200'));
    logs.push(entry(null, 'ACCESS_DENIED', 'Failed login attempt – invalid credentials', { identifier: 'unknown@test.sz' }, 6, '197.248.99.5'));

    // ── Password change ────────────────────────────────────────────
    if (admin) {
      logs.push(entry(admin.id, 'PASSWORD_CHANGE', 'Admin changed their password', { method: 'manual' }, 10, ips[0]));
    }

    await queryInterface.bulkInsert('audit_logs', logs, {});
    console.log(`Inserted ${logs.length} audit log entries.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('audit_logs', null, {});
  }
};
