// backend/src/seeders/occupationsData.js
const { Occupation } = require('../models');

// Seed Occupations based on Ministry of Labour Career Interest Books
const seedOccupationsData = async () => {
  try {
    console.log('🌱 Seeding occupations from Ministry of Labour data...');
    
    const occupations = [
      // REALISTIC OCCUPATIONS (R)
      {
        name: 'Aeroplane Mechanic',
        hollandCodes: ['RIE', 'RIS'],
        primaryRiasec: 'R',
        secondaryRiasec: 'I',
        description: 'Maintains and repairs aeroplanes',
        category: 'Technical/Mechanical',
        educationRequired: 'tvet',
        demandLevel: 'medium',
        availableInEswatini: false,
        localDemand: 'low'
      },
      {
        name: 'Motor Mechanic',
        hollandCodes: ['RIS', 'RIE'],
        primaryRiasec: 'R',
        secondaryRiasec: 'I',
        description: 'Maintains and repairs motor vehicles',
        category: 'Technical/Mechanical',
        educationRequired: 'tvet',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'high',
        skills: ['Vehicle repair', 'Diagnostics', 'Tool usage']
      },
      {
        name: 'Carpenter/Joiner',
        hollandCodes: ['RIS', 'RCS'],
        primaryRiasec: 'R',
        secondaryRiasec: 'I',
        description: 'Does woodwork, builds and repairs wooden structures',
        category: 'Skilled Trades',
        educationRequired: 'tvet',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Electrician',
        hollandCodes: ['RIE', 'RIS'],
        primaryRiasec: 'R',
        secondaryRiasec: 'I',
        description: 'Maintains and repairs electric wires and machinery',
        category: 'Technical/Mechanical',
        educationRequired: 'tvet',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'critical'
      },
      {
        name: 'Farmer',
        hollandCodes: ['RIS', 'RES'],
        primaryRiasec: 'R',
        secondaryRiasec: 'I',
        description: 'Works on a farm where crops are grown or livestock is bred and raised',
        category: 'Agriculture',
        educationRequired: 'none',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Plumber',
        hollandCodes: ['RCI', 'RIS'],
        primaryRiasec: 'R',
        secondaryRiasec: 'C',
        description: 'Installs and repairs water supply and drainage systems',
        category: 'Skilled Trades',
        educationRequired: 'tvet',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Welder',
        hollandCodes: ['RCI', 'RIS'],
        primaryRiasec: 'R',
        secondaryRiasec: 'C',
        description: 'Joins metal parts using heat and specialized equipment',
        category: 'Skilled Trades',
        educationRequired: 'tvet',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },

      // INVESTIGATIVE OCCUPATIONS (I)
      {
        name: 'Medical Laboratory Technician',
        hollandCodes: ['IRS', 'IRC'],
        primaryRiasec: 'I',
        secondaryRiasec: 'R',
        description: 'Works in a medical laboratory and provides information to medical doctors',
        category: 'Healthcare/Science',
        educationRequired: 'diploma',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Biologist',
        hollandCodes: ['IRS', 'IRE'],
        primaryRiasec: 'I',
        secondaryRiasec: 'R',
        description: 'Studies plants and animals',
        category: 'Science',
        educationRequired: 'degree',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Chemist',
        hollandCodes: ['IRE', 'IRS'],
        primaryRiasec: 'I',
        secondaryRiasec: 'R',
        description: 'Studies composition and characteristics of materials and processes',
        category: 'Science',
        educationRequired: 'degree',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Medical Doctor',
        hollandCodes: ['ISE', 'ISR'],
        primaryRiasec: 'I',
        secondaryRiasec: 'S',
        description: 'Diagnoses and treats illnesses and injuries',
        category: 'Healthcare',
        educationRequired: 'postgraduate',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'critical'
      },
      {
        name: 'Pharmacist',
        hollandCodes: ['ICS', 'ICE'],
        primaryRiasec: 'I',
        secondaryRiasec: 'C',
        description: 'Prepares and dispenses medications',
        category: 'Healthcare',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },

      // ARTISTIC OCCUPATIONS (A)
      {
        name: 'Musician',
        hollandCodes: ['ASE', 'AES'],
        primaryRiasec: 'A',
        secondaryRiasec: 'S',
        description: 'Plays musical instruments or sings',
        category: 'Arts & Entertainment',
        educationRequired: 'diploma',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Journalist',
        hollandCodes: ['ASE', 'AES'],
        primaryRiasec: 'A',
        secondaryRiasec: 'S',
        description: 'Writes for newspapers and magazines',
        category: 'Media & Communications',
        educationRequired: 'degree',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Graphic Designer',
        hollandCodes: ['AES', 'ARE'],
        primaryRiasec: 'A',
        secondaryRiasec: 'E',
        description: 'Creates visual concepts using computer software or by hand',
        category: 'Design',
        educationRequired: 'diploma',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Fashion Designer',
        hollandCodes: ['AES', 'ARE'],
        primaryRiasec: 'A',
        secondaryRiasec: 'E',
        description: 'Designs clothing and accessories',
        category: 'Design',
        educationRequired: 'tvet',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Architect',
        hollandCodes: ['AIR', 'ARI'],
        primaryRiasec: 'A',
        secondaryRiasec: 'I',
        description: 'Designs buildings and structures',
        category: 'Design/Engineering',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'medium'
      },

      // SOCIAL OCCUPATIONS (S)
      {
        name: 'Teacher (High School)',
        hollandCodes: ['SAE', 'SEA', 'SCA'],
        primaryRiasec: 'S',
        secondaryRiasec: 'A',
        description: 'Teaches one or two subjects to pupils in secondary school',
        category: 'Education',
        educationRequired: 'degree',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'critical'
      },
      {
        name: 'Nurse',
        hollandCodes: ['SAI', 'SIA', 'SAC'],
        primaryRiasec: 'S',
        secondaryRiasec: 'A',
        description: 'Provides healthcare and medical assistance to patients',
        category: 'Healthcare',
        educationRequired: 'diploma',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'critical'
      },
      {
        name: 'Social Worker',
        hollandCodes: ['SAE', 'SEA'],
        primaryRiasec: 'S',
        secondaryRiasec: 'A',
        description: 'Helps people cope satisfactorily in their family and community life',
        category: 'Social Services',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Counselling Psychologist',
        hollandCodes: ['SIA', 'SIE'],
        primaryRiasec: 'S',
        secondaryRiasec: 'I',
        description: 'Helps individuals deal with problems that occur in everyday life',
        category: 'Healthcare/Social Services',
        educationRequired: 'postgraduate',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'School Principal',
        hollandCodes: ['SEA', 'SEC'],
        primaryRiasec: 'S',
        secondaryRiasec: 'E',
        description: 'Head of a school, manages educational operations',
        category: 'Education/Management',
        educationRequired: 'postgraduate',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },

      // ENTERPRISING OCCUPATIONS (E)
      {
        name: 'Business Executive',
        hollandCodes: ['ESC', 'ECS', 'ESI'],
        primaryRiasec: 'E',
        secondaryRiasec: 'S',
        description: 'Owner or manager of a business',
        category: 'Business & Management',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Sales Manager',
        hollandCodes: ['ESC', 'ECS'],
        primaryRiasec: 'E',
        secondaryRiasec: 'S',
        description: 'Ensures that goods and services are sold',
        category: 'Sales & Marketing',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Hotel Manager',
        hollandCodes: ['ESI', 'ESC'],
        primaryRiasec: 'E',
        secondaryRiasec: 'S',
        description: 'Manages hotel operations',
        category: 'Hospitality',
        educationRequired: 'diploma',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Marketing Manager',
        hollandCodes: ['ESC', 'EAS'],
        primaryRiasec: 'E',
        secondaryRiasec: 'S',
        description: 'Plans and coordinates marketing campaigns',
        category: 'Marketing',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Advocate/Lawyer',
        hollandCodes: ['EIS', 'ESI'],
        primaryRiasec: 'E',
        secondaryRiasec: 'I',
        description: 'Conducts civil and criminal cases in various courts of law',
        category: 'Legal',
        educationRequired: 'postgraduate',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },

      // CONVENTIONAL OCCUPATIONS (C)
      {
        name: 'Accountant',
        hollandCodes: ['CSE', 'CES', 'CSI'],
        primaryRiasec: 'C',
        secondaryRiasec: 'S',
        description: 'Keeps track of how money is earned and spent in a business',
        category: 'Business & Finance',
        educationRequired: 'degree',
        demandLevel: 'very_high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Bank Teller',
        hollandCodes: ['CSE', 'CES'],
        primaryRiasec: 'C',
        secondaryRiasec: 'S',
        description: 'Receives and pays out money at a bank',
        category: 'Finance',
        educationRequired: 'secondary',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Secretary',
        hollandCodes: ['CSE', 'CES'],
        primaryRiasec: 'C',
        secondaryRiasec: 'S',
        description: 'Performs administrative and clerical duties',
        category: 'Administration',
        educationRequired: 'secondary',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'high'
      },
      {
        name: 'Data Typist',
        hollandCodes: ['CRS', 'CSR'],
        primaryRiasec: 'C',
        secondaryRiasec: 'R',
        description: 'Uses special equipment to process information',
        category: 'Administration',
        educationRequired: 'tvet',
        demandLevel: 'medium',
        availableInEswatini: true,
        localDemand: 'medium'
      },
      {
        name: 'Financial Analyst',
        hollandCodes: ['CSI', 'CIS'],
        primaryRiasec: 'C',
        secondaryRiasec: 'S',
        description: 'Works out if a person or business is spending money wisely',
        category: 'Finance',
        educationRequired: 'degree',
        demandLevel: 'high',
        availableInEswatini: true,
        localDemand: 'medium'
      }
    ];

    const createdOccupations = await Occupation.bulkCreate(occupations);
    
    console.log(`✅ Created ${createdOccupations.length} occupations from Ministry of Labour data`);
    
    return createdOccupations;
    
  } catch (error) {
    console.error('❌ Error seeding occupations:', error);
    throw error;
  }
};

module.exports = {
  seedOccupationsData
};