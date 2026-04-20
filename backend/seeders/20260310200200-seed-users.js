"use strict";

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const now = new Date();

/**
 * Users Seeder
 * Creates: 1 admin, 1 counselor, 1 school student,
 *          1 university student, 1 professional
 *
 * NOTE: bulkInsert bypasses model hooks, so passwords are pre-hashed here.
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
    const seededPassword = (envKey) => process.env[envKey] || crypto.randomBytes(12).toString('base64url');
    const hash = (plain) => bcrypt.hashSync(plain, 10);

    const UNESWA   = byName('University of Eswatini');
    const SANU     = byName('Southern Africa Nazarene University');
    const EMCU     = byName('Eswatini Medical Christian University');
    const MGHS     = byName('Mbabane Government High School');
    const MCHS     = byName('Manzini Central High School');
    const SHS      = byName('Siteki High School');
    const HHS      = byName('Hlatikulu High School');

    const users = [
      // ── System Administrator ──────────────────────────────────
      {
        id: uuidv4(),
        username: 'thembinkosimthembu',
        email: 'thembinkosi@labor.gov.sz',
        password: hash(seededPassword('SEED_ADMIN_PASSWORD')),
        first_name: 'Thembinkosi',
        last_name: 'Mthembu',
        gender: 'male',
        date_of_birth: '1975-08-20',
        phone_number: '+268 7600 1001',
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

      // ── Test Administrator (Mbabane) ─────────────────────────
      {
        id: uuidv4(),
        username: 'phumileshongwe',
        email: 'phumlile@labor.gov.sz',
        password: hash(seededPassword('SEED_TEST_ADMIN_PASSWORD')),
        first_name: 'Phumlile',
        last_name: 'Shongwe',
        gender: 'female',
        date_of_birth: '1982-11-15',
        phone_number: '+268 7600 1002',
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

      // ── Test Administrator (Manzini) ─────────────────────────
      {
        id: uuidv4(),
        username: 'bonginkosimkhonta',
        email: 'bonginkosi@labor.gov.sz',
        password: hash(seededPassword('SEED_MANZINI_ADMIN_PASSWORD')),
        first_name: 'Bonginkosi',
        last_name: 'Mkhonta',
        gender: 'male',
        date_of_birth: '1978-06-10',
        phone_number: '+268 7600 1003',
        region: 'manzini',
        district: 'Manzini',
        role: 'Test Administrator',
        user_type: 'Test Administrator',
        education_level: byLevel(4),
        employment_status: 'employed',
        institution_id: MCHS,
        test_administrator_code: 'TA-MCHS-001',
        is_active: true,
        is_email_verified: true,
        created_by_test_administrator: false,
        is_consent_given: true,
        consent_date: now,
        organization: 'Manzini Central High School',
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        last_login: now,
        created_at: now,
        updated_at: now
      },

      // ── High School Student ────────────────────────────────
      {
        id: uuidv4(),
        username: '20250101',
        email: null,
        password: hash(seededPassword('SEED_SCHOOL_TEST_TAKER_PASSWORD')),
        first_name: 'Sibusiso',
        last_name: 'Magagula',
        gender: 'male',
        date_of_birth: '2007-05-12',
        phone_number: null,
        region: 'hhohho',
        district: 'Mbabane',
        role: 'Test Taker',
        user_type: 'High School Student',
        education_level: byLevel(2),
        grade_level: 'Form 5',
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

      // ── University Student ────────────────────────────────
      {
        id: uuidv4(),
        username: 'sibongilelubisi',
        email: 'sibongile@uneswa.sz',
        password: hash(seededPassword('SEED_UNIVERSITY_TEST_TAKER_PASSWORD')),
        first_name: 'Sibongile',
        last_name: 'Lubisi',
        gender: 'female',
        date_of_birth: '2002-09-25',
        phone_number: '+268 7611 1001',
        region: 'hhohho',
        district: 'Kwaluseni',
        role: 'Test Taker',
        user_type: 'University Student',
        education_level: byLevel(4),
        current_institution: 'University of Eswatini',
        degree_program: 'Bachelor of Education',
        year_of_study: 3,
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

      // ── Professional ───────────────────────────────────────
      {
        id: uuidv4(),
        username: 'nomsandlovu',
        email: 'nomsa@gmail.com',
        password: hash(seededPassword('SEED_PROFESSIONAL_TEST_TAKER_PASSWORD')),
        first_name: 'Nomsa',
        last_name: 'Ndlovu',
        gender: 'female',
        date_of_birth: '1988-12-08',
        phone_number: '+268 7622 1001',
        region: 'hhohho',
        district: 'Mbabane',
        role: 'Test Taker',
        user_type: 'Professional',
        education_level: byLevel(4),
        current_occupation: 'Software Developer',
        years_experience: 5,
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

  },

  async down(queryInterface) {
    const emails = [
      'thembinkosi@labor.gov.sz',
      'phumlile@labor.gov.sz',
      'bonginkosi@labor.gov.sz',
      'sibongile@uneswa.sz',
      'nomsa@gmail.com'
    ];
    const usernames = ['20250101'];

    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN (:emails) OR username IN (:usernames)`,
      { replacements: { emails, usernames } }
    );
  }
};
