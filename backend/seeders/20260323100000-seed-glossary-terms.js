'use strict';

const { v4: uuidv4 } = require('uuid');

const terms = [
  // === RIASEC PERSONALITY TERMS (Core Concepts) ===
  { term: 'Realistic', definition: 'Hands-on work with tools, machines, or animals.', section: 'riasec', example: 'Building furniture, fixing cars, farming' },
  { term: 'Investigative', definition: 'Analytical, scientific thinking and research.', section: 'riasec', example: 'Lab research, data analysis, medical diagnosis' },
  { term: 'Artistic', definition: 'Creative, expressive work in arts or design.', section: 'riasec', example: 'Painting, writing, graphic design, music' },
  { term: 'Social', definition: 'Helping, teaching, or serving people directly.', section: 'riasec', example: 'Teaching, nursing, counseling, social work' },
  { term: 'Enterprising', definition: 'Business, leadership, persuasion, or sales.', section: 'riasec', example: 'Managing teams, selling products, starting businesses' },
  { term: 'Conventional', definition: 'Organizing data, structured work with details.', section: 'riasec', example: 'Accounting, filing records, scheduling, data entry' },

  // === ASSESSMENT STRUCTURE TERMS ===
  { term: 'Activity', definition: 'Something you enjoy doing or would like to do.', section: 'structure', example: 'Playing sports, reading books, cooking' },
  { term: 'Competency', definition: 'Something you are able to do or do well.', section: 'structure', example: 'Speaking languages, fixing things, organizing' },
  { term: 'Occupation', definition: 'A type of job, career, or profession.', section: 'structure', example: 'Teacher, engineer, doctor, artist' },
  { term: 'Self-Rating', definition: 'How you judge your own ability compared to others.', section: 'structure', example: 'Rating yourself 1-6 on math skills' },
  { term: 'Self-Directed Search', definition: 'A career interest assessment developed by John Holland that helps individuals explore careers aligned with their personality type.', section: 'structure' },
  { term: 'RIASEC', definition: 'An acronym for the six personality types in Holland\'s theory: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.', section: 'structure' },
  { term: 'Holland Code', definition: 'A three-letter code (e.g. SIA, RCE) derived from your top three RIASEC scores that represents your primary career interest profile.', section: 'structure' },
  { term: 'Questionnaire', definition: 'A set of structured questions used to gather information about your interests, abilities, and preferences. This is not a test — there are no right or wrong answers.', section: 'structure' },

  // === ACTION / ACTIVITY WORDS (High Impact) ===
  { term: 'Assemble', definition: 'Put parts together to make something complete.', section: 'actions', example: 'Building IKEA furniture, model kits' },
  { term: 'Construct', definition: 'Build or create something physical or abstract.', section: 'actions', example: 'Constructing buildings, arguments, plans' },
  { term: 'Analyze', definition: 'Study something carefully to understand it better.', section: 'actions', example: 'Analyzing data, problems, situations' },
  { term: 'Design', definition: 'Plan or create something with specific purpose.', section: 'actions', example: 'Designing clothes, websites, buildings' },
  { term: 'Repair', definition: 'Fix something that is broken or damaged.', section: 'actions', example: 'Repairing cars, appliances, electronics' },
  { term: 'Operate', definition: 'Control or run machines, equipment, or systems.', section: 'actions', example: 'Operating computers, factory machinery' },
  { term: 'Calculate', definition: 'Use mathematics to find answers or solve problems.', section: 'actions', example: 'Calculating costs, measurements, statistics' },
  { term: 'Investigate', definition: 'Examine or study something to discover facts.', section: 'actions', example: 'Investigating crimes, scientific research' },
  { term: 'Persuade', definition: 'Convince someone to believe or do something.', section: 'actions', example: 'Persuading customers, making arguments' },
  { term: 'Organize', definition: 'Arrange things in order or plan systematically.', section: 'actions', example: 'Organizing events, files, schedules' },
  { term: 'Diagnose', definition: 'Identify problems or causes of issues.', section: 'actions', example: 'Diagnosing illnesses, car problems' },
  { term: 'Supervise', definition: 'Watch over and direct work or activities.', section: 'actions', example: 'Supervising employees, projects, teams' },
  { term: 'Perform', definition: 'Entertain or present before an audience.', section: 'actions', example: 'Performing music, acting, public speaking' },
  { term: 'Experiment', definition: 'Try new methods or test scientific ideas.', section: 'actions', example: 'Experimenting with recipes, scientific tests' },
  { term: 'Negotiate', definition: 'Discuss and reach agreements with others.', section: 'actions', example: 'Negotiating contracts, prices, deals' },
  { term: 'Program', definition: 'Write code or create computer software.', section: 'actions', example: 'Programming apps, websites, games' },
  { term: 'Counsel', definition: 'Give advice or guidance to help others.', section: 'actions', example: 'Counseling students, clients, patients' },
  { term: 'Illustrate', definition: 'Create drawings or pictures to explain ideas.', section: 'actions', example: 'Illustrating books, creating diagrams' },
  { term: 'Classify', definition: 'Group things by type, category, or characteristics.', section: 'actions', example: 'Classifying data, specimens, information' },
  { term: 'Demonstrate', definition: 'Show how something works or is done.', section: 'actions', example: 'Demonstrating products, teaching skills' },

  // === OCCUPATION TERMS (Critical for Understanding) ===
  { term: 'Actuary', definition: 'Uses math to assess financial risk and uncertainty.', section: 'occupations', example: 'Working for insurance companies, analyzing data' },
  { term: 'Surveyor', definition: 'Measures land, boundaries, and geographic features.', section: 'occupations', example: 'Measuring property lines, construction sites' },
  { term: 'Agronomist', definition: 'Studies crops, soil, and agricultural science.', section: 'occupations', example: 'Improving farming methods, crop yields' },
  { term: 'Architect', definition: 'Designs buildings and oversees construction.', section: 'occupations', example: 'Designing homes, offices, public buildings' },
  { term: 'Pharmacist', definition: 'Prepares and dispenses medications to patients.', section: 'occupations', example: 'Working in hospitals, pharmacies, drug stores' },
  { term: 'Psychologist', definition: 'Studies human behavior and mental processes.', section: 'occupations', example: 'Therapy, research, counseling, assessment' },
  { term: 'Statistician', definition: 'Analyzes data to find patterns and insights.', section: 'occupations', example: 'Working with surveys, research data, analytics' },
  { term: 'Electrician', definition: 'Installs and maintains electrical systems.', section: 'occupations', example: 'Wiring buildings, fixing electrical problems' },
  { term: 'Mechanic', definition: 'Repairs and maintains machines and vehicles.', section: 'occupations', example: 'Fixing cars, trucks, industrial equipment' },
  { term: 'Accountant', definition: 'Manages financial records and prepares taxes.', section: 'occupations', example: 'Bookkeeping, tax preparation, financial reports' },
  { term: 'Veterinarian', definition: 'Treats injuries and illnesses in animals.', section: 'occupations', example: 'Pet healthcare, farm animals, wildlife' },
  { term: 'Geologist', definition: 'Studies Earth\'s materials and natural processes.', section: 'occupations', example: 'Analyzing rocks, minerals, earthquakes' },
  { term: 'Sociologist', definition: 'Studies human society, social behavior, and groups.', section: 'occupations', example: 'Researching communities, social trends' },
  { term: 'Economist', definition: 'Studies production, distribution, and consumption.', section: 'occupations', example: 'Analyzing markets, economic trends, policy' },
  { term: 'Physiotherapist', definition: 'Helps patients recover movement and function.', section: 'occupations', example: 'Rehabilitation after injury, exercise therapy' },
  { term: 'Journalist', definition: 'Reports news and writes stories for media.', section: 'occupations', example: 'Newspapers, TV news, online publications' },
  { term: 'Engineer', definition: 'Designs and builds machines, structures, systems.', section: 'occupations', example: 'Bridge design, software development, manufacturing' },
  { term: 'Teacher', definition: 'Educates students and helps them learn.', section: 'occupations', example: 'School teaching, tutoring, training' },
  { term: 'Nurse', definition: 'Cares for patients and supports medical treatment.', section: 'occupations', example: 'Hospital care, patient monitoring, assistance' },
  { term: 'Chef', definition: 'Plans and prepares food in restaurants.', section: 'occupations', example: 'Restaurant cooking, menu planning, catering' },

  // === ADDITIONAL SDS-SPECIFIC TERMS ===
  { term: 'Career Interest', definition: 'A pattern of likes and dislikes related to work activities and occupations that can guide career planning.', section: 'general' },
  { term: 'Personality Type', definition: 'A classification of your preferences, strengths, and work style based on Holland\'s six categories.', section: 'general' },
  { term: 'Career Guidance', definition: 'Professional support to help individuals understand their interests and make informed decisions about education and employment pathways.', section: 'general' },
  { term: 'Eswatini Government Scholarship', definition: 'Official scholarship loan program administered by the Ministry of Labour and Social Security through the Scholarship Secretariat. Provides financial support for Eswatini nationals pursuing first degree and diploma courses at approved institutions. Must be repaid after graduation.', section: 'general', example: 'Students in priority areas like Education, Engineering, and Health Sciences can apply for the Eswatini Government Scholarship.' },
  { term: 'Indifferent', definition: 'Having no particular interest or feeling about an activity — neither liking nor disliking it.', section: 'activities' },
  { term: 'Blueprint', definition: 'A detailed technical drawing or plan used in construction and engineering to show how something should be built.', section: 'activities' },
  { term: 'Workshop', definition: 'A room or building where things are made or repaired using tools and machinery.', section: 'activities' },
  { term: 'Laboratory', definition: 'A room equipped for scientific experiments, research, and testing.', section: 'activities' },
  { term: 'Sketch', definition: 'A quick, rough drawing that captures the main features of an object or idea.', section: 'activities' },
  { term: 'Volunteer', definition: 'To offer your time and services to help others without being paid.', section: 'activities' },
  { term: 'Campaign', definition: 'An organised effort to achieve a specific goal, such as raising awareness or winning an election.', section: 'activities' },
  { term: 'Budget', definition: 'A plan for how money will be spent over a specific period of time.', section: 'activities' },
  { term: 'Competently', definition: 'Performing a task with skill, efficiency, and confidence.', section: 'competencies' },
  { term: 'Proficient', definition: 'Having a high level of skill or expertise in a particular area.', section: 'competencies' },
  { term: 'Technical Drawing', definition: 'Precise, scaled drawings that show how objects or structures should be built, following standard rules.', section: 'competencies' },
  { term: 'Calibrate', definition: 'To adjust or check the accuracy of a measuring instrument or equipment.', section: 'competencies' },
  { term: 'Hypothesis', definition: 'An educated guess or proposed explanation that can be tested through experimentation.', section: 'competencies' },
  { term: 'Ledger', definition: 'A book or system for recording financial transactions and accounts.', section: 'competencies' },
  { term: 'Self-Estimate', definition: 'Your honest assessment of how well you perform a particular ability or skill compared to other people your age.', section: 'self_estimates' },
  { term: 'Peer', definition: 'A person of the same age, social standing, or ability level as you.', section: 'self_estimates' },
  { term: 'Rating Scale', definition: 'A numbered scale (1 to 6) used to measure the level of an ability, where 1 is the lowest and 6 is the highest.', section: 'self_estimates' },
  { term: 'Mechanical Ability', definition: 'The capacity to understand and work with machines, tools, and mechanical systems.', section: 'self_estimates', example: 'Repairing engines, assembling equipment, using power tools' },
  { term: 'Manual Dexterity', definition: 'Skill in using your hands to make or manipulate objects with precision and coordination.', section: 'self_estimates', example: 'Sewing, carpentry, soldering electronic components' },
  { term: 'Scientific Ability', definition: 'The capacity to observe, experiment, analyse data, and understand scientific concepts and processes.', section: 'self_estimates', example: 'Conducting experiments, analysing results, understanding formulas' },
  { term: 'Analytical Thinking', definition: 'The ability to break down complex problems into smaller parts and examine them systematically.', section: 'self_estimates' },
  { term: 'Artistic Ability', definition: 'Talent in creating visual, musical, or literary works through imagination and creative expression.', section: 'self_estimates', example: 'Painting, sculpting, composing music, creative writing' },
  { term: 'Creativity', definition: 'The ability to think of new and original ideas, approaches, or solutions.', section: 'self_estimates' },
  { term: 'Teaching Ability', definition: 'The capacity to explain concepts clearly and help others learn new skills or knowledge.', section: 'self_estimates', example: 'Tutoring classmates, leading group discussions, explaining homework' },
  { term: 'Interpersonal Skills', definition: 'The ability to communicate effectively, empathise, and build positive relationships with others.', section: 'self_estimates' },
  { term: 'Leadership Ability', definition: 'The capacity to motivate, direct, and guide others toward achieving goals.', section: 'self_estimates', example: 'Organising events, leading teams, making decisions for a group' },
  { term: 'Persuasion', definition: 'The ability to convince others to accept your ideas, buy products, or follow your lead.', section: 'self_estimates' },
  { term: 'Clerical Ability', definition: 'Skill in organising information, maintaining records, and performing office-related tasks accurately.', section: 'self_estimates', example: 'Filing, typing, bookkeeping, data entry' },
  { term: 'Attention to Detail', definition: 'The ability to notice and focus on small but important elements in tasks and information.', section: 'self_estimates' },
  { term: 'Spatial Ability', definition: 'The capacity to visualise and understand the arrangement of objects in three-dimensional space.', section: 'self_estimates', example: 'Reading maps, assembling furniture from diagrams, imagining rotated shapes' },
  { term: 'Mathematical Ability', definition: 'Skill in working with numbers, solving equations, and understanding mathematical concepts.', section: 'self_estimates' },
  { term: 'Musical Ability', definition: 'Talent in playing instruments, singing, composing, or appreciating musical patterns and rhythms.', section: 'self_estimates' },
  { term: 'Meteorologist', definition: 'A scientist who studies weather patterns, climate, and atmospheric conditions.', section: 'occupations' },
  { term: 'Draughtsperson', definition: 'A person who prepares detailed technical drawings and plans for buildings or machinery.', section: 'occupations' },
  { term: 'Entrepreneur', definition: 'A person who starts and runs their own business, taking on financial risk in hope of profit.', section: 'occupations' },
  { term: 'Horticulturist', definition: 'A specialist in growing and managing gardens, fruits, vegetables, and ornamental plants.', section: 'occupations' },
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
