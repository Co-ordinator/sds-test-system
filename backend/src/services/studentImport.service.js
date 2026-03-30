const { parse } = require('csv-parse/sync');
const { User, EducationLevel, SchoolStudent } = require('../models');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { sendEmail } = require('../config/email.config');

const generatePassword = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  if (!/[A-Z]/.test(pwd)) pwd = `A${pwd.slice(1)}`;
  if (!/\d/.test(pwd)) pwd = `${pwd.slice(0, pwd.length - 1)}7`;
  return pwd;
};

const generateUniqueUsername = async (base, transaction) => {
  let candidate = base;
  let suffix = 1;
  while (await User.findOne({ where: { username: candidate }, transaction })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
};

/**
 * Bulk create students from CSV.
 *
 * Supported CSV columns (case-insensitive, snake_case or camelCase):
 *   student_number | student_id | studentNumber  — used as username
 *   first_name     | firstName
 *   last_name      | lastName
 *   national_id    | nationalId | pin | PIN       — 13-digit national ID / PIN (required)
 *   email                                         — optional
 *   grade          | gradeLevel                   — e.g. Form5, Grade 11
 *   class          | class_name | className        — e.g. A, Blue
 *   gender                                         — male|female|other
 *
 * Returns array of credentials including plain-text passwords for card printing.
 */
const bulkCreateStudents = async (csvData, institutionId) => {
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (!records.length) {
    throw new Error('No student records found in CSV');
  }

  const defaultEduLevelId = await EducationLevel.min('id');
  const currentYear = new Date().getFullYear();

  const credentials = [];
  const transaction = await User.sequelize.transaction();

  try {
    for (const row of records) {
      const col = (keys) => {
        for (const k of keys) {
          const val = row[k] ?? row[k.toLowerCase()] ?? row[k.toUpperCase()];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
        return '';
      };

      const studentNumber = col(['student_number', 'studentNumber', 'student_id', 'studentId', 'id']);
      const firstName = col(['first_name', 'firstName', 'FirstName']) || 'Student';
      const lastName = col(['last_name', 'lastName', 'LastName']) || (studentNumber || '');
      const nationalId = col(['national_id', 'nationalId', 'national_ID', 'pin', 'PIN']) || null;
      const email = col(['email', 'Email']) || null;
      const grade = col(['grade', 'gradeLevel', 'grade_level', 'Grade']) || null;
      const className = col(['class', 'class_name', 'className', 'Class']) || null;
      const gender = col(['gender', 'Gender']) || null;
      const password = col(['password']) || generatePassword();

      if (!firstName && !lastName && !studentNumber) {
        throw new Error('Each row must have at least first_name, last_name, or student_number');
      }

      if (!nationalId) {
        throw new Error(`Row for ${firstName} ${lastName}: national_id / PIN is required`);
      }
      if (!/^\d{13}$/.test(nationalId)) {
        throw new Error(`Row for ${firstName} ${lastName}: national_id must be exactly 13 digits (got "${nationalId}")`);
      }

      // Preferred username = student_number; fallback to name-based slug
      const baseUsername = studentNumber
        ? studentNumber.toLowerCase().replace(/[^a-z0-9]/gi, '')
        : `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/gi, '').slice(0, 14) || `student${Date.now()}`;

      const username = await generateUniqueUsername(baseUsername, transaction);

      const normalizedGender = ['male', 'female', 'other'].includes((gender || '').toLowerCase())
        ? gender.toLowerCase()
        : null;

      // Generate universal login number for this student
      const studentCode = await generateStudentCode(transaction);

      const user = await User.create({
        username,
        email: email || null,
        password,
        firstName,
        lastName,
        nationalId,
        role: 'Test Taker',
        userType: 'High School Student',
        employmentStatus: 'student',
        institutionId,
        gradeLevel: grade,
        className,
        studentNumber: studentNumber || null,
        studentCode,
        gender: normalizedGender,
        educationLevel: defaultEduLevelId || null,
        isConsentGiven: true,
        consentDate: new Date(),
        isEmailVerified: true,
        createdByCounselor: true,
        mustChangePassword: true,
        onboardingCompleted: true
      }, { transaction });

      // Create structured SchoolStudent record
      if (studentNumber || grade || className) {
        await SchoolStudent.create({
          userId: user.id,
          institutionId,
          studentNumber: studentNumber || username,
          grade: grade || null,
          className: className || null,
          academicYear: currentYear
        }, { transaction });
      }

      credentials.push({
        studentNumber: studentNumber || null,
        studentCode: user.studentCode,
        username: user.username,
        email: user.email || null,
        password,
        firstName: user.firstName,
        lastName: user.lastName,
        grade: grade || null,
        className: className || null
      });
    }

    await transaction.commit();

    // Fire-and-forget: send credential emails to students who have an email address
    const loginUrl = process.env.FRONTEND_URL || 'https://careers.gov.sz';
    const studentsWithEmail = credentials.filter(c => c.email);
    if (studentsWithEmail.length > 0) {
      setImmediate(async () => {
        for (const c of studentsWithEmail) {
          try {
            await sendEmail({
              email: c.email,
              subject: 'Your Career Guidance System Login Details',
              template: 'student-credentials',
              context: {
                firstName: c.firstName,
                lastName: c.lastName,
                studentCode: c.studentCode,
                password: c.password,
                grade: c.grade || null,
                className: c.className || null,
                loginUrl
              }
            });
          } catch (emailError) {
            console.error(`Failed to send credentials email to ${c.email}:`, emailError.message);
          }
        }
      });
    }

    return credentials;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  bulkCreateStudents
};
