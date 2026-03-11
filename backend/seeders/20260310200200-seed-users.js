"use strict";

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const now = new Date();

/**
 * Users Seeder
 * Creates: 1 admin, 3 counselors, 5 school students,
 *          3 university students, 2 professionals, 1 demo user
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
        role: 'admin',
        user_type: 'admin',
        education_level: byLevel(5),
        employment_status: 'employed',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
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

      // ── Counselors ─────────────────────────────────────────────
      {
        id: uuidv4(),
        username: 'counselor.mbabane',
        email: 'counselor1@labor.gov.sz',
        password: hash('Counselor@123'),
        first_name: 'Nomvula',
        last_name: 'Nkosi',
        gender: 'female',
        date_of_birth: '1985-03-22',
        phone_number: '+268 7600 0002',
        region: 'hhohho',
        district: 'Mbabane',
        role: 'counselor',
        user_type: 'counselor',
        education_level: byLevel(4),
        employment_status: 'employed',
        institution_id: MGHS,
        counselor_code: 'COUN-MGHS-001',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
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
      {
        id: uuidv4(),
        username: 'counselor.manzini',
        email: 'counselor2@labor.gov.sz',
        password: hash('Counselor@123'),
        first_name: 'Bongani',
        last_name: 'Simelane',
        gender: 'male',
        date_of_birth: '1987-11-08',
        phone_number: '+268 7600 0003',
        region: 'manzini',
        district: 'Manzini',
        role: 'counselor',
        user_type: 'counselor',
        education_level: byLevel(4),
        employment_status: 'employed',
        institution_id: MCHS,
        counselor_code: 'COUN-MCHS-001',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
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
      {
        id: uuidv4(),
        username: 'counselor.siteki',
        email: 'counselor3@labor.gov.sz',
        password: hash('Counselor@123'),
        first_name: 'Lindiwe',
        last_name: 'Mhlanga',
        gender: 'female',
        date_of_birth: '1990-07-17',
        phone_number: '+268 7600 0004',
        region: 'lubombo',
        district: 'Siteki',
        role: 'counselor',
        user_type: 'counselor',
        education_level: byLevel(4),
        employment_status: 'employed',
        institution_id: SHS,
        counselor_code: 'COUN-SHS-001',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        organization: 'Siteki High School',
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── School Students (created by counselor at MGHS) ─────────
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
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 4',
        class_name: 'A',
        student_number: '20250101',
        employment_status: 'student',
        institution_id: MGHS,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: '20250102',
        email: null,
        password: hash('Pass@2025'),
        first_name: 'Siphiwe',
        last_name: 'Dube',
        gender: 'female',
        date_of_birth: '2008-06-25',
        phone_number: null,
        region: 'hhohho',
        district: 'Mbabane',
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 4',
        class_name: 'A',
        student_number: '20250102',
        employment_status: 'student',
        institution_id: MGHS,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: '20250201',
        email: null,
        password: hash('Pass@2025'),
        first_name: 'Lungelo',
        last_name: 'Masuku',
        gender: 'male',
        date_of_birth: '2007-09-14',
        phone_number: null,
        region: 'manzini',
        district: 'Manzini',
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 5',
        class_name: 'B',
        student_number: '20250201',
        employment_status: 'student',
        institution_id: MCHS,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: '20250202',
        email: null,
        password: hash('Pass@2025'),
        first_name: 'Nokwanda',
        last_name: 'Nhleko',
        gender: 'female',
        date_of_birth: '2007-12-01',
        phone_number: null,
        region: 'manzini',
        district: 'Manzini',
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 5',
        class_name: 'B',
        student_number: '20250202',
        employment_status: 'student',
        institution_id: MCHS,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'ss',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: '20250301',
        email: null,
        password: hash('Pass@2025'),
        first_name: 'Mxolisi',
        last_name: 'Shongwe',
        gender: 'male',
        date_of_birth: '2008-04-18',
        phone_number: null,
        region: 'lubombo',
        district: 'Siteki',
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 4',
        class_name: 'C',
        student_number: '20250301',
        employment_status: 'student',
        institution_id: SHS,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: true,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── University Students ────────────────────────────────────
      {
        id: uuidv4(),
        username: 'zanele.motsa',
        email: 'zanele.motsa@student.uniswa.sz',
        password: hash('Student@123'),
        first_name: 'Zanele',
        last_name: 'Motsa',
        gender: 'female',
        date_of_birth: '2003-01-30',
        phone_number: '+268 7611 0001',
        region: 'hhohho',
        district: 'Kwaluseni',
        role: 'user',
        user_type: 'university_student',
        education_level: byLevel(4),
        current_institution: 'University of Eswatini',
        degree_program: 'Bachelor of Science in Computer Science',
        year_of_study: 2,
        employment_status: 'student',
        institution_id: UNESWA,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: 'sibusiso.lukhele',
        email: 'sibusiso.lukhele@student.sanu.sz',
        password: hash('Student@123'),
        first_name: 'Sibusiso',
        last_name: 'Lukhele',
        gender: 'male',
        date_of_birth: '2002-08-12',
        phone_number: '+268 7611 0002',
        region: 'manzini',
        district: 'Manzini',
        role: 'user',
        user_type: 'university_student',
        education_level: byLevel(4),
        current_institution: 'Southern Africa Nazarene University',
        degree_program: 'Bachelor of Social Work',
        year_of_study: 3,
        employment_status: 'student',
        institution_id: SANU,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: 'phumzile.hlophe',
        email: 'phumzile.hlophe@student.emcu.sz',
        password: hash('Student@123'),
        first_name: 'Phumzile',
        last_name: 'Hlophe',
        gender: 'female',
        date_of_birth: '2001-11-05',
        phone_number: '+268 7611 0003',
        region: 'lubombo',
        district: 'Siteki',
        role: 'user',
        user_type: 'university_student',
        education_level: byLevel(4),
        current_institution: 'Eswatini Medical Christian University',
        degree_program: 'Bachelor of Nursing Science',
        year_of_study: 4,
        employment_status: 'student',
        institution_id: EMCU,
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── Professionals ──────────────────────────────────────────
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
        role: 'user',
        user_type: 'professional',
        education_level: byLevel(4),
        current_occupation: 'Accountant',
        years_experience: 7,
        employment_status: 'employed',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        username: 'ntombi.vilakazi',
        email: 'ntombi.vilakazi@gmail.com',
        password: hash('Professional@123'),
        first_name: 'Ntombifuthi',
        last_name: 'Vilakazi',
        gender: 'female',
        date_of_birth: '1992-09-20',
        phone_number: '+268 7622 0002',
        region: 'manzini',
        district: 'Manzini',
        role: 'user',
        user_type: 'professional',
        education_level: byLevel(3),
        current_occupation: 'Nurse',
        years_experience: 4,
        employment_status: 'employed',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
        is_consent_given: true,
        consent_date: now,
        preferred_language: 'en',
        requires_accessibility: false,
        accessibility_needs: JSON.stringify({}),
        created_at: now,
        updated_at: now
      },

      // ── Demo User ──────────────────────────────────────────────
      {
        id: uuidv4(),
        username: 'demo.student',
        email: 'student@test.sz',
        password: hash('Student@123'),
        first_name: 'Demo',
        last_name: 'Student',
        gender: 'prefer_not_to_say',
        date_of_birth: '2005-06-01',
        phone_number: null,
        region: 'hhohho',
        district: 'Mbabane',
        role: 'user',
        user_type: 'school_student',
        education_level: byLevel(2),
        grade_level: 'Form 5',
        employment_status: 'student',
        is_active: true,
        is_email_verified: true,
        created_by_counselor: false,
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
     * Admin:         admin@labor.gov.sz          / Admin@123
     * Counselor 1:   counselor1@labor.gov.sz     / Counselor@123
     * Counselor 2:   counselor2@labor.gov.sz     / Counselor@123
     * Counselor 3:   counselor3@labor.gov.sz     / Counselor@123
     * School std:    username=20250101..20250301 / Pass@2025
     * Uni students:  zanele.motsa@...            / Student@123
     * Professionals: mandla.dlamini@gmail.com    / Professional@123
     * Demo:          student@test.sz             / Student@123
     */
  },

  async down(queryInterface) {
    const emails = [
      'admin@labor.gov.sz',
      'counselor1@labor.gov.sz',
      'counselor2@labor.gov.sz',
      'counselor3@labor.gov.sz',
      'zanele.motsa@student.uniswa.sz',
      'sibusiso.lukhele@student.sanu.sz',
      'phumzile.hlophe@student.emcu.sz',
      'mandla.dlamini@gmail.com',
      'ntombi.vilakazi@gmail.com',
      'student@test.sz'
    ];
    const usernames = ['20250101','20250102','20250201','20250202','20250301'];

    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email IN (:emails) OR username IN (:usernames)`,
      { replacements: { emails, usernames } }
    );
  }
};
