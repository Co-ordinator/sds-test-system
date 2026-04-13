"use strict";

/**
 * Comprehensive Courses Seeder for All Eswatini Institutions
 * Maps courses to: UNESWA, SANU, EMCU, Limkokwing, Botho, Regent, IDM, Mananga,
 * ECOT, Gwamile VOCTIM, Nursing Colleges, Teacher Training Colleges, etc.
 */

const { v4: uuidv4 } = require('uuid');

const pgArray = (arr) => {
  if (!arr || !arr.length) return null;
  const escaped = arr.map(s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
};

const now = new Date();

const courses = [
  // ═══════════════════════════════════════════════════════════════
  // UNIVERSITY OF ESWATINI (UNESWA) - Comprehensive Programs
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Bachelor of Science in Computer Science',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Software development, algorithms, databases, networks, AI and machine learning.',
    riasec_codes: ['IRS', 'RIC', 'IRC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Computer Science'],
    field_of_study: 'Technology', institutions: ['University of Eswatini', 'Eswatini Medical Christian University']
  },
  {
    id: uuidv4(), name: 'Bachelor of Engineering in Electrical and Electronic Engineering',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Electrical systems, electronics, power generation and telecommunications.',
    riasec_codes: ['RIE', 'RIC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Computer Science'],
    field_of_study: 'Engineering', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Science in Agriculture',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Crop science, animal science, soil science and sustainable farming practices.',
    riasec_codes: ['RIS', 'RIA'],
    suggested_subjects: ['Biology', 'Agricultural Science', 'Chemistry'],
    field_of_study: 'Agriculture', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Commerce in Accounting and Finance',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Financial accounting, financial reporting, auditing, taxation and management accounting.',
    riasec_codes: ['CEI', 'CES'],
    suggested_subjects: ['Accounting', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business', institutions: ['University of Eswatini', 'Botho University']
  },
  {
    id: uuidv4(), name: 'Bachelor of Commerce in Management',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Business management, organisational behaviour, economics, strategy and entrepreneurship.',
    riasec_codes: ['ICE', 'ECI'],
    suggested_subjects: ['Economics', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Education (Primary)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Teaching methodology, curriculum development and child psychology.',
    riasec_codes: ['SAE', 'SAI'],
    suggested_subjects: ['English Language', 'Mathematics', 'History'],
    field_of_study: 'Education', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Education (Secondary)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Subject specialization, pedagogy and secondary school teaching practice.',
    riasec_codes: ['SAE', 'SAI'],
    suggested_subjects: ['English Language', 'History', 'Biology'],
    field_of_study: 'Education', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Science (General)',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Flexible science degree with majors in Biology, Chemistry, Physics, Mathematics, Geography.',
    riasec_codes: ['IRS', 'ISR'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Biology'],
    field_of_study: 'Science', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Consumer Science',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Food science, nutrition, textiles, fashion design and consumer economics.',
    riasec_codes: ['SAE', 'AES'],
    suggested_subjects: ['Home Economics', 'Biology', 'Business Studies'],
    field_of_study: 'Consumer Sciences', institutions: ['University of Eswatini']
  },
  {
    id: uuidv4(), name: 'Bachelor of Arts in Journalism and Mass Communication',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Journalism, mass communication, media studies, public relations and digital media.',
    riasec_codes: ['AES', 'ASE'],
    suggested_subjects: ['English Language', 'Literature', 'Art'],
    field_of_study: 'Humanities', institutions: ['University of Eswatini', 'Limkokwing University of Creative Technology']
  },
  {
    id: uuidv4(), name: 'Bachelor of Social Work',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Social welfare, community development, counselling and family services.',
    riasec_codes: ['SAI', 'SEA'],
    suggested_subjects: ['English Language', 'History', 'Religious Education'],
    field_of_study: 'Social Sciences', institutions: ['University of Eswatini', 'Southern Africa Nazarene University', 'Eswatini Medical Christian University']
  },

  // ═══════════════════════════════════════════════════════════════
  // HEALTH SCIENCES - UNESWA, SANU, EMCU, Nursing Colleges
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Bachelor of Nursing Science',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Patient care, clinical nursing, community health and midwifery.',
    riasec_codes: ['SIA', 'SIR', 'ISA'],
    suggested_subjects: ['Biology', 'Chemistry', 'English Language'],
    field_of_study: 'Health Sciences', institutions: ['University of Eswatini', 'Southern Africa Nazarene University', 'Eswatini Medical Christian University']
  },
  {
    id: uuidv4(), name: 'Bachelor of Pharmacy',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Pharmaceutical sciences, drug therapy, dispensing and patient counselling.',
    riasec_codes: ['ICS', 'ISC'],
    suggested_subjects: ['Chemistry', 'Biology', 'Mathematics'],
    field_of_study: 'Health Sciences', institutions: ['Southern Africa Nazarene University', 'Eswatini Medical Christian University']
  },
  {
    id: uuidv4(), name: 'Bachelor of Medical Laboratory Sciences',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Clinical laboratory testing, diagnostics, pathology and laboratory management.',
    riasec_codes: ['IRS', 'ISR'],
    suggested_subjects: ['Biology', 'Chemistry', 'Mathematics'],
    field_of_study: 'Health Sciences', institutions: ['Southern Africa Nazarene University', 'Eswatini Medical Christian University']
  },
  {
    id: uuidv4(), name: 'Bachelor of Radiography',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Medical imaging, radiology, diagnostic techniques and patient care.',
    riasec_codes: ['IRS', 'ISA'],
    suggested_subjects: ['Physical Science', 'Biology', 'Mathematics'],
    field_of_study: 'Health Sciences', institutions: []
  },
  {
    id: uuidv4(), name: 'Bachelor of Psychology',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Human behaviour, mental health, research methods and counselling theory.',
    riasec_codes: ['ISA', 'SAI'],
    suggested_subjects: ['Biology', 'English Language', 'History'],
    field_of_study: 'Social Sciences', institutions: ['Eswatini Medical Christian University']
  },
  {
    id: uuidv4(), name: 'Diploma in General Nursing',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Foundation nursing care, clinical skills and patient management.',
    riasec_codes: ['SIA', 'ISA'],
    suggested_subjects: ['Biology', 'English Language', 'Physical Science'],
    field_of_study: 'Health Sciences', institutions: ['Good Shepherd Nursing College', 'Raleigh Fitkin Memorial Hospital Nursing School']
  },
  {
    id: uuidv4(), name: 'Diploma in Pharmacy',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Pharmaceutical sciences, pharmacology, patient care and drug delivery systems with hands-on clinical training.',
    riasec_codes: ['ICS', 'ISC'],
    suggested_subjects: ['Chemistry', 'Biology', 'Mathematics'],
    field_of_study: 'Health Sciences', institutions: ['Southern Africa Nazarene University']
  },
  // ═══════════════════════════════════════════════════════════════
  // BUSINESS & MANAGEMENT - Botho, Regent, IDM, Mananga
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Bachelor of Business Administration',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Management, marketing, finance, human resources and entrepreneurship.',
    riasec_codes: ['ESC', 'ECR'],
    suggested_subjects: ['Business Studies', 'Economics', 'English Language'],
    field_of_study: 'Business', institutions: ['Botho University', 'Mananga Centre for Management Development']
  },
  {
    id: uuidv4(), name: 'Master of Business Administration (MBA)',
    qualification_type: 'masters', duration_years: 2,
    description: 'Advanced business strategy, leadership, finance and organizational management.',
    riasec_codes: ['ESI', 'EIS'],
    suggested_subjects: [],
    field_of_study: 'Business', institutions: ['Regent Business School', 'Mananga Centre for Management Development']
  },
  {
    id: uuidv4(), name: 'Diploma in Business Management',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Business fundamentals, management principles and entrepreneurship.',
    riasec_codes: ['ESC', 'CEI'],
    suggested_subjects: ['Business Studies', 'Accounting', 'Economics'],
    field_of_study: 'Business', institutions: ['Southern Africa Nazarene University', 'Institute of Development Management', 'Mananga Centre for Management Development']
  },
  {
    id: uuidv4(), name: 'Diploma in Human Resource Management',
    qualification_type: 'diploma', duration_years: 2,
    description: 'Recruitment, employee relations, performance management and labour law.',
    riasec_codes: ['ESC', 'SEA'],
    suggested_subjects: ['Business Studies', 'English Language', 'Accounting'],
    field_of_study: 'Business', institutions: ['Institute of Development Management']
  },
  {
    id: uuidv4(), name: 'Diploma in Public Health Management',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Health systems management, public health policy and community health.',
    riasec_codes: ['SIA', 'ISA'],
    suggested_subjects: ['Biology', 'English Language', 'Business Studies'],
    field_of_study: 'Health Sciences', institutions: ['Institute of Development Management']
  },

  // ═══════════════════════════════════════════════════════════════
  // CREATIVE ARTS & DESIGN - Limkokwing
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Bachelor of Arts in Graphic Design',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Visual communication, branding, digital design and creative problem solving.',
    riasec_codes: ['AES', 'AIE'],
    suggested_subjects: ['Art', 'Design & Technology', 'Computer Science'],
    field_of_study: 'Creative Arts', institutions: ['Limkokwing University of Creative Technology']
  },
  {
    id: uuidv4(), name: 'Bachelor of Arts in Fashion Design',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Fashion illustration, garment construction, textiles and fashion business.',
    riasec_codes: ['AES', 'AER'],
    suggested_subjects: ['Art', 'Design & Technology', 'Business Studies'],
    field_of_study: 'Creative Arts', institutions: ['Limkokwing University of Creative Technology']
  },
  {
    id: uuidv4(), name: 'Bachelor of Multimedia Design',
    qualification_type: 'bachelor', duration_years: 3,
    description: 'Animation, video production, interactive media and digital storytelling.',
    riasec_codes: ['AES', 'AIE'],
    suggested_subjects: ['Art', 'Computer Science', 'English Language'],
    field_of_study: 'Creative Arts', institutions: ['Limkokwing University of Creative Technology']
  },

  // ═══════════════════════════════════════════════════════════════
  // ENGINEERING & TECHNOLOGY - UNESWA, Botho, ECOT
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Diploma in Electrical Engineering',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Electrical installations, power systems and electronic circuits.',
    riasec_codes: ['RIE', 'RIC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Technical Drawing'],
    field_of_study: 'Engineering', institutions: ['Eswatini College of Technology']
  },
  {
    id: uuidv4(), name: 'Diploma in Mechanical Engineering',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Machine design, thermodynamics, manufacturing and maintenance.',
    riasec_codes: ['RIE', 'RIC'],
    suggested_subjects: ['Mathematics', 'Physical Science', 'Technical Drawing'],
    field_of_study: 'Engineering', institutions: ['Eswatini College of Technology']
  },
  {
    id: uuidv4(), name: 'Diploma in Information Technology',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Network administration, software development and IT support.',
    riasec_codes: ['IRC', 'ICS'],
    suggested_subjects: ['Mathematics', 'Computer Science', 'Physical Science'],
    field_of_study: 'Technology', institutions: ['Eswatini College of Technology']
  },

  // ═══════════════════════════════════════════════════════════════
  // VOCATIONAL & TVET - Gwamile VOCTIM
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'National Certificate in Building and Construction',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Bricklaying, plastering, construction techniques and building safety.',
    riasec_codes: ['RCE', 'RCI'],
    suggested_subjects: ['Technical Drawing', 'Mathematics', 'Physical Science'],
    field_of_study: 'Trades', institutions: ['Gwamile Vocational and Commercial Training Institute']
  },
  {
    id: uuidv4(), name: 'National Certificate in Motor Vehicle Mechanics',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Engine diagnostics, vehicle repair, electrical systems and maintenance.',
    riasec_codes: ['RIC', 'RCE'],
    suggested_subjects: ['Technical Drawing', 'Physical Science', 'Mathematics'],
    field_of_study: 'Trades', institutions: ['Gwamile Vocational and Commercial Training Institute']
  },
  {
    id: uuidv4(), name: 'National Certificate in Electrical Installation',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Wiring, electrical systems, safety regulations and installations.',
    riasec_codes: ['RIE', 'RCI'],
    suggested_subjects: ['Physical Science', 'Mathematics', 'Technical Drawing'],
    field_of_study: 'Trades', institutions: ['Gwamile Vocational and Commercial Training Institute']
  },
  {
    id: uuidv4(), name: 'National Certificate in Carpentry and Joinery',
    qualification_type: 'tvet', duration_years: 2,
    description: 'Woodworking, furniture making, joinery and construction carpentry.',
    riasec_codes: ['RAE', 'RCE'],
    suggested_subjects: ['Technical Drawing', 'Mathematics', 'Design & Technology'],
    field_of_study: 'Trades', institutions: ['Gwamile Vocational and Commercial Training Institute']
  },
  {
    id: uuidv4(), name: 'Diploma in Business Finance and Accounting',
    qualification_type: 'diploma', duration_years: 2,
    description: 'Bookkeeping, financial statements, payroll and business tax.',
    riasec_codes: ['CEI', 'CES'],
    suggested_subjects: ['Accounting', 'Mathematics', 'Business Studies'],
    field_of_study: 'Business', institutions: ['Gwamile Vocational and Commercial Training Institute']
  },

  // ═══════════════════════════════════════════════════════════════
  // TEACHER TRAINING - NTTC, William Pitcher
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Primary Teachers Diploma (PTD)',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Primary education pedagogy, child development and classroom management.',
    riasec_codes: ['SAE', 'SAI'],
    suggested_subjects: ['English Language', 'Mathematics', 'Any Science'],
    field_of_study: 'Education', institutions: ['Ngwane Teacher Training College', 'William Pitcher College', 'Southern Africa Nazarene University']
  },
  {
    id: uuidv4(), name: 'Secondary Teachers Diploma (STD)',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Subject-specific teaching methods and secondary education practice.',
    riasec_codes: ['SAI', 'SAE'],
    suggested_subjects: ['English Language', 'Subject Major', 'Subject Minor'],
    field_of_study: 'Education', institutions: ['Ngwane Teacher Training College', 'William Pitcher College']
  },

  // ═══════════════════════════════════════════════════════════════
  // THEOLOGY - SANU, Swaziland College of Theology
  // ═══════════════════════════════════════════════════════════════
  {
    id: uuidv4(), name: 'Bachelor of Theology',
    qualification_type: 'bachelor', duration_years: 4,
    description: 'Biblical studies, systematic theology, church history and pastoral ministry.',
    riasec_codes: ['SAI', 'SEA'],
    suggested_subjects: ['English Language', 'History', 'Religious Education'],
    field_of_study: 'Theology', institutions: ['Southern Africa Nazarene University', 'Swaziland College of Theology']
  },
  {
    id: uuidv4(), name: 'Diploma in Theology',
    qualification_type: 'diploma', duration_years: 3,
    description: 'Biblical foundations, ministry skills and Christian leadership.',
    riasec_codes: ['SAI', 'SEA'],
    suggested_subjects: ['English Language', 'Religious Education', 'History'],
    field_of_study: 'Theology', institutions: ['Southern Africa Nazarene University', 'Swaziland College of Theology']
  }
];

module.exports = {
  async up(queryInterface) {
    const [institutions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM institutions'
    );

    const normalizeName = (name) => String(name || '').trim().toLowerCase();
    const institutionMap = {};
    institutions.forEach(inst => {
      institutionMap[normalizeName(inst.name)] = inst.id;
    });

    // Insert courses
    const coursesWithTimestamps = courses.map(c => {
      const { institutions: _, ...courseData } = c;
      return {
        ...courseData,
        riasec_codes: pgArray(courseData.riasec_codes),
        suggested_subjects: pgArray(courseData.suggested_subjects),
        created_at: now,
        updated_at: now
      };
    });

    await queryInterface.bulkInsert('courses', coursesWithTimestamps, { ignoreDuplicates: true });
    console.log(`Inserted ${coursesWithTimestamps.length} courses.`);

    // Create course-institution mappings
    const courseInstitutionLinks = [];
    const missingInstitutionNames = new Set();
    courses.forEach(course => {
      if (course.institutions && course.institutions.length > 0) {
        course.institutions.forEach(instName => {
          const institutionId = institutionMap[normalizeName(instName)];
          if (institutionId) {
            courseInstitutionLinks.push({
              id: uuidv4(),
              course_id: course.id,
              institution_id: institutionId,
              created_at: now,
              updated_at: now
            });
          } else {
            missingInstitutionNames.add(instName);
          }
        });
      }
    });

    if (missingInstitutionNames.size > 0) {
      throw new Error(
        `Unmatched course institution names: ${Array.from(missingInstitutionNames).sort().join(', ')}`
      );
    }

    if (courseInstitutionLinks.length > 0) {
      await queryInterface.bulkInsert('course_institutions', courseInstitutionLinks, { ignoreDuplicates: true });
      console.log(`Created ${courseInstitutionLinks.length} course-institution links.`);
    }

    // Create entry requirements for all major courses
    const requirementsData = [
      {
        courseName: 'Bachelor of Science in Computer Science',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Computer Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Engineering in Electrical and Electronic Engineering',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Bachelor of Science in Agriculture',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Chemistry', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Agricultural Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Commerce in Accounting and Finance',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Accounting', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Commerce in Management',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Economics', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Education (Primary)',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Bachelor of Education (Secondary)',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Subject Major', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Subject Minor', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Science (General)',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Consumer Science',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Home Economics', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Arts in Journalism and Mass Communication',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Literature in English', minimum_grade: 'C', is_mandatory: false },
          { subject: 'History', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Social Work',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'History', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Religious Education', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Nursing Science',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Chemistry', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Pharmacy',
        requirements: [
          { subject: 'Chemistry', minimum_grade: 'B', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'B', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Bachelor of Medical Laboratory Sciences',
        requirements: [
          { subject: 'Biology', minimum_grade: 'B', is_mandatory: true },
          { subject: 'Chemistry', minimum_grade: 'B', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Bachelor of Radiography',
        requirements: [
          { subject: 'Physical Science', minimum_grade: 'B', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Bachelor of Psychology',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false },
          { subject: 'History', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in General Nursing',
        requirements: [
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Pharmacy',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Chemistry', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Business Administration',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Economics', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Business Management',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Accounting', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Human Resource Management',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Diploma in Public Health Management',
        requirements: [
          { subject: 'Biology', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Business Studies', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Arts in Graphic Design',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Art', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Design and Technology', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Arts in Fashion Design',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Art', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Design and Technology', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Multimedia Design',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Art', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Computer Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Electrical Engineering',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Technical Drawing', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Mechanical Engineering',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Technical Drawing', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Information Technology',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Computer Science', minimum_grade: 'C', is_mandatory: false },
          { subject: 'Physical Science', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'National Certificate in Building and Construction',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'D', is_mandatory: true },
          { subject: 'Technical Drawing', minimum_grade: 'D', is_mandatory: false }
        ]
      },
      {
        courseName: 'National Certificate in Motor Vehicle Mechanics',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'D', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'D', is_mandatory: true }
        ]
      },
      {
        courseName: 'National Certificate in Electrical Installation',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
          { subject: 'Physical Science', minimum_grade: 'D', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'D', is_mandatory: true },
          { subject: 'Technical Drawing', minimum_grade: 'D', is_mandatory: false }
        ]
      },
      {
        courseName: 'National Certificate in Carpentry and Joinery',
        requirements: [
          { subject: 'Mathematics', minimum_grade: 'D', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'D', is_mandatory: true },
          { subject: 'Technical Drawing', minimum_grade: 'D', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Business Finance and Accounting',
        requirements: [
          { subject: 'Accounting', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true },
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Primary Teachers Diploma (PTD)',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Mathematics', minimum_grade: 'C', is_mandatory: true }
        ]
      },
      {
        courseName: 'Secondary Teachers Diploma (STD)',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Subject Major', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Subject Minor', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Bachelor of Theology',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Religious Education', minimum_grade: 'C', is_mandatory: false }
        ]
      },
      {
        courseName: 'Diploma in Theology',
        requirements: [
          { subject: 'English Language', minimum_grade: 'C', is_mandatory: true },
          { subject: 'Religious Education', minimum_grade: 'D', is_mandatory: false }
        ]
      }
    ];

    const courseRequirements = [];
    requirementsData.forEach(({ courseName, requirements }) => {
      const course = courses.find(c => c.name === courseName);
      if (course) {
        requirements.forEach(req => {
          courseRequirements.push({
            id: uuidv4(),
            course_id: course.id,
            ...req,
            created_at: now,
            updated_at: now
          });
        });
      }
    });

    if (courseRequirements.length > 0) {
      await queryInterface.bulkInsert('course_requirements', courseRequirements, { ignoreDuplicates: true });
      console.log(`Created ${courseRequirements.length} course requirements.`);
    }
  },

  async down(queryInterface) {
    const courseIds = courses.map(c => c.id);
    await queryInterface.bulkDelete('course_requirements', { course_id: courseIds }, {});
    await queryInterface.bulkDelete('course_institutions', { course_id: courseIds }, {});
    await queryInterface.bulkDelete('courses', { id: courseIds }, {});
  }
};
