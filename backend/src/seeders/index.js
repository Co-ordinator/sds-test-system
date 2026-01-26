// backend/src/seeders/index.js
const { seedCompleteSdsTest } = require('./completeSdsData');
const { seedOccupationsData } = require('./occupationsData');
const { User } = require('../models');
const { Institution } = require('../models');

const seedEswatiniInstitutions = async () => {
  console.log('🌱 Seeding Eswatini institutions...');
  
  const institutions = [
    {
      name: 'University of Eswatini',
      nameSwati: 'Inyuvesi yase-Eswatini',
      acronym: 'UNESWA',
      type: 'university',
      description: 'The national university of Eswatini offering undergraduate and postgraduate programs',
      descriptionSwati: 'Inyuvesi yesinkhundla lesiphetfulu yase-Eswatini',
      region: 'multiple',
      phoneNumber: '+268 2517 0000',
      email: 'info@uneswa.ac.sz',
      website: 'https://www.uneswa.ac.sz',
      accredited: true,
      bursariesAvailable: true,
      programs: [
        {
          name: 'Bachelor of Science in Computer Science',
          duration: '4 years',
          entryRequirements: 'SGCSE with Mathematics and Science',
          riasecAlignment: ['I', 'R']
        },
        {
          name: 'Bachelor of Education',
          duration: '4 years',
          entryRequirements: 'SGCSE',
          riasecAlignment: ['S', 'A']
        },
        {
          name: 'Bachelor of Commerce',
          duration: '4 years',
          entryRequirements: 'SGCSE with Mathematics',
          riasecAlignment: ['E', 'C']
        }
      ],
      facilities: ['Library', 'Computer Labs', 'Sports Complex', 'Accommodation', 'Health Services']
    },
    {
      name: 'Eswatini College of Technology',
      nameSwati: 'Kolishi Yetemnotfo yase-Eswatini',
      acronym: 'ECOT',
      type: 'college',
      description: 'Leading technical and vocational education institution',
      region: 'hhohho',
      phoneNumber: '+268 2404 2681',
      website: 'https://www.ecot.ac.sz',
      accredited: true,
      bursariesAvailable: true,
      programs: [
        {
          name: 'National Diploma in Electrical Engineering',
          duration: '3 years',
          riasecAlignment: ['R', 'I']
        },
        {
          name: 'National Diploma in Business Management',
          duration: '3 years',
          riasecAlignment: ['E', 'C']
        }
      ],
      facilities: ['Workshops', 'Computer Labs', 'Library', 'Sports Facilities']
    },
    {
      name: 'Gwamile Vocational and Commercial Training Institute',
      nameSwati: 'Inhlathulo Yekufundziswa Kwemisebenzi ne-Commercial ye-Gwamile',
      acronym: 'GVTI',
      type: 'tvet',
      description: 'Vocational and commercial skills training institute',
      region: 'shiselweni',
      accredited: true,
      bursariesAvailable: true,
      programs: [
        {
          name: 'Certificate in Carpentry and Joinery',
          duration: '2 years',
          riasecAlignment: ['R']
        },
        {
          name: 'Certificate in Office Administration',
          duration: '2 years',
          riasecAlignment: ['C', 'S']
        }
      ]
    },
    {
      name: 'Southern African Nazarene University',
      acronym: 'SANU',
      type: 'university',
      description: 'Private Christian university',
      region: 'manzini',
      website: 'https://www.sanu.ac.sz',
      accredited: true,
      bursariesAvailable: true
    },
    {
      name: 'Limkokwing University of Creative Technology',
      acronym: 'LUCT',
      type: 'university',
      description: 'University focusing on creative and technology programs',
      region: 'manzini',
      accredited: true,
      bursariesAvailable: false
    }
  ];

  const created = await Institution.bulkCreate(institutions);
  console.log(`✅ Created ${created.length} institutions`);
  return created;
};

const seedAdminUser = async () => {
  console.log('🌱 Creating admin user...');
  
  const admin = await User.create({
    email: 'admin@labor.gov.sz',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Administrator',
    nationalId: 'ADMIN123',
    dateOfBirth: '1980-01-01',
    gender: 'male',
    phoneNumber: '+26876000000',
    role: 'admin',
    region: 'manzini',
    district: 'Manzini',
    address: 'Ministry of Labour Headquarters',
    educationLevel: 'postgraduate',
    currentInstitution: 'Ministry of Labour',
    employmentStatus: 'employed',
    currentOccupation: 'System Administrator',
    isActive: true,
    isEmailVerified: true,
    preferredLanguage: 'en',
    requiresAccessibility: false,
    accessibilityNeeds: {},
    lastLogin: new Date()
  });

  console.log('✅ Admin user created');
  console.log('📧 Email: admin@labor.gov.sz');
  console.log('🔑 Password: Admin@123');
  console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
  
  return admin;
};

const seedTestCounselor = async () => {
  console.log('🌱 Creating test counselor...');
  
  const counselor = await User.create({
    email: 'counselor@labor.gov.sz',
    password: 'Counselor@123',
    firstName: 'Test',
    lastName: 'Counselor',
    nationalId: 'COUNS123',
    dateOfBirth: '1985-05-15',
    gender: 'female',
    phoneNumber: '+26876111111',
    role: 'counselor',
    region: 'manzini',
    district: 'Manzini',
    address: 'Ministry of Labour Headquarters',
    organization: 'Ministry of Labour and Social Security',
    counselorCode: 'COUNS001',
    educationLevel: 'degree',
    currentInstitution: 'Ministry of Labour',
    employmentStatus: 'employed',
    currentOccupation: 'Career Counselor',
    isActive: true,
    isEmailVerified: true,
    preferredLanguage: 'en',
    requiresAccessibility: false,
    accessibilityNeeds: {}
  });

  console.log('✅ Test counselor created');
  console.log('📧 Email: counselor@labor.gov.sz');
  console.log('🔑 Password: Counselor@123');
  
  return counselor;
};

const seedTestStudent = async () => {
  console.log('🌱 Creating test student user...');
  
  const student = await User.create({
    email: 'student@test.sz',
    password: 'Student@123',
    firstName: 'Test',
    lastName: 'Student',
    nationalId: 'STUD123',
    dateOfBirth: '2005-03-20',
    gender: 'other',
    phoneNumber: '+26876222222',
    role: 'user',
    region: 'manzini',
    district: 'Manzini',
    address: '123 Test Street',
    educationLevel: 'senior_secondary',
    gradeLevel: 'Form 5',
    currentInstitution: 'Test High School',
    employmentStatus: 'student',
    isActive: true,
    isEmailVerified: true,
    preferredLanguage: 'en',
    requiresAccessibility: true,
    accessibilityNeeds: { screenReader: true, fontSize: 'large' }
  });

  console.log('✅ Test student created');
  console.log('📧 Email: student@test.sz');
  console.log('🔑 Password: Student@123');
  
  return student;
};

// Main seeder function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting complete database seeding...\n');
    
    // 1. Seed complete SDS test with all questions
    const test = await seedCompleteSdsTest();
    console.log('');
    
    // 2. Seed occupations
    await seedOccupationsData();
    console.log('');
    
    // 3. Seed institutions
    await seedEswatiniInstitutions();
    console.log('');
    
    // 4. Seed test users
    await seedAdminUser();
    console.log('');
    await seedTestCounselor();
    console.log('');
    await seedTestStudent();
    console.log('');
    
    console.log('✨ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log('- SDS Test: 228 questions across 4 sections');
    console.log('- Occupations: 35+ career options');
    console.log('- Institutions: 5 Eswatini educational institutions');
    console.log('- Test Users: Admin, Counselor, Student');
    console.log('\n🚀 You can now start the development server!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

module.exports = {
  seedDatabase,
  seedCompleteSdsTest,
  seedOccupationsData,
  seedEswatiniInstitutions,
  seedAdminUser
};