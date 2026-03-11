"use strict";

const { v4: uuidv4 } = require('uuid');
const now = new Date();

/**
 * SDS Questions Seeder — 228 questions from the official SDS Questionnaire Master
 *
 * Section I:   Activities     (66 questions  — 11 per RIASEC type, grouped by type)
 * Section II:  Competencies   (66 questions  — 11 per RIASEC type, grouped by type)
 * Section III: Occupations    (84 questions  — 14 per RIASEC type, grouped by type)
 * Section IV:  Self-Rating    (12 questions  —  2 per RIASEC type, interleaved R,I,A,S,E,C)
 *
 * Order values match the questionOrder column in the master CSV (1–228).
 * Question codes match the questionCode column (R1, I12, … SR1, SR12).
 */

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];

// ─── Section I: Activities ──────────────────────────────────────────────────────

const ACTIVITIES = {
  R: [
    'Fix electrical apparatus',
    'Repair motor cars',
    'Fix mechanical apparatus',
    'Build objects with wood',
    'Drive a truck or tractor',
    'Use metalwork or machine tools.',
    'Work on a bicycle or motorcycle',
    'Take a technical course',
    'Take a course in mechanical drawing',
    'Take a woodworking course',
    'Take a motor mechanics course'
  ],
  I: [
    'Read scientific books or magazines',
    'Work in a laboratory',
    'Work on a research project',
    'Study a scientific theory',
    'Work with a chemistry set',
    'Read about a special subject on my own',
    'Apply mathematics to a practical problem',
    'Take physics course',
    'Take chemistry course',
    'Take a mathematics course',
    'Take a biology course'
  ],
  A: [
    'Sketch, draw, or paint',
    'Take part in a comedy or play',
    'Design furniture, clothing, posters, or buildings',
    'Play in a band, musical group or orchestra',
    'Practise to play a musical instrument',
    'Go to recitals, concerts or musicals',
    'Create portraits or take photographs',
    'Read plays',
    'Read or write poetry',
    'Take an art course',
    'Arrange or compose music of any kind'
  ],
  S: [
    'Write letters to friends',
    'Read articles or books on sociology',
    'Belong to social clubs',
    'Help others with their personal problems',
    'Take care of children',
    'Go to parties/social meetings.',
    'Dance',
    'Read books on psychology',
    'Help handicapped people',
    'Go to sports events',
    'Teach in a school'
  ],
  E: [
    'Convince other people',
    'Sell something',
    'Discuss politics',
    'Manage your own service or business',
    'Go to meetings',
    'Give talks',
    'Act as a leader of a group',
    'Supervise the work of others',
    'Meet important people',
    'Lead a group in accomplishing some goal',
    'Participate in a political campaign'
  ],
  C: [
    'Keep your own desk and room neat',
    'Type papers or letters',
    'Add, subtract, multiply and divide numbers',
    'Operate business machines of any kind',
    'Keep detailed records of expenses',
    'Take a typewriting course',
    'Take a business course',
    'Take a bookkeeping course',
    'Take a commercial maths course',
    'File letters, reports, records, etc',
    'Write business letters'
  ]
};

// ─── Section II: Competencies ───────────────────────────────────────────────────

const COMPETENCIES = {
  R: [
    'I have used woodworking tools such as a power saw, a lathe or a sander',
    'I know how to use a voltmeter',
    'I can change car oil or tyres',
    'I have operated tools such as a drill press or a grinder or a sewing machine',
    'I can refinish, varnish or stain furniture or woodwork',
    'I can read blueprints (building plans)',
    'I can make simple electrical repairs',
    'I can repair furniture',
    'I can do mechanical drawings',
    'I can do simple repairs to a TV set (or radio)',
    'I can do simple plumbing repairs'
  ],
  I: [
    'I can use algebra to solve mathematical problems',
    'I have participated in a scientific contest',
    'I understand the "half-life" of a radioactive element',
    'I understand logarithmic tables',
    'I can use a slide rule/calculator to multiply or divide.',
    'I can use a microscope',
    'I can program a computer to study a scientific problem',
    'I can describe the function of white blood cells',
    'I can interpret simple chemical formulas',
    'I understand why man-made satellites do not fall to the earth',
    'I can name three foods that are high in vitamins'
  ],
  A: [
    'I can play a musical instrument',
    'I can participate in two or four-part choral singing',
    'I can perform as a musical soloist',
    'I can act in a play',
    'I can do interpretive reading',
    'I can do interpretive or ballet dancing',
    'I can sketch people in such a way that they are recognizable',
    'I can do a painting or do a piece of sculpture',
    'I can do poetry',
    'I can design clothing, posters or furniture',
    'I can write stories or poetry well'
  ],
  S: [
    'I find it easy to talk to all kinds of people',
    'I am good at explaining things to others',
    'I am competent at entertaining people older than myself',
    'I can be a good host/hostess',
    'I can teach others easily',
    'I can plan entertainment for a party',
    'I have worked as a hospital helper or nurse',
    'I am good at helping people who are upset or troubled',
    'I can plan social events for the school or the church',
    'I am a good judge of personality',
    'People seek me out to tell me their troubles'
  ],
  E: [
    'I have won an award for work as a salesperson or leader',
    'I know how to be a successful leader',
    'I am a good debater',
    'I could manage a small business or service',
    'I have organized a club or group',
    'I have been elected to an office while in high school or after leaving',
    'I have acted as a spokesman for a group in presenting suggestions or complaints to a person in authority',
    'I can supervise the work of others',
    'I am ambitious',
    'I am good at getting people to do things my way',
    'I am a good salesperson'
  ],
  C: [
    'I can type 40 words a minute',
    'I can operate a duplicating or adding machine',
    'I can take shorthand',
    'I can file correspondence and other papers',
    'I have held an office job',
    'I can use a bookkeeping/accounting machine',
    'I can do a lot of paper work in a short time',
    'I can use a pocket calculator',
    'I can use simple data processing equipment such as a keypunch',
    'I can post credits and debits',
    'I can keep accurate records of payments or sales'
  ]
};

// ─── Section III: Occupations ───────────────────────────────────────────────────

const OCCUPATIONS = {
  R: [
    'Aeroplane Mechanic - Maintains aeroplanes',
    'Fish and wildlife specialist - studies natural animal resources',
    'Motor mechanic - maintains and repairs motor vehicles',
    'Carpenter/Joiner - does woodwork',
    'Power shovel operator - runs shovel and large building and road equipment',
    'Filling station worker - pumps fuel, changes/deposits oil in vehicles at filling stations',
    'Farmer - works on a farm where crops are grown or livestock is bred and raised',
    'Surveyor - measures distances for buildings and roads',
    'Construction inspector - inspects new buildings to see that they meet certain requirements',
    'Radio operator - sends and receives radio messages',
    'Long distance bus driver - transports people over long distances',
    'Engine driver - runs trains',
    'Tool designer - designs tools to do new jobs',
    'Electrician - maintains and repairs electric wires and machinery'
  ],
  I: [
    'Meteorologist - studies the weather',
    'Biologist - studies plants and animals',
    'Astronomer - studies the stars',
    'Medical laboratory technician - works in medical laboratory and provides information to the medical doctor.',
    'Anthropologist - studies the beliefs, the past and present behaviour and the physical characteristics of people',
    'Zoologist - studies animals',
    'Chemist - studies composition and characteristics of materials and the processes they undergo',
    'Research scientist - conducts scientific experiments',
    'Writer of scientific articles - writes articles on science for magazines, books or encyclopedias',
    'Editor of scientific journal - heads a magazine that publishes articles on science',
    'Geologist - studies the earth, rocks, mountains, volcanoes',
    'Botanist - studies plants',
    'Microbiologist - studies the growth and characteristics of microscopic organisms',
    'Physicist - studies the physical laws of nature (gravity, magnetism, motion)'
  ],
  A: [
    'Poet - writes poetry',
    'Symphony conductor - conducts musicians who play orchestra',
    'Musician - plays musical instruments or sings',
    'Writer - writes books, plays, poetry and newspaper articles.',
    'Actor/Actress - acts in a play',
    'Freelance writer - writes stories for magazines, newspapers on a part-time basis.',
    'Musical arranger - writes music for words someone has written',
    'Journalist - writes for a newspaper/magazine',
    'Commercial artist - promotes the sale of products by means of pictures, paintings and pieces of sculpture.',
    'Concert singer - sings on the stage',
    'Composer or lyricist - writes music or words to music',
    'Sculptor/sculptress - carves/moulds statues from marble, metal, clay or wood.',
    'Playwright - writes plays',
    'Cartoonist - draws comic strips or humorous drawings on sports and news events'
  ],
  S: [
    'Sociologist - examines the ways in which individuals in groups and groups themselves interact.',
    'High school teacher - teaches one or two subjects to pupils in standards 6 to 10.',
    'Playground director - organizes games for young people at a playground',
    'Speech therapist - helps people correct and solve their speech problems',
    'Marriage counsellor - helps husbands and wives who are not happy together',
    'School principal - head of a school',
    'Psychiatric nurse - someone who cares for psychiatric patients in a hospital',
    'Clinical psychologist - helps people who are unhappy with their lives',
    'Social science teacher - teaches for example, history and geography',
    'Director of a welfare agency - head of an organization that gives social support to families or individuals in distress',
    'Youth organizer - organizes activities and takes responsibility for young people',
    'Counselling psychologist - helps individuals to deal with the problems that occur in everyday life',
    'Social worker - helps people to cope satisfactorily in their family and community life',
    'Vocational counsellor - someone who helps others decide what kind of work they would like to do'
  ],
  E: [
    'Speculator - someone who takes risks with buying and selling to make money',
    'Buyer - purchases merchandise from manufacturers and wholesalers',
    'Advertising executive - does advertising for a business',
    'Manufacturers representative - a salesperson who sells a company\'s products',
    'Television producer - produces TV shows',
    'Hotel manager - manages a hotel',
    'Business executive - owner or manager of a business',
    'Restaurant manager - runs a restaurant, hires the waiters and waitresses, cashiers and cooks',
    'Advocate - conducts civil and criminal cases in various courts of law',
    'Salesperson - person who sells goods and services',
    'Real estate salesperson - sells houses and property',
    'Personnel manager - gives advice and sees to it that personnel policies are carried out',
    'Sports promoter - arranges and publicizes sports events',
    'Sales manager - ensures that goods and services are sold'
  ],
  C: [
    'Bookkeeper - Keeps track of how money is earned and spent in a business',
    'Business teacher - teaches business subjects at school, e.g. bookkeeping, commerce',
    'Data typist - uses a special typewriter to process information for immediate or future use.',
    'Chartered accountant - inspects the correctness and completeness of the financial states and books of organizations',
    'Credit controller - checks if clients have credit value',
    'Court stenographer - records everything on tape said during courtrooms',
    'Bank teller - receives and pays out money at a bank',
    'Tax expert - advises people on tax matters',
    'Inventory controller - takes stock of goods in a store or business at a certain time',
    'Typist - types letters, reports, etc. on a typewriter',
    'Financial analyst - works out if a person or business is spending money wisely',
    'Cost estimator - determines how much it will cost to do certain jobs.',
    'Payroll clerk - calculates how much money people should be paid for their jobs',
    'Bank inspector - checks on bank personnel to see if they carry out their work'
  ]
};

// ─── Section IV: Self-Rating (interleaved R,I,A,S,E,C × 2 rounds) ──────────────

const SELF_RATING = [
  { type: 'R', text: 'I rate my mechanical ability (fixing things, using tools and machines) as' },
  { type: 'I', text: 'I rate my scientific ability (biology, chemistry and problem solving) as' },
  { type: 'A', text: 'I rate my artistic ability (music, art and drama) as' },
  { type: 'S', text: 'I rate my teaching ability (helping others learn) as' },
  { type: 'E', text: 'I rate my sales ability (selling or managing) as' },
  { type: 'C', text: 'I rate my clerical ability (numbers, spelling and filing papers) as' },
  { type: 'R', text: 'I rate my manual skill as' },
  { type: 'I', text: 'I rate my mathematical ability as' },
  { type: 'A', text: 'I rate my musical ability as' },
  { type: 'S', text: 'I rate my friendliness as' },
  { type: 'E', text: 'I rate my managerial skills as' },
  { type: 'C', text: 'I rate my office skills as' }
];

/**
 * Build questions for Sections I–III (grouped by RIASEC type).
 * @param {string} section  DB section enum value
 * @param {Object} typeMap  { R: [...], I: [...], ... }
 * @param {number} startOrder  The questionOrder of the first question in this section
 */
function buildGroupedSection(section, typeMap, startOrder) {
  const rows = [];
  let order = startOrder;
  RIASEC.forEach(type => {
    typeMap[type].forEach(text => {
      rows.push({
        id: uuidv4(),
        text: text.trim(),
        section,
        riasec_type: type,
        question_code: `${type}${order}`,
        order,
        created_at: now,
        updated_at: now
      });
      order++;
    });
  });
  return rows;
}

/**
 * Build Section IV Self-Rating questions (interleaved order).
 * @param {number} startOrder  The questionOrder of the first self-rating question (217)
 */
function buildSelfRating(startOrder) {
  return SELF_RATING.map((q, idx) => ({
    id: uuidv4(),
    text: q.text.trim(),
    section: 'self_estimates',
    riasec_type: q.type,
    question_code: `SR${idx + 1}`,
    order: startOrder + idx,
    created_at: now,
    updated_at: now
  }));
}

module.exports = {
  async up(queryInterface) {
    // Clear any existing questions so we always seed the canonical set
    await queryInterface.bulkDelete('questions', null, {});

    const questions = [
      ...buildGroupedSection('activities',   ACTIVITIES,    1),   // orders 1–66
      ...buildGroupedSection('competencies', COMPETENCIES, 67),   // orders 67–132
      ...buildGroupedSection('occupations',  OCCUPATIONS, 133),   // orders 133–216
      ...buildSelfRating(217)                                     // orders 217–228
    ];

    await queryInterface.bulkInsert('questions', questions, {});
    console.log(`Inserted ${questions.length} SDS questions from master CSV.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('questions', null, {});
  }
};
