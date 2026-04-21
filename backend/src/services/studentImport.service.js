const { parse } = require('csv-parse/sync');
const { User, EducationLevel, SchoolStudent } = require('../models');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { sendEmail } = require('../config/email.config');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors/appError');

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

const parseCsvRecords = (csvData) => {
  try {
    return parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  } catch (error) {
    throw new ValidationError(`Invalid CSV format: ${error.message}`);
  }
};

const mapSequelizeImportError = (error, rowNumber) => {
  if (error?.name === 'SequelizeUniqueConstraintError') {
    const constraint = String(error?.parent?.constraint || '').toLowerCase();
    const fields = (error?.errors || []).map((entry) => String(entry.path || '').toLowerCase());

    if (constraint.includes('users_email_key') || fields.includes('email')) {
      return new ValidationError(`Row ${rowNumber}: Email already exists. Use a different email or leave email empty.`);
    }
    if (constraint.includes('national_id_hash') || fields.includes('national_id_hash') || fields.includes('nationalidhash')) {
      return new ValidationError(`Row ${rowNumber}: National ID / PIN already exists.`);
    }
    if (constraint.includes('users_student_number_key') || fields.includes('student_number') || fields.includes('studentnumber')) {
      return new ValidationError(`Row ${rowNumber}: Student number already exists.`);
    }
    if (constraint.includes('users_username_key') || fields.includes('username')) {
      return new ValidationError(`Row ${rowNumber}: Generated username already exists.`);
    }
    if (constraint.includes('users_student_code_key') || fields.includes('student_code') || fields.includes('studentcode')) {
      return new ValidationError(`Row ${rowNumber}: Generated student login code already exists. Please retry import.`);
    }
    return new ValidationError(`Row ${rowNumber}: Duplicate data found. Ensure student email, PIN, and student number are unique.`);
  }

  if (error?.name === 'SequelizeValidationError') {
    const messages = (error.errors || [])
      .map((entry) => `${entry.path || 'field'}: ${entry.message}`)
      .join('; ');
    return new ValidationError(`Row ${rowNumber}: ${messages || 'Invalid student data.'}`);
  }

  if (error?.name === 'SequelizeDatabaseError') {
    const detail = error?.parent?.detail || error?.parent?.message || error.message;
    return new ValidationError(`Row ${rowNumber}: ${detail}`);
  }

  return null;
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
 *   institution    | institutionName             — school name (required, must match existing institution)
 *
 * Returns non-sensitive import details.
 */
const bulkCreateStudents = async (csvData, scopedInstitutionId = null) => {
  const records = parseCsvRecords(csvData);

  if (!records.length) {
    throw new ValidationError('No student records found in CSV');
  }

  const defaultEducationLevel = await EducationLevel.findOne({
    attributes: ['id'],
    order: [['level', 'ASC']]
  });
  const defaultEduLevelId = defaultEducationLevel?.id || null;
  const currentYear = new Date().getFullYear();

  const importedStudents = [];
  const transaction = await User.sequelize.transaction();

  try {
    for (let index = 0; index < records.length; index += 1) {
      const row = records[index];
      const rowNumber = index + 2;
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
      const institutionName = col(['institution', 'institutionName', 'institution_name', 'Institution']) || null;
      const password = col(['password']) || generatePassword();

      if (!firstName && !lastName && !studentNumber) {
        throw new ValidationError(`Row ${rowNumber}: Each row must have at least first_name, last_name, or student_number.`);
      }

      if (!nationalId) {
        throw new ValidationError(`Row ${rowNumber}: national_id / PIN is required.`);
      }
      if (!/^\d{13}$/.test(nationalId)) {
        throw new ValidationError(`Row ${rowNumber}: national_id must be exactly 13 digits.`);
      }

      if (!institutionName) {
        throw new ValidationError(`Row ${rowNumber}: institution is required.`);
      }

      // Find institution by exact name match
      const { Institution } = require('../models');
      const institution = await Institution.findOne({
        where: { name: institutionName },
        transaction
      });

      if (!institution) {
        throw new ValidationError(`Row ${rowNumber}: Institution "${institutionName}" not found. Check that the institution name exactly matches an existing institution.`);
      }
      if (scopedInstitutionId && institution.id !== scopedInstitutionId) {
        throw new ValidationError(
          `Institution "${institutionName}" is outside your allowed import scope`
        );
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

      let user;
      try {
        user = await User.create({
          username,
          email: email || null,
          password,
          firstName,
          lastName,
          nationalId,
          role: 'Test Taker',
          userType: 'High School Student',
          employmentStatus: 'student',
          institutionId: institution.id,
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
      } catch (error) {
        const mappedError = mapSequelizeImportError(error, rowNumber);
        if (mappedError) throw mappedError;
        throw error;
      }

      // Create structured SchoolStudent record
      if (studentNumber || grade || className) {
        try {
          await SchoolStudent.create({
            userId: user.id,
            institutionId: institution.id,
            studentNumber: studentNumber || username,
            grade: grade || null,
            className: className || null,
            academicYear: currentYear
          }, { transaction });
        } catch (error) {
          const mappedError = mapSequelizeImportError(error, rowNumber);
          if (mappedError) throw mappedError;
          throw error;
        }
      }

      importedStudents.push({
        studentNumber: studentNumber || null,
        studentCode: user.studentCode,
        username: user.username,
        email: user.email || null,
        firstName: user.firstName,
        lastName: user.lastName,
        grade: grade || null,
        className: className || null
      });
    }

    await transaction.commit();

    // Fire-and-forget: send credential emails to students who have an email address
    const loginUrl = process.env.FRONTEND_URL || 'https://careers.gov.sz';
    const studentsWithEmail = importedStudents.filter(c => c.email);
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
                grade: c.grade || null,
                className: c.className || null,
                loginUrl
              }
            });
          } catch (emailError) {
            logger.error({ actionType: 'EMAIL_FAILED', message: 'Failed to send student credential email', details: { error: emailError.message } });
          }
        }
      });
    }

    return {
      importedCount: importedStudents.length,
      students: importedStudents
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  bulkCreateStudents
};
