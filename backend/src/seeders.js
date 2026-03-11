const {
  EducationLevel,
  Institution,
  User,
  Question,
  Occupation
} = require('./models');

const EDUCATION_LEVELS = [
  { level: 1, description: 'Lower than matric' },
  { level: 2, description: 'High school education (matric)' },
  { level: 3, description: 'Training at college/technical college/on-the-job-training' },
  { level: 4, description: "Training at teachers' college/technikon/university" },
  { level: 5, description: 'Postgraduate degree/university training plus experience' }
];

const INSTITUTIONS = [
  { name: 'University of Eswatini', acronym: 'UNESWA', type: 'university', region: 'hhohho', district: 'Kwaluseni', accredited: true },
  { name: 'Eswatini College of Technology', acronym: 'ECOT', type: 'college', region: 'manzini', district: 'Matsapha', accredited: true },
  { name: 'Ngwane Teacher Training College', acronym: 'NTTC', type: 'college', region: 'hhohho', district: 'Mbabane', accredited: true },
  { name: 'Gwamile Vocational and Commercial Training Institute', acronym: 'GOVTI', type: 'vocational', region: 'hhohho', district: 'Matsapha', accredited: true },
  { name: 'Southern Africa Nazarene University', acronym: 'SANU', type: 'university', region: 'manzini', district: 'Manzini', accredited: true }
];

const TEST_USERS = [
  {
    email: 'admin@labor.gov.sz',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin'
  },
  {
    email: 'counselor@labor.gov.sz',
    password: 'Counselor@123',
    firstName: 'Career',
    lastName: 'Counselor',
    role: 'counselor'
  },
  {
    email: 'student@test.sz',
    password: 'Student@123',
    firstName: 'Demo',
    lastName: 'Student',
    role: 'user'
  }
];

const OCCUPATIONS = [
  { code: 'RIA', name: 'Mechanical Technician', primaryRiasec: 'R' },
  { code: 'RIC', name: 'Laboratory Assistant', primaryRiasec: 'I' },
  { code: 'ASI', name: 'Graphic Designer', primaryRiasec: 'A' },
  { code: 'SEC', name: 'Social Worker', primaryRiasec: 'S' },
  { code: 'ESA', name: 'Sales Manager', primaryRiasec: 'E' },
  { code: 'CER', name: 'Accounting Clerk', primaryRiasec: 'C' }
];

const QUESTION_SECTIONS = [
  { section: 'activities', count: 66, prefix: 'I enjoy this activity' },
  { section: 'competencies', count: 66, prefix: 'I can perform this task well' },
  { section: 'occupations', count: 84, prefix: 'I am interested in this occupation' },
  { section: 'self_estimates', count: 12, prefix: 'I rate my ability in this area' }
];

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];

const buildQuestionBank = () => {
  const questions = [];

  QUESTION_SECTIONS.forEach(({ section, count, prefix }) => {
    for (let i = 1; i <= count; i += 1) {
      questions.push({
        text: `${prefix} ${i}`,
        section,
        riasecType: RIASEC[(i - 1) % RIASEC.length],
        order: i
      });
    }
  });

  return questions;
};

const seedEducationLevels = async () => {
  for (const level of EDUCATION_LEVELS) {
    const [record] = await EducationLevel.findOrCreate({
      where: { level: level.level },
      defaults: level
    });

    if (record.description !== level.description) {
      await record.update({ description: level.description });
    }
  }

  return EducationLevel.findAll();
};

const seedInstitutions = async () => {
  for (const institution of INSTITUTIONS) {
    const [record] = await Institution.findOrCreate({
      where: { name: institution.name },
      defaults: institution
    });

    await record.update({
      acronym: institution.acronym,
      type: institution.type,
      region: institution.region,
      district: institution.district,
      accredited: institution.accredited
    });
  }
};

const seedUsers = async (educationLevels) => {
  const defaultEducation = educationLevels.find((item) => item.level === 2) || null;

  for (const user of TEST_USERS) {
    const existing = await User.findOne({ where: { email: user.email } });
    if (!existing) {
      await User.create({
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isConsentGiven: true,
        consentDate: new Date(),
        isEmailVerified: true,
        educationLevel: defaultEducation ? defaultEducation.id : null
      });
    }
  }
};

const seedQuestions = async () => {
  const questionCount = await Question.count();
  if (questionCount >= 228) {
    return;
  }

  await Question.destroy({ where: {} });
  await Question.bulkCreate(buildQuestionBank());
};

const seedOccupations = async (educationLevels) => {
  const defaultEducation = educationLevels.find((item) => item.level === 2) || null;

  for (const occupation of OCCUPATIONS) {
    const [record] = await Occupation.findOrCreate({
      where: { code: occupation.code },
      defaults: {
        ...occupation,
        educationLevel: defaultEducation ? defaultEducation.id : null,
        availableInEswatini: true,
        localDemand: 'high',
        demandLevel: 'high',
        category: 'Career Recommendation'
      }
    });

    await record.update({
      name: occupation.name,
      primaryRiasec: occupation.primaryRiasec,
      educationLevel: defaultEducation ? defaultEducation.id : null,
      availableInEswatini: true,
      localDemand: 'high',
      demandLevel: 'high',
      category: 'Career Recommendation'
    });
  }
};

const seedDatabase = async () => {
  const educationLevels = await seedEducationLevels();
  await seedInstitutions();
  await seedUsers(educationLevels);
  await seedQuestions();
  await seedOccupations(educationLevels);
};

module.exports = {
  seedDatabase
};
