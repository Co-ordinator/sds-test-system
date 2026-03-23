'use strict';

const { v4: uuidv4 } = require('uuid');

const terms = [
  // General assessment terms
  { term: 'Self-Directed Search', definition: 'A career interest assessment developed by John Holland that helps individuals explore careers aligned with their personality type.', section: 'general' },
  { term: 'RIASEC', definition: 'An acronym for the six personality types in Holland\'s theory: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.', section: 'general' },
  { term: 'Holland Code', definition: 'A three-letter code (e.g. SIA, RCE) derived from your top three RIASEC scores that represents your primary career interest profile.', section: 'general' },
  { term: 'Career Interest', definition: 'A pattern of likes and dislikes related to work activities and occupations that can guide career planning.', section: 'general' },
  { term: 'Personality Type', definition: 'A classification of your preferences, strengths, and work style based on Holland\'s six categories.', section: 'general' },
  { term: 'Questionnaire', definition: 'A set of structured questions used to gather information about your interests, abilities, and preferences. This is not a test — there are no right or wrong answers.', section: 'general' },
  { term: 'Eswatini Government Scholarship', definition: 'Official scholarship loan program administered by the Ministry of Labour and Social Security through the Scholarship Secretariat. Provides financial support for Eswatini nationals pursuing first degree and diploma courses at approved institutions. Must be repaid after graduation.', section: 'general', example: 'Students in priority areas like Education, Engineering, and Health Sciences can apply for the Eswatini Government Scholarship.' },
  { term: 'Career Guidance', definition: 'Professional support to help individuals understand their interests and make informed decisions about education and employment pathways.', section: 'general' },

  // Realistic (R)
  { term: 'Realistic', definition: 'People who enjoy hands-on, physical activities and working with tools, machines, plants, or animals. They prefer practical, concrete tasks.', section: 'general', example: 'Mechanics, farmers, electricians, engineers' },
  { term: 'Mechanical Ability', definition: 'The capacity to understand and work with machines, tools, and mechanical systems.', section: 'self_estimates', example: 'Repairing engines, assembling equipment, using power tools' },
  { term: 'Manual Dexterity', definition: 'Skill in using your hands to make or manipulate objects with precision and coordination.', section: 'self_estimates', example: 'Sewing, carpentry, soldering electronic components' },

  // Investigative (I)
  { term: 'Investigative', definition: 'People who enjoy researching, analysing, and solving complex problems. They prefer intellectual and scientific activities.', section: 'general', example: 'Scientists, researchers, doctors, programmers' },
  { term: 'Scientific Ability', definition: 'The capacity to observe, experiment, analyse data, and understand scientific concepts and processes.', section: 'self_estimates', example: 'Conducting experiments, analysing results, understanding formulas' },
  { term: 'Analytical Thinking', definition: 'The ability to break down complex problems into smaller parts and examine them systematically.', section: 'self_estimates' },

  // Artistic (A)
  { term: 'Artistic', definition: 'People who enjoy creative activities such as art, drama, music, or writing. They prefer self-expression and imagination.', section: 'general', example: 'Artists, musicians, writers, designers' },
  { term: 'Artistic Ability', definition: 'Talent in creating visual, musical, or literary works through imagination and creative expression.', section: 'self_estimates', example: 'Painting, sculpting, composing music, creative writing' },
  { term: 'Creativity', definition: 'The ability to think of new and original ideas, approaches, or solutions.', section: 'self_estimates' },

  // Social (S)
  { term: 'Social', definition: 'People who enjoy helping, teaching, counselling, or providing service to others. They prefer working with people rather than things.', section: 'general', example: 'Teachers, nurses, counsellors, social workers' },
  { term: 'Teaching Ability', definition: 'The capacity to explain concepts clearly and help others learn new skills or knowledge.', section: 'self_estimates', example: 'Tutoring classmates, leading group discussions, explaining homework' },
  { term: 'Interpersonal Skills', definition: 'The ability to communicate effectively, empathise, and build positive relationships with others.', section: 'self_estimates' },

  // Enterprising (E)
  { term: 'Enterprising', definition: 'People who enjoy leading, persuading, and managing others. They prefer competitive environments and business activities.', section: 'general', example: 'Business owners, managers, salespeople, politicians' },
  { term: 'Leadership Ability', definition: 'The capacity to motivate, direct, and guide others toward achieving goals.', section: 'self_estimates', example: 'Organising events, leading teams, making decisions for a group' },
  { term: 'Persuasion', definition: 'The ability to convince others to accept your ideas, buy products, or follow your lead.', section: 'self_estimates' },

  // Conventional (C)
  { term: 'Conventional', definition: 'People who enjoy organised, structured activities involving data, numbers, and systematic procedures. They prefer orderly and detail-oriented work.', section: 'general', example: 'Accountants, clerks, administrators, data analysts' },
  { term: 'Clerical Ability', definition: 'Skill in organising information, maintaining records, and performing office-related tasks accurately.', section: 'self_estimates', example: 'Filing, typing, bookkeeping, data entry' },
  { term: 'Attention to Detail', definition: 'The ability to notice and focus on small but important elements in tasks and information.', section: 'self_estimates' },

  // Activities section terms
  { term: 'Indifferent', definition: 'Having no particular interest or feeling about an activity — neither liking nor disliking it.', section: 'activities' },
  { term: 'Blueprint', definition: 'A detailed technical drawing or plan used in construction and engineering to show how something should be built.', section: 'activities' },
  { term: 'Workshop', definition: 'A room or building where things are made or repaired using tools and machinery.', section: 'activities' },
  { term: 'Laboratory', definition: 'A room equipped for scientific experiments, research, and testing.', section: 'activities' },
  { term: 'Sketch', definition: 'A quick, rough drawing that captures the main features of an object or idea.', section: 'activities' },
  { term: 'Volunteer', definition: 'To offer your time and services to help others without being paid.', section: 'activities' },
  { term: 'Campaign', definition: 'An organised effort to achieve a specific goal, such as raising awareness or winning an election.', section: 'activities' },
  { term: 'Budget', definition: 'A plan for how money will be spent over a specific period of time.', section: 'activities' },

  // Competencies section terms
  { term: 'Competency', definition: 'A skill or ability that you can perform well or have good knowledge of.', section: 'competencies' },
  { term: 'Competently', definition: 'Performing a task with skill, efficiency, and confidence.', section: 'competencies' },
  { term: 'Proficient', definition: 'Having a high level of skill or expertise in a particular area.', section: 'competencies' },
  { term: 'Technical Drawing', definition: 'Precise, scaled drawings that show how objects or structures should be built, following standard rules.', section: 'competencies' },
  { term: 'Calibrate', definition: 'To adjust or check the accuracy of a measuring instrument or equipment.', section: 'competencies' },
  { term: 'Hypothesis', definition: 'An educated guess or proposed explanation that can be tested through experimentation.', section: 'competencies' },
  { term: 'Ledger', definition: 'A book or system for recording financial transactions and accounts.', section: 'competencies' },

  // Occupations section terms
  { term: 'Occupation', definition: 'A job or profession — a type of work that a person does regularly to earn a living.', section: 'occupations' },
  { term: 'Surveyor', definition: 'A professional who measures and maps land, boundaries, and construction sites.', section: 'occupations' },
  { term: 'Meteorologist', definition: 'A scientist who studies weather patterns, climate, and atmospheric conditions.', section: 'occupations' },
  { term: 'Draughtsperson', definition: 'A person who prepares detailed technical drawings and plans for buildings or machinery.', section: 'occupations' },
  { term: 'Sociologist', definition: 'A professional who studies how societies are organised and how people interact in groups.', section: 'occupations' },
  { term: 'Actuary', definition: 'A specialist who uses mathematics and statistics to assess financial risk, especially in insurance.', section: 'occupations' },
  { term: 'Entrepreneur', definition: 'A person who starts and runs their own business, taking on financial risk in hope of profit.', section: 'occupations' },
  { term: 'Horticulturist', definition: 'A specialist in growing and managing gardens, fruits, vegetables, and ornamental plants.', section: 'occupations' },
  { term: 'Geologist', definition: 'A scientist who studies the Earth\'s structure, rocks, minerals, and natural processes.', section: 'occupations' },
  { term: 'Pharmacist', definition: 'A health professional who prepares and dispenses medications and advises patients on their use.', section: 'occupations' },

  // Self-estimates section terms
  { term: 'Self-Estimate', definition: 'Your honest assessment of how well you perform a particular ability or skill compared to other people your age.', section: 'self_estimates' },
  { term: 'Peer', definition: 'A person of the same age, social standing, or ability level as you.', section: 'self_estimates' },
  { term: 'Rating Scale', definition: 'A numbered scale (1 to 6) used to measure the level of an ability, where 1 is the lowest and 6 is the highest.', section: 'self_estimates' },
  { term: 'Spatial Ability', definition: 'The capacity to visualise and understand the arrangement of objects in three-dimensional space.', section: 'self_estimates', example: 'Reading maps, assembling furniture from diagrams, imagining rotated shapes' },
  { term: 'Mathematical Ability', definition: 'Skill in working with numbers, solving equations, and understanding mathematical concepts.', section: 'self_estimates' },
  { term: 'Musical Ability', definition: 'Talent in playing instruments, singing, composing, or appreciating musical patterns and rhythms.', section: 'self_estimates' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = terms.map(t => ({
      id: uuidv4(),
      term: t.term,
      definition: t.definition,
      section: t.section,
      example: t.example || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('glossary_terms', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('glossary_terms', null, {});
  },
};
