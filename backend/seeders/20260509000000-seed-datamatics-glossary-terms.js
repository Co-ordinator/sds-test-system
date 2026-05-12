'use strict';

const { v4: uuidv4 } = require('uuid');

// Source: docs/Datamatics List of terms.docx
const terms = [
  // Section I - Activities
  {
    term: 'Mechanical apparatus',
    definition: 'A machine, tool, or device with working parts.',
    section: 'activities',
    example: 'A pump, engine, or measuring instrument.',
  },
  {
    term: 'Chemistry',
    definition: 'The science of substances and how they change.',
    section: 'activities',
    example: 'Mixing chemicals safely in a laboratory.',
  },
  {
    term: 'Recitals',
    definition: 'Public performances of music, speech, or poetry.',
    section: 'activities',
    example: 'A piano recital or poetry recital.',
  },
  {
    term: 'Portraits',
    definition: 'Pictures or photographs of people.',
    section: 'activities',
    example: 'Drawing or photographing a person\'s face.',
  },
  {
    term: 'Sociology',
    definition: 'The study of people, groups, and society.',
    section: 'activities',
    example: 'Studying families, communities, or social problems.',
  },
  {
    term: 'Psychology',
    definition: 'The study of the mind and human behaviour.',
    section: 'activities',
    example: 'Studying how people think, feel, and act.',
  },
  {
    term: 'Accomplishing',
    definition: 'Successfully completing or achieving something.',
    section: 'activities',
    example: 'Accomplishing a goal or finishing a project.',
  },

  // Section II - Competencies
  {
    term: 'Interpretive',
    definition: 'Explaining the meaning of information, art, or events.',
    section: 'competencies',
    example: 'Giving an interpretive explanation of a poem.',
  },
  {
    term: 'Debater',
    definition: 'A person who argues ideas in a formal discussion.',
    section: 'competencies',
    example: 'A student competing in a school debate.',
  },
  {
    term: 'Sculpture',
    definition: 'Three-dimensional artwork made by shaping materials.',
    section: 'competencies',
    example: 'A statue made from clay, wood, or stone.',
  },
  {
    term: 'Ambitious',
    definition: 'Eager to achieve goals and succeed.',
    section: 'competencies',
    example: 'An ambitious learner works hard toward future goals.',
  },
  {
    term: 'Correspondence',
    definition: 'Written communication, such as letters or emails.',
    section: 'competencies',
    example: 'Sending official correspondence to an office.',
  },

  // Section III - Occupations and occupation words
  {
    term: 'Microbiologist',
    definition: 'A scientist who studies very small living organisms.',
    section: 'occupations',
    example: 'Studying bacteria, viruses, or fungi.',
  },
  {
    term: 'Microscopic',
    definition: 'Too small to see clearly without a microscope.',
    section: 'occupations',
    example: 'Microscopic organisms can be seen in a laboratory.',
  },
  {
    term: 'Physicist',
    definition: 'A scientist who studies matter, energy, and forces.',
    section: 'occupations',
    example: 'Researching light, electricity, motion, or space.',
  },
  {
    term: 'Symphony',
    definition: 'A long musical work usually played by an orchestra.',
    section: 'occupations',
    example: 'A symphony performed in a concert hall.',
  },
  {
    term: 'Orchestra',
    definition: 'A large group of musicians playing instruments together.',
    section: 'occupations',
    example: 'An orchestra with violins, drums, and flutes.',
  },
  {
    term: 'Freelance',
    definition: 'Working independently for different clients.',
    section: 'occupations',
    example: 'A freelance writer works for several clients.',
  },
  {
    term: 'Commercial',
    definition: 'Related to business, selling, or profit.',
    section: 'occupations',
    example: 'Commercial art is created for business use.',
  },
  {
    term: 'Lyricist',
    definition: 'A person who writes words for songs.',
    section: 'occupations',
    example: 'A lyricist writes lyrics for a musician.',
  },
  {
    term: 'Sculptor',
    definition: 'An artist who creates three-dimensional artworks.',
    section: 'occupations',
    example: 'A sculptor shapes clay, wood, metal, or stone.',
  },
  {
    term: 'Sculptress',
    definition: 'A woman who creates three-dimensional artworks.',
    section: 'occupations',
    example: 'A sculptress may create statues or carvings.',
  },
  {
    term: 'Therapist',
    definition: 'A trained person who helps improve health or wellbeing.',
    section: 'occupations',
    example: 'A therapist helps people recover or cope better.',
  },
  {
    term: 'Counsellor',
    definition: 'A person trained to give guidance and support.',
    section: 'occupations',
    example: 'A counsellor helps people discuss problems.',
  },
  {
    term: 'Psychiatric',
    definition: 'Related to mental health and its treatment.',
    section: 'occupations',
    example: 'Psychiatric care supports people with mental illness.',
  },
  {
    term: 'Speculator',
    definition: 'A person who takes financial risks for possible profit.',
    section: 'occupations',
    example: 'A speculator buys assets hoping prices rise.',
  },
  {
    term: 'Advocate',
    definition: 'A person who supports or speaks for others.',
    section: 'occupations',
    example: 'An advocate speaks for a community or client.',
  },
  {
    term: 'Personnel',
    definition: 'Employees or staff members in an organisation.',
    section: 'occupations',
    example: 'Personnel records contain staff information.',
  },
  {
    term: 'Chartered accountant',
    definition: 'A qualified accountant who prepares or audits finances.',
    section: 'occupations',
    example: 'A chartered accountant checks business accounts.',
  },
  {
    term: 'Court stenographer',
    definition: 'A person who records spoken words in court.',
    section: 'occupations',
    example: 'A court stenographer records legal proceedings.',
  },
  {
    term: 'Inventory',
    definition: 'A list of goods, materials, or items kept.',
    section: 'occupations',
    example: 'A shop inventory lists products in stock.',
  },
  {
    term: 'Analyst',
    definition: 'A person who studies information to find meaning.',
    section: 'occupations',
    example: 'An analyst studies data to support decisions.',
  },

  // Section IV - Self estimates
  {
    term: 'Manual',
    definition: 'Done with the hands rather than by machine.',
    section: 'self_estimates',
    example: 'Manual skills include sewing, fixing, or assembling.',
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [enumRows] = await queryInterface.sequelize.query(`
      SELECT e.enumlabel AS value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_glossary_terms_section'
      ORDER BY e.enumsortorder
    `);
    const enumValues = enumRows.map(r => r.value);
    const toEnumSection = (section) => {
      const exact = enumValues.find(v => v === section);
      if (exact) return exact;
      const ci = enumValues.find(v => String(v).toLowerCase() === String(section).toLowerCase());
      if (ci) return ci;
      return enumValues.includes('general') ? 'general' : enumValues[0] || section;
    };

    const rows = terms.map(t => ({
      id: uuidv4(),
      term: t.term,
      definition: t.definition,
      section: toEnumSection(t.section),
      example: t.example || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('glossary_terms', rows, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('glossary_terms', {
      term: terms.map(t => t.term),
    }, {});
  },
};
