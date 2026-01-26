const { parse } = require('csv-parse/sync');
const { User, EducationLevel } = require('../models');

const generatePassword = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  // Ensure at least one letter and one number
  if (!/[A-Za-z]/.test(pwd)) {
    pwd = `A${pwd.slice(1)}`;
  }
  if (!/\d/.test(pwd)) {
    pwd = `${pwd.slice(0, pwd.length - 1)}7`;
  }
  return pwd;
};

const generateUniqueUsername = async (base) => {
  let candidate = base;
  let suffix = 1;
  while (await User.findOne({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const bulkCreateStudents = async (csvData, institutionId) => {
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!records.length) {
    throw new Error('No student records found in CSV');
  }

  const defaultEducationLevel = await EducationLevel.min('level');

  const credentials = [];
  const transaction = await User.sequelize.transaction();

  try {
    for (const row of records) {
      const studentId = (row.studentId || row.student_id || row.id || '').toString().trim();
      if (!studentId) {
        throw new Error('Each row must include a studentId column');
      }

      const firstName = row.firstName || row.first_name || 'Student';
      const lastName = row.lastName || row.last_name || studentId;
      const gradeLevel = row.gradeLevel || row.grade || null;
      const password = row.password || generatePassword();

      const baseUsername = studentId.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const username = await generateUniqueUsername(baseUsername || `student${Date.now()}`);

      const user = await User.create({
        username,
        email: null,
        password,
        firstName,
        lastName,
        role: 'user',
        employmentStatus: 'student',
        institutionId,
        gradeLevel,
        educationLevel: defaultEducationLevel || null,
        isConsentGiven: true,
        consentDate: new Date(),
        isEmailVerified: true,
        createdByCounselor: true
      }, { transaction });

      credentials.push({
        studentId,
        username: user.username,
        password,
        firstName: user.firstName,
        lastName: user.lastName
      });
    }

    await transaction.commit();
    return credentials;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  bulkCreateStudents
};
