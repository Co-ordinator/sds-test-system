"use strict";

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const now = new Date();

/**
 * Users Seeder
 * Creates: 1 admin, 1 counselor, 1 school student,
 *          1 university student, 1 professional
 *
 * NOTE: bulkInsert bypasses model hooks, so passwords are pre-hashed here.
 * Credentials summary at end of file.
 */

module.exports = {
  async up(queryInterface) {
    // ── Lookup reference IDs ──────────────────────────────────────
    const [eduLevels] = await queryInterface.sequelize.query(
      'SELECT id, level FROM education_levels ORDER BY level'
    );
    const byLevel = (n) => {
      const f = eduLevels.find(l => parseInt(l.level) === n);
      return f ? f.id : null;
    };

    const [institutions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM institutions'
    );
    const byName = (name) => {
      const f = institutions.find(i => i.name.toLowerCase() === name.toLowerCase());
      return f ? f.id : null;
    };

    // ── Pre-hash passwords ────────────────────────────────────────
    const hash = (plain) => bcrypt.hashSync(plain, 10);

    const UNESWA   = byName('University of Eswatini');
    const SANU     = byName('Southern Africa Nazarene University');
    const EMCU     = byName('Eswatini Medical Christian University');
    const MGHS     = byName('Mbabane Government High School');
    const MCHS     = byName('Manzini Central High School');
    const SHS      = byName('Siteki High School');
    const HHS      = byName('Hlatikulu High School');

    const users = [
      // ── Admin ──────────────────────────────────────────────────
      {
        id: uuidv4(),
        username: 'sysadmin',
        email: 'admin@labor.gov.sz',
        password: hash('Admin@123'),
        first_name: 'Sipho',
        last_name: 'Dlamini',
        gender: 'male',
        date_of_birth: '1980-05-14',
        phone_number: '+268 7600 0001',
        region: 'hhohho',
        district: 'Mbabane',
        role: 'System Administrator',
        user_type: 'System Administrator',
        education_level: byLevel(5),
        employment_status: 'employed',
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: false,
        is_consent_given: true,
        consent_date: now,
        organization: 'Ministry of Labour and Social Security',
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        last_login: now,
        created_at: now,
        updated_at: now
      },

      // ── Test Administrator ──────────────────────────────────
      {
        id: uuidv4(),
        username: 'testadmin.mbabane',
        email: 'testadmin@labor.gov.sz',
        password: hash('TestAdmin@123'),
        first_name: 'Nomvula',
        last_name: 'Nkosi',
        gender: 'female',
        date_of_birth: '1985-03-22',
        phone_number: '+268 7600 0002',
        region: 'hhohho',
        district: 'Mbabane',
        role: 'Test Administrator',
        user_type: 'Test Administrator',
        education_level: byLevel(4),
        employment_status: 'employed',
        institution_id: MGHS,
        test_administrator_code: 'TA-MGHS-001',
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: false,
        is_consent_given: true,
        consent_date: now,
        organization: 'Mbabane Government High School',
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        last_login: now,
        created_at: now,
        updated_at: now
      },

      // ── School Test Taker ─────────────────────────────────
      {
        id: uuidv4(),
        username: '20250101',
        email: null,
        password: hash('Pass@2025'),
        first_name: 'Thabo',
        last_name: 'Zwane',
        gender: 'male',
        date_of_birth: '2008-02-10',
        phone_number: null,
        region: 'hhohho',
        district: 'Mbabane',
        role: 'Test Taker',
        user_type: 'High School Student',
        education_level: byLevel(2),
        grade_level: 'Form 4',
        class_name: 'A',
        student_number: '20250101',
        employment_status: 'student',
        institution_id: MGHS,
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── University Test Taker ──────────────────────────────
      {
        id: uuidv4(),
        username: 'zanele.motsa',
        email: 'zanele.motsa@student.uneswa.sz',
        password: hash('Student@123'),
        first_name: 'Zanele',
        last_name: 'Motsa',
        gender: 'female',
        date_of_birth: '2003-01-30',
        phone_number: '+268 7611 0001',
        region: 'hhohho',
        district: 'Kwaluseni',
        role: 'Test Taker',
        user_type: 'University Student',
        education_level: byLevel(4),
        current_institution: 'University of Eswatini',
        degree_program: 'Bachelor of Science in Computer Science',
        year_of_study: 2,
        employment_status: 'student',
        institution_id: UNESWA,
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── Professional Test Taker ────────────────────────────
      {
        id: uuidv4(),
        username: 'mandla.dlamini',
        email: 'mandla.dlamini@gmail.com',
        password: hash('Professional@123'),
        first_name: 'Mandla',
        last_name: 'Dlamini',
        gender: 'male',
        date_of_birth: '1990-04-03',
        phone_number: '+268 7622 0001',
        region: 'hhohho',
        district: 'Mbabane',
        role: 'Test Taker',
        user_type: 'Professional',
        education_level: byLevel(4),
        current_occupation: 'Accountant',
        years_experience: 7,
        employment_status: 'employed',
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('users', users, { ignoreDuplicates: true });
    console.log(`Inserted ${users.length} users.`);

    /*
     * ── Credentials Summary ───────────────────────────────────────
     * Admin:              admin@labor.gov.sz             / Admin@123
     * Test Administrator: testadmin@labor.gov.sz         / TestAdmin@123
     * School Test Taker:  username=20250101              / Pass@2025
     * Uni Test Taker:     zanele.motsa@student.uneswa.sz / Student@123
     * Professional:       mandla.dlamini@gmail.com       / Professional@123
     */
  },

  async down(queryInterface) {
    const emails = [
      'admin@labor.gov.sz',
      'testadmin@labor.gov.sz',
      'zanele.motsa@student.uneswa.sz',
      'mandla.dlamini@gmail.com'
    ];
    const usernames = ['20250101'];

    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN (:emails) OR username IN (:usernames)`,
      { replacements: { emails, usernames } }
    );
  }
};
