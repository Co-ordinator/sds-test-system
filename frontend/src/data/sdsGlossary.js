/**
 * SDS Glossary Dataset - Production Grade
 * 
 * Based on research-backed requirements for Self-Directed Search (SDS)
 * Covers 4 core domains: RIASEC, assessment structure, action words, occupations
 * 
 * Definitions follow the ≤10-12 word rule with examples where helpful
 */

export const SDS_GLOSSARY = {
  // === RIASEC PERSONALITY TERMS (Core Concepts) ===
  riasec: {
    realistic: {
      term: 'Realistic',
      definition: 'Hands-on work with tools, machines, or animals.',
      example: 'Building furniture, fixing cars, farming',
      category: 'riasec',
      section: 'personality',
      difficulty: 'low'
    },
    investigative: {
      term: 'Investigative',
      definition: 'Analytical, scientific thinking and research.',
      example: 'Lab research, data analysis, medical diagnosis',
      category: 'riasec',
      section: 'personality',
      difficulty: 'medium'
    },
    artistic: {
      term: 'Artistic',
      definition: 'Creative, expressive work in arts or design.',
      example: 'Painting, writing, graphic design, music',
      category: 'riasec',
      section: 'personality',
      difficulty: 'low'
    },
    social: {
      term: 'Social',
      definition: 'Helping, teaching, or serving people directly.',
      example: 'Teaching, nursing, counseling, social work',
      category: 'riasec',
      section: 'personality',
      difficulty: 'low'
    },
    enterprising: {
      term: 'Enterprising',
      definition: 'Business, leadership, persuasion, or sales.',
      example: 'Managing teams, selling products, starting businesses',
      category: 'riasec',
      section: 'personality',
      difficulty: 'medium'
    },
    conventional: {
      term: 'Conventional',
      definition: 'Organizing data, structured work with details.',
      example: 'Accounting, filing records, scheduling, data entry',
      category: 'riasec',
      section: 'personality',
      difficulty: 'medium'
    }
  },

  // === ASSESSMENT STRUCTURE TERMS ===
  structure: {
    activity: {
      term: 'Activity',
      definition: 'Something you enjoy doing or would like to do.',
      example: 'Playing sports, reading books, cooking',
      category: 'structure',
      section: 'assessment',
      difficulty: 'low'
    },
    competency: {
      term: 'Competency',
      definition: 'Something you are able to do or do well.',
      example: 'Speaking languages, fixing things, organizing',
      category: 'structure',
      section: 'assessment',
      difficulty: 'medium'
    },
    occupation: {
      term: 'Occupation',
      definition: 'A type of job, career, or profession.',
      example: 'Teacher, engineer, doctor, artist',
      category: 'structure',
      section: 'assessment',
      difficulty: 'low'
    },
    'self-rating': {
      term: 'Self-Rating',
      definition: 'How you judge your own ability compared to others.',
      example: 'Rating yourself 1-6 on math skills',
      category: 'structure',
      section: 'assessment',
      difficulty: 'medium'
    }
  },

  // === ACTION / ACTIVITY WORDS (High Impact) ===
  actions: {
    assemble: {
      term: 'Assemble',
      definition: 'Put parts together to make something complete.',
      example: 'Building IKEA furniture, model kits',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['construct', 'build', 'put together']
    },
    construct: {
      term: 'Construct',
      definition: 'Build or create something physical or abstract.',
      example: 'Constructing buildings, arguments, plans',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['build', 'assemble', 'create']
    },
    analyze: {
      term: 'Analyze',
      definition: 'Study something carefully to understand it better.',
      example: 'Analyzing data, problems, situations',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['examine', 'study', 'investigate']
    },
    design: {
      term: 'Design',
      definition: 'Plan or create something with specific purpose.',
      example: 'Designing clothes, websites, buildings',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['create', 'plan', 'develop']
    },
    repair: {
      term: 'Repair',
      definition: 'Fix something that is broken or damaged.',
      example: 'Repairing cars, appliances, electronics',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['fix', 'restore', 'mend']
    },
    operate: {
      term: 'Operate',
      definition: 'Control or run machines, equipment, or systems.',
      example: 'Operating computers, factory machinery',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['run', 'control', 'manage']
    },
    calculate: {
      term: 'Calculate',
      definition: 'Use mathematics to find answers or solve problems.',
      example: 'Calculating costs, measurements, statistics',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['compute', 'figure', 'determine']
    },
    investigate: {
      term: 'Investigate',
      definition: 'Examine or study something to discover facts.',
      example: 'Investigating crimes, scientific research',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['examine', 'research', 'explore']
    },
    persuade: {
      term: 'Persuade',
      definition: 'Convince someone to believe or do something.',
      example: 'Persuading customers, making arguments',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['convince', 'influence', 'encourage']
    },
    organize: {
      term: 'Organize',
      definition: 'Arrange things in order or plan systematically.',
      example: 'Organizing events, files, schedules',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['arrange', 'plan', 'coordinate']
    },
    diagnose: {
      term: 'Diagnose',
      definition: 'Identify problems or causes of issues.',
      example: 'Diagnosing illnesses, car problems',
      category: 'actions',
      section: 'activities',
      difficulty: 'high',
      related: ['identify', 'analyze', 'determine']
    },
    supervise: {
      term: 'Supervise',
      definition: 'Watch over and direct work or activities.',
      example: 'Supervising employees, projects, teams',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['manage', 'oversee', 'direct']
    },
    perform: {
      term: 'Perform',
      definition: 'Entertain or present before an audience.',
      example: 'Performing music, acting, public speaking',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['entertain', 'present', 'demonstrate']
    },
    experiment: {
      term: 'Experiment',
      definition: 'Try new methods or test scientific ideas.',
      example: 'Experimenting with recipes, scientific tests',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['test', 'try', 'explore']
    },
    negotiate: {
      term: 'Negotiate',
      definition: 'Discuss and reach agreements with others.',
      example: 'Negotiating contracts, prices, deals',
      category: 'actions',
      section: 'activities',
      difficulty: 'high',
      related: ['bargain', 'discuss', 'agree']
    },
    program: {
      term: 'Program',
      definition: 'Write code or create computer software.',
      example: 'Programming apps, websites, games',
      category: 'actions',
      section: 'activities',
      difficulty: 'high',
      related: ['code', 'develop', 'create software']
    },
    counsel: {
      term: 'Counsel',
      definition: 'Give advice or guidance to help others.',
      example: 'Counseling students, clients, patients',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['advise', 'guide', 'help']
    },
    illustrate: {
      term: 'Illustrate',
      definition: 'Create drawings or pictures to explain ideas.',
      example: 'Illustrating books, creating diagrams',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['draw', 'visualize', 'create images']
    },
    classify: {
      term: 'Classify',
      definition: 'Group things by type, category, or characteristics.',
      example: 'Classifying data, specimens, information',
      category: 'actions',
      section: 'activities',
      difficulty: 'medium',
      related: ['categorize', 'group', 'organize']
    },
    demonstrate: {
      term: 'Demonstrate',
      definition: 'Show how something works or is done.',
      example: 'Demonstrating products, teaching skills',
      category: 'actions',
      section: 'activities',
      difficulty: 'low',
      related: ['show', 'teach', 'present']
    }
  },

  // === OCCUPATION TERMS (Critical for Understanding) ===
  occupations: {
    actuary: {
      term: 'Actuary',
      definition: 'Uses math to assess financial risk and uncertainty.',
      example: 'Working for insurance companies, analyzing data',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['mathematics', 'statistics', 'risk analysis']
    },
    surveyor: {
      term: 'Surveyor',
      definition: 'Measures land, boundaries, and geographic features.',
      example: 'Measuring property lines, construction sites',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['measurement', 'land', 'mapping']
    },
    agronomist: {
      term: 'Agronomist',
      definition: 'Studies crops, soil, and agricultural science.',
      example: 'Improving farming methods, crop yields',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['agriculture', 'farming', 'soil science']
    },
    architect: {
      term: 'Architect',
      definition: 'Designs buildings and oversees construction.',
      example: 'Designing homes, offices, public buildings',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['design', 'building', 'construction']
    },
    pharmacist: {
      term: 'Pharmacist',
      definition: 'Prepares and dispenses medications to patients.',
      example: 'Working in hospitals, pharmacies, drug stores',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['medicine', 'healthcare', 'drugs']
    },
    psychologist: {
      term: 'Psychologist',
      definition: 'Studies human behavior and mental processes.',
      example: 'Therapy, research, counseling, assessment',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['mental health', 'behavior', 'therapy']
    },
    statistician: {
      term: 'Statistician',
      definition: 'Analyzes data to find patterns and insights.',
      example: 'Working with surveys, research data, analytics',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['data', 'mathematics', 'analysis']
    },
    electrician: {
      term: 'Electrician',
      definition: 'Installs and maintains electrical systems.',
      example: 'Wiring buildings, fixing electrical problems',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['electricity', 'wiring', 'maintenance']
    },
    mechanic: {
      term: 'Mechanic',
      definition: 'Repairs and maintains machines and vehicles.',
      example: 'Fixing cars, trucks, industrial equipment',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['repair', 'machines', 'vehicles']
    },
    accountant: {
      term: 'Accountant',
      definition: 'Manages financial records and prepares taxes.',
      example: 'Bookkeeping, tax preparation, financial reports',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['finance', 'numbers', 'bookkeeping']
    },
    veterinarian: {
      term: 'Veterinarian',
      definition: 'Treats injuries and illnesses in animals.',
      example: 'Pet healthcare, farm animals, wildlife',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['animals', 'medicine', 'healthcare']
    },
    geologist: {
      term: 'Geologist',
      definition: 'Studies Earth\'s materials and natural processes.',
      example: 'Analyzing rocks, minerals, earthquakes',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['earth science', 'rocks', 'minerals']
    },
    sociologist: {
      term: 'Sociologist',
      definition: 'Studies human society, social behavior, and groups.',
      example: 'Researching communities, social trends',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['society', 'social behavior', 'research']
    },
    economist: {
      term: 'Economist',
      definition: 'Studies production, distribution, and consumption.',
      example: 'Analyzing markets, economic trends, policy',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'high',
      related: ['economics', 'markets', 'finance']
    },
    physiotherapist: {
      term: 'Physiotherapist',
      definition: 'Helps patients recover movement and function.',
      example: 'Rehabilitation after injury, exercise therapy',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['healthcare', 'rehabilitation', 'therapy']
    },
    journalist: {
      term: 'Journalist',
      definition: 'Reports news and writes stories for media.',
      example: 'Newspapers, TV news, online publications',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['writing', 'news', 'media']
    },
    engineer: {
      term: 'Engineer',
      definition: 'Designs and builds machines, structures, systems.',
      example: 'Bridge design, software development, manufacturing',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'medium',
      related: ['design', 'building', 'technology']
    },
    teacher: {
      term: 'Teacher',
      definition: 'Educates students and helps them learn.',
      example: 'School teaching, tutoring, training',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['education', 'students', 'learning']
    },
    nurse: {
      term: 'Nurse',
      definition: 'Cares for patients and supports medical treatment.',
      example: 'Hospital care, patient monitoring, assistance',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['healthcare', 'patients', 'medicine']
    },
    chef: {
      term: 'Chef',
      definition: 'Plans and prepares food in restaurants.',
      example: 'Restaurant cooking, menu planning, catering',
      category: 'occupations',
      section: 'occupations',
      difficulty: 'low',
      related: ['cooking', 'food', 'restaurants']
    }
  }
};

// Helper functions for glossary management
export const glossaryUtils = {
  // Get all terms as flat array
  getAllTerms: () => {
    const allTerms = [];
    Object.values(SDS_GLOSSARY).forEach(category => {
      Object.values(category).forEach(term => {
        allTerms.push(term);
      });
    });
    return allTerms;
  },

  // Get terms by category
  getTermsByCategory: (category) => {
    return SDS_GLOSSARY[category] ? Object.values(SDS_GLOSSARY[category]) : [];
  },

  // Get terms by difficulty level
  getTermsByDifficulty: (difficulty) => {
    return glossaryUtils.getAllTerms().filter(term => term.difficulty === difficulty);
  },

  // Search terms by text
  searchTerms: (query) => {
    const allTerms = glossaryUtils.getAllTerms();
    const lowerQuery = query.toLowerCase();
    return allTerms.filter(term => 
      term.term.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery) ||
      (term.example && term.example.toLowerCase().includes(lowerQuery))
    );
  },

  // Get related terms
  getRelatedTerms: (termKey) => {
    const term = glossaryUtils.findTerm(termKey);
    if (!term || !term.related) return [];
    
    return term.related.map(relatedKey => glossaryUtils.findTerm(relatedKey)).filter(Boolean);
  },

  // Find term by key
  findTerm: (key) => {
    for (const category of Object.values(SDS_GLOSSARY)) {
      if (category[key]) return category[key];
    }
    return null;
  },

  // Get terms that should be highlighted based on difficulty
  getHighlightableTerms: () => {
    return glossaryUtils.getAllTerms().filter(term => 
      term.difficulty === 'medium' || term.difficulty === 'high'
    );
  }
};

export default SDS_GLOSSARY;
