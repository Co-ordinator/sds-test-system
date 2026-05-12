'use strict';

// Source: docs/priority list.xlsx
//
// The spreadsheet is a policy list, not a normalized import table. It includes
// local institution programmes and priority outside-Eswatini study fields.
// This seeder maps the entries that are represented in the current `courses`
// catalogue and marks them as SLAS/government funding priority programmes.
const priorityCourseNames = [
  'Bachelor of Arts in Fashion Design',
  'Bachelor of Arts in Graphic Design',
  'Bachelor of Arts in Journalism and Mass Communication',
  'Bachelor of Business Administration',
  'Bachelor of Commerce in Accounting and Finance',
  'Bachelor of Commerce in Management',
  'Bachelor of Consumer Science',
  'Bachelor of Education (Primary)',
  'Bachelor of Education (Secondary)',
  'Bachelor of Engineering in Electrical and Electronic Engineering',
  'Bachelor of Medical Laboratory Sciences',
  'Bachelor of Multimedia Design',
  'Bachelor of Nursing Science',
  'Bachelor of Pharmacy',
  'Bachelor of Psychology',
  'Bachelor of Radiography',
  'Bachelor of Science (General)',
  'Bachelor of Science in Agriculture',
  'Bachelor of Science in Computer Science',
  'Bachelor of Social Work',
  'Diploma in Business Finance and Accounting',
  'Diploma in Business Management',
  'Diploma in Electrical Engineering',
  'Diploma in General Nursing',
  'Diploma in Human Resource Management',
  'Diploma in Information Technology',
  'Diploma in Mechanical Engineering',
  'Diploma in Pharmacy',
  'Diploma in Public Health Management',
  'National Certificate in Building and Construction',
  'National Certificate in Carpentry and Joinery',
  'National Certificate in Electrical Installation',
  'National Certificate in Motor Vehicle Mechanics',
  'Primary Teachers Diploma (PTD)',
  'Secondary Teachers Diploma (STD)',
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          UPDATE courses
          SET funding_priority = TRUE,
              updated_at = NOW()
          WHERE name IN (:priorityCourseNames)
        `,
        {
          replacements: { priorityCourseNames },
          transaction,
        }
      );

      // If previous manual/local data already marked one duplicate row as
      // priority, make all rows with that same course name consistent.
      await queryInterface.sequelize.query(
        `
          UPDATE courses c
          SET funding_priority = TRUE,
              updated_at = NOW()
          WHERE EXISTS (
            SELECT 1
            FROM courses c2
            WHERE c2.name = c.name
              AND c2.funding_priority = TRUE
          )
        `,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `
        UPDATE courses
        SET funding_priority = FALSE,
            updated_at = NOW()
        WHERE name IN (:priorityCourseNames)
      `,
      {
        replacements: { priorityCourseNames },
      }
    );
  },
};
