"use strict";

const { v4: uuidv4 } = require('uuid');
const now = new Date();

/**
 * School Students Seeder
 * Creates school_students records for seeded high-school users.
 * Matches users by student_number (username) and institution by name.
 */

const studentData = [
];

module.exports = {
  async up(queryInterface) {
    if (studentData.length === 0) {
      return;
    }
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, username FROM users WHERE username IN (${studentData.map(() => '?').join(',')})`,
      { replacements: studentData.map(s => s.username) }
    );

    const [institutions] = await queryInterface.sequelize.query(
      'SELECT id, name FROM institutions'
    );

    const rows = [];
    for (const sd of studentData) {
      const user = users.find(u => u.username === sd.username);
      const inst = institutions.find(i => i.name.toLowerCase() === sd.institutionName.toLowerCase());
      if (!user || !inst) {
        throw new Error(`Cannot seed school_student for ${sd.username}: user or institution not found`);
      }
      rows.push({
        id: uuidv4(),
        user_id: user.id,
        institution_id: inst.id,
        student_number: sd.studentNumber,
        grade: sd.grade,
        class_name: sd.className,
        academic_year: sd.academicYear,
        login_card_printed: false,
        login_card_printed_at: null,
        created_at: now,
        updated_at: now
      });
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert('school_students', rows, { ignoreDuplicates: true });
      console.log(`Inserted ${rows.length} school_students records.`);
    }
  },

  async down(queryInterface) {
    if (studentData.length === 0) {
      return;
    }
    const usernames = studentData.map(s => s.username);
    await queryInterface.sequelize.query(
      `DELETE FROM school_students WHERE user_id IN (
         SELECT id FROM users WHERE username IN (${usernames.map(() => '?').join(',')})
       )`,
      { replacements: usernames }
    );
  }
};
