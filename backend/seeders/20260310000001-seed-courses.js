"use strict";

/**
 * Seed: Courses for Eswatini institutions with RIASEC mappings,
 * entry requirements, and course-institution links.
 *
 * Institutions referenced (must exist in DB):
 *   - University of Eswatini (UNESWA)
 *   - Southern Africa Nazarene University (SANU)
 *   - Limkokwing University
 *   - Eswatini Medical Christian University (EMCU)
 *   - Gwamile VOCTIM
 *   - Mananga Centre
 *   - Institute of Development Management (IDM)
 */

const { v4: uuidv4 } = require('uuid');

const pgArray = (arr) => {
  if (!arr || !arr.length) return null;
  const escaped = arr.map(s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
};

const now = new Date();

// --- Course definitions ---
const courses = [
  // SCIENCE & TECHNOLOGY (I, R)
  {
    id: uuidv4(), name: 'Bachelor of Science in Computer Science',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Covers software development, algorithms, databases, networks and AI fundamentals.',
    riasec_codes: ['IRS', 'RIC', 'IRC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Computer Science'],
    field_of_study: 'Technology'
  },
  {
    id: uuidv4(), name: 'Bachelor of Science in Information Technology',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Focuses on systems analysis, networking, cybersecurity and database management.',
    riasec_codes: ['IRC', 'CRI', 'ICS'],
    suggested_subjects: ['Mathematics', 'Computer Science', 'Physical Science'],
    field_of_study: 'Technology'
  },
  {
    id: uuidv4(), name: 'Bachelor of Engineering (Civil)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Design and construction of infrastructure including roads, bridges and buildings.',
    riasec_codes: ['RIE', 'RIC', 'IRE'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Technical Drawing'],
    field_of_study: 'Engineering'
  },
  {
    id: uuidv4(), name: 'Bachelor of Engineering (Electrical)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Electrical systems, electronics, power generation and telecommunications.',
    riasec_codes: ['RIE', 'RIC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Computer Science'],
    field_of_study: 'Engineering'
  },
  {
    id: uuidv4(), name: 'Bachelor of Science in Agriculture',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Crop science, animal science, soil science and sustainable farming practices.',
    riasec_codes: ['RIS', 'RIA'],
    suggested_subjects: ['Biology', 'Agricultural Science', 'Chemistry'],
    field_of_study: 'Agriculture'
  },

  // HEALTH SCIENCES (I, S)
  {
    id: uuidv4(), name: 'Bachelor of Medicine and Surgery (MBChB)',
    qualification_type: 'bachelor', duration_years: 6,
    description: 'Medical degree covering human anatomy, clinical medicine, surgery and patient care.',
    riasec_codes: ['ISA', 'IRS', 'ISR'],
    suggested_subjects: ['Biology', 'Chemistry', 'Mathematics', 'Physical Science'],
    field_of_study: 'Medicine'
  },
  {
    id: uuidv4(), name: 'Bachelor of Nursing Science',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Patient care, clinical nursing, community health and midwifery.',
    riasec_codes: ['SIA', 'SIR', 'ISA'],
    suggested_subjects: ['Biology', 'Chemistry', 'English Language'],
    field_of_study: 'Health Sciences'
  },
  {
    id: uuidv4(), name: 'Diploma in Environmental Health',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Public health, sanitation, disease prevention and environmental inspection.',
    riasec_codes: ['ISR', 'SIR'],
    suggested_subjects: ['Biology', 'Physical Science', 'Chemistry'],
    field_of_study: 'Health Sciences'
  },
  {
    id: uuidv4(), name: 'Bachelor of Pharmacy',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Pharmaceutical sciences, drug therapy, dispensing and patient counselling.',
    riasec_codes: ['ICS', 'ISC'],
    suggested_subjects: ['Chemistry', 'Biology', 'Mathematics'],
    field_of_study: 'Health Sciences'
  },

  // SOCIAL SCIENCES & HUMANITIES (S, A)
  {
    id: uuidv4(), name: 'Bachelor of Education (Primary)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Teaching methodology, curriculum development and child psychology.',
    riasec_codes: ['SAE', 'SAI'],
    suggested_subjects: ['English Language', 'Mathematics', 'History'],
    field_of_study: 'Education'
  },
  {
    id: uuidv4(), name: 'Bachelor of Education (Secondary)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Subject specialisation, pedagogy and secondary school teaching practice.',
    riasec_codes: ['SAE', 'SAI'],
    suggested_subjects: ['English Language', 'History', 'Biology'],
    field_of_study: 'Education'
  },
  {
    id: uuidv4(), name: 'Bachelor of Social Work',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Social welfare, community development, counselling and family services.',
    riasec_codes: ['SAI', 'SEA'],
    suggested_subjects: ['English Language', 'History', 'Religious Education'],
    field_of_study: 'Social Sciences'
  },
  {
    id: uuidv4(), name: 'Bachelor of Arts in Psychology',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Human behaviour, mental health, research methods and counselling theory.',
    riasec_codes: ['ISA', 'SAI'],
    suggested_subjects: ['Biology', 'English Language', 'History'],
    field_of_study: 'Social Sciences'
  },
  {
    id: uuidv4(), name: 'Bachelor of Arts in Communication',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Media studies, journalism, public relations and digital communication.',
    riasec_codes: ['AES', 'ASE'],
    suggested_subjects: ['English Language', 'Literature', 'Art'],
    field_of_study: 'Humanities'
  },

  // BUSINESS & COMMERCE (E, C)
  {
    id: uuidv4(), name: 'Bachelor of Commerce (Accounting)',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Financial reporting, auditing, taxation and management accounting.',
    riasec_codes: ['CEI', 'CES'],
    suggested_subjects: ['Accounting', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business'
  },
  {
    id: uuidv4(), name: 'Bachelor of Business Administration',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Management, marketing, finance, human resources and entrepreneurship.',
    riasec_codes: ['ESC', 'ECR'],
    suggested_subjects: ['Business Studies', 'Economics', 'English Language'],
    field_of_study: 'Business'
  },
  {
    id: uuidv4(), name: 'Bachelor of Commerce (Economics)',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Micro and macroeconomics, econometrics, development economics and policy.',
    riasec_codes: ['ICE', 'ECI'],
    suggested_subjects: ['Economics', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business'
  },
  {
    id: uuidv4(), name: 'Diploma in Human Resource Management',
    qualification_type: 'diploma', duration_years: 2,
    description: 'Recruitment, employee relations, performance management and labour law.',
    riasec_codes: ['ESC', 'SEA'],
    suggested_subjects: ['Business Studies', 'English Language', 'Accounting'],
    field_of_study: 'Business'
  },

  // LAW (E, I)
  {
    id: uuidv4(), name: 'Bachelor of Laws (LLB)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Constitutional law, criminal law, contract law, human rights and litigation.',
    riasec_codes: ['EIS', 'ESI'],
    suggested_subjects: ['English Language', 'History', 'Business Studies'],
    field_of_study: 'Law'
  },

  // CREATIVE & DESIGN (A)
  {
    id: uuidv4(), name: 'Bachelor of Arts (Fine Art & Design)',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Visual arts, graphic design, illustration, painting and studio practice.',
    riasec_codes: ['AES', 'AIE'],
    suggested_subjects: ['Art', 'Design & Technology', 'English Language'],
    field_of_study: 'Creative Arts'
  },

  // TVET / SHORT COURSES (R, C)
  {
    id: uuidv4(), name: 'National Vocational Certificate in Construction',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Practical construction skills including bricklaying, plumbing and carpentry.',
    riasec_codes: ['RCE', 'RCI'],
    suggested_subjects: ['Technical Drawing', 'Mathematics', 'Physical Science'],
    field_of_study: 'Trades'
  },
  {
    id: uuidv4(), name: 'National Vocational Certificate in Automotive Engineering',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Vehicle diagnostics, engine overhaul, electrical systems and workshop practice.',
    riasec_codes: ['RIC', 'RCE'],
    suggested_subjects: ['Technical Drawing', 'Physical Science', 'Mathematics'],
    field_of_study: 'Trades'
  },
  {
    id: uuidv4(), name: 'Certificate in Hotel and Catering',
    qualification_type: 'certificate', duration_years: 1,
    description: 'Food preparation, hospitality service, front office and accommodation management.',
    riasec_codes: ['ESC', 'ECS'],
    suggested_subjects: ['Home Economics', 'English Language', 'Business Studies'],
    field_of_study: 'Hospitality'
  },
  {
    id: uuidv4(), name: 'Diploma in Accounting and Finance',
    qualification_type: 'diploma', duration_years: 2,
    description: 'Bookkeeping, financial statements, payroll, budgeting and business tax.',
    riasec_codes: ['CEI', 'CES'],
    suggested_subjects: ['Accounting', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business'
  },
];

// --- Entry requirements per course ---
const requirementsMap = {
  'Bachelor of Science in Computer Science': [
    { subject: 'Mathematics', minimum_grade: 'B', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false }
  ],
  'Bachelor of Science in Information Technology': [
    { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Engineering (Civil)': [
    { subject: 'Mathematics', minimum_grade: 'A', is_mandatory: true },
    { subject: 'Physical Science', minimum_grade: 'B', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Engineering (Electrical)': [
    { subject: 'Mathematics', minimum_grade: 'A', is_mandatory: true },
    { subject: 'Physical Science', minimum_grade: 'B', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Science in Agriculture': [
    { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Agricultural Science', minimum_grade: 'C', is_mandatory: false },
    { subject: 'Chemistry', minimum_grade: 'C', is_mandatory: false }
  ],
  'Bachelor of Medicine and Surgery (MBChB)': [
    { subject: 'Biology', minimum_grade: 'A', is_mandatory: true },
    { subject: 'Chemistry', minimum_grade: 'A', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'B', is_mandatory: true },
    { subject: 'Physical Science', minimum_grade: 'B', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'B', is_mandatory: true }
  ],
  'Bachelor of Nursing Science': [
    { subject: 'Biology', minimum_grade: 'B', is_mandatory: true },
    { subject: 'Chemistry', minimum_grade: 'C', is_mandatory: false },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Diploma in Environmental Health': [
    { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Pharmacy': [
    { subject: 'Chemistry', minimum_grade: 'B', is_mandatory: true },
    { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Education (Primary)': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true }
  ],
  'Bachelor of Education (Secondary)': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true }
  ],
  'Bachelor of Social Work': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'History', minimum_grade: 'D', is_mandatory: false }
  ],
  'Bachelor of Arts in Psychology': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Biology', minimum_grade: 'C', is_mandatory: false }
  ],
  'Bachelor of Arts in Communication': [
    { subject: 'English Language', minimum_grade: 'B', is_mandatory: true }
  ],
  'Bachelor of Commerce (Accounting)': [
    { subject: 'Accounting', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'Bachelor of Business Administration': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false },
    { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: false }
  ],
  'Bachelor of Commerce (Economics)': [
    { subject: 'Economics', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true }
  ],
  'Diploma in Human Resource Management': [
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false }
  ],
  'Bachelor of Laws (LLB)': [
    { subject: 'English Language', minimum_grade: 'B', is_mandatory: true },
    { subject: 'History', minimum_grade: 'C', is_mandatory: false }
  ],
  'Bachelor of Arts (Fine Art & Design)': [
    { subject: 'Art', minimum_grade: 'C', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
  ],
  'National Vocational Certificate in Construction': [
    { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
    { subject: 'English Language', minimum_grade: 'D', is_mandatory: true }
  ],
  'National Vocational Certificate in Automotive Engineering': [
    { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
    { subject: 'Physical Science', minimum_grade: 'D', is_mandatory: false }
  ],
  'Certificate in Hotel and Catering': [
    { subject: 'English Language', minimum_grade: 'D', is_mandatory: true }
  ],
  'Diploma in Accounting and Finance': [
    { subject: 'Accounting', minimum_grade: 'C', is_mandatory: true },
    { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true }
  ]
};

// --- Institution → courses offered ---
// Keys must match institution names in DB (case-insensitive match handled in seeder)
const institutionCourses = {
  'University of Eswatini': [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology',
    'Bachelor of Engineering (Civil)',
    'Bachelor of Engineering (Electrical)',
    'Bachelor of Science in Agriculture',
    'Bachelor of Nursing Science',
    'Bachelor of Education (Primary)',
    'Bachelor of Education (Secondary)',
    'Bachelor of Social Work',
    'Bachelor of Arts in Psychology',
    'Bachelor of Commerce (Accounting)',
    'Bachelor of Business Administration',
    'Bachelor of Commerce (Economics)',
    'Bachelor of Laws (LLB)',
    'Bachelor of Arts in Communication'
  ],
  'Southern Africa Nazarene University': [
    'Bachelor of Education (Primary)',
    'Bachelor of Education (Secondary)',
    'Bachelor of Social Work',
    'Bachelor of Arts in Psychology',
    'Bachelor of Business Administration',
    'Bachelor of Commerce (Accounting)',
    'Bachelor of Arts in Communication'
  ],
  'Limkokwing University': [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology',
    'Bachelor of Arts (Fine Art & Design)',
    'Bachelor of Arts in Communication',
    'Bachelor of Business Administration'
  ],
  'Eswatini Medical Christian University': [
    'Bachelor of Medicine and Surgery (MBChB)',
    'Bachelor of Nursing Science',
    'Bachelor of Pharmacy',
    'Diploma in Environmental Health'
  ],
  'Gwamile VOCTIM': [
    'National Vocational Certificate in Construction',
    'National Vocational Certificate in Automotive Engineering',
    'Certificate in Hotel and Catering',
    'Diploma in Accounting and Finance',
    'Diploma in Human Resource Management'
  ]
};

module.exports = {
  async up(queryInterface) {
    // 1. Insert courses
    const courseRows = courses.map(c => ({
      ...c,
      riasec_codes: pgArray(c.riasec_codes),
      suggested_subjects: pgArray(c.suggested_subjects),
      is_active: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('courses', courseRows, {});

    // 2. Insert course requirements
    const reqRows = [];
    for (const course of courses) {
      const reqs = requirementsMap[course.name] || [];
      for (const r of reqs) {
        reqRows.push({
          id: uuidv4(),
          course_id: course.id,
          subject: r.subject,
          minimum_grade: r.minimum_grade,
          is_mandatory: r.is_mandatory,
          created_at: now,
          updated_at: now
        });
      }
    }
    if (reqRows.length > 0) {
      await queryInterface.bulkInsert('course_requirements', reqRows, {});
    }

    // 3. Insert course-institution links
    const [institutions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM institutions'
    );

    const ciRows = [];
    for (const [instName, courseNames] of Object.entries(institutionCourses)) {
      const inst = institutions.find(
        i => i.name.toLowerCase().trim() === instName.toLowerCase().trim()
      );
      if (!inst) continue;

      for (const courseName of courseNames) {
        const course = courses.find(c => c.name === courseName);
        if (!course) continue;

        ciRows.push({
          id: uuidv4(),
          course_id: course.id,
          institution_id: inst.id,
          is_active: true,
          created_at: now,
          updated_at: now
        });
      }
    }
    if (ciRows.length > 0) {
      await queryInterface.bulkInsert('course_institutions', ciRows, {});
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('course_institutions', null, {});
    await queryInterface.bulkDelete('course_requirements', null, {});
    await queryInterface.bulkDelete('courses', null, {});
  }
};
