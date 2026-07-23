'use strict';

const BACKUP_TABLE = 'qa_institution_dedup_backup';
const UNIQUE_INDEX = 'institutions_normalized_name_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();
    try {
      await queryInterface.createTable(BACKUP_TABLE, {
        institution_id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
        keep_id: { type: Sequelize.UUID, allowNull: false },
        institution_data: { type: Sequelize.JSONB, allowNull: false },
        learner_user_ids: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        workplace_user_ids: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        school_students: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        course_institutions: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      const [groups] = await sequelize.query(`
        SELECT LOWER(BTRIM(name)) AS normalized_name,
               ARRAY_AGG(
                 id ORDER BY
                   CASE WHEN status = 'approved' THEN 0 ELSE 1 END,
                   CASE WHEN type <> 'other' THEN 0 ELSE 1 END,
                   CASE WHEN region IS NOT NULL THEN 0 ELSE 1 END,
                   created_at ASC,
                   id ASC
               ) AS ids
        FROM institutions
        WHERE name IS NOT NULL AND BTRIM(name) <> ''
        GROUP BY LOWER(BTRIM(name))
        HAVING COUNT(*) > 1
      `, { transaction });

      for (const group of groups) {
        const [keepId, ...duplicateIds] = group.ids;
        for (const duplicateId of duplicateIds) {
          const [[institution]] = await sequelize.query(
            'SELECT * FROM institutions WHERE id = :duplicateId',
            { replacements: { duplicateId }, transaction }
          );
          const [learnerUsers] = await sequelize.query(
            'SELECT id FROM users WHERE institution_id = :duplicateId',
            { replacements: { duplicateId }, transaction }
          );
          const [workplaceUsers] = await sequelize.query(
            'SELECT id FROM users WHERE workplace_institution_id = :duplicateId',
            { replacements: { duplicateId }, transaction }
          );
          const [schoolStudents] = await sequelize.query(
            'SELECT * FROM school_students WHERE institution_id = :duplicateId ORDER BY id',
            { replacements: { duplicateId }, transaction }
          );
          const [courseInstitutions] = await sequelize.query(
            'SELECT * FROM course_institutions WHERE institution_id = :duplicateId ORDER BY id',
            { replacements: { duplicateId }, transaction }
          );

          await queryInterface.bulkInsert(BACKUP_TABLE, [{
            institution_id: duplicateId,
            keep_id: keepId,
            institution_data: JSON.stringify(institution),
            learner_user_ids: JSON.stringify(learnerUsers.map((row) => row.id)),
            workplace_user_ids: JSON.stringify(workplaceUsers.map((row) => row.id)),
            school_students: JSON.stringify(schoolStudents),
            course_institutions: JSON.stringify(courseInstitutions),
            created_at: new Date()
          }], { transaction });

          await sequelize.query(
            'UPDATE users SET institution_id = :keepId WHERE institution_id = :duplicateId',
            { replacements: { keepId, duplicateId }, transaction }
          );
          await sequelize.query(
            'UPDATE users SET workplace_institution_id = :keepId WHERE workplace_institution_id = :duplicateId',
            { replacements: { keepId, duplicateId }, transaction }
          );

          await sequelize.query(`
            DELETE FROM school_students duplicate
            WHERE duplicate.institution_id = :duplicateId
              AND EXISTS (
                SELECT 1
                FROM school_students canonical
                WHERE canonical.institution_id = :keepId
                  AND canonical.student_number = duplicate.student_number
              )
          `, { replacements: { keepId, duplicateId }, transaction });
          await sequelize.query(
            'UPDATE school_students SET institution_id = :keepId WHERE institution_id = :duplicateId',
            { replacements: { keepId, duplicateId }, transaction }
          );

          await sequelize.query(`
            DELETE FROM course_institutions duplicate
            WHERE duplicate.institution_id = :duplicateId
              AND EXISTS (
                SELECT 1
                FROM course_institutions canonical
                WHERE canonical.institution_id = :keepId
                  AND canonical.course_id = duplicate.course_id
              )
          `, { replacements: { keepId, duplicateId }, transaction });
          await sequelize.query(
            'UPDATE course_institutions SET institution_id = :keepId WHERE institution_id = :duplicateId',
            { replacements: { keepId, duplicateId }, transaction }
          );

          await sequelize.query(
            'DELETE FROM institutions WHERE id = :duplicateId',
            { replacements: { duplicateId }, transaction }
          );
        }
      }

      await sequelize.query(`
        CREATE UNIQUE INDEX ${UNIQUE_INDEX}
        ON institutions (LOWER(BTRIM(name)))
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(`DROP INDEX IF EXISTS ${UNIQUE_INDEX}`, { transaction });
      const [backups] = await sequelize.query(
        `SELECT * FROM ${BACKUP_TABLE} ORDER BY created_at ASC, institution_id ASC`,
        { transaction }
      );

      for (const backup of backups) {
        await queryInterface.bulkInsert('institutions', [backup.institution_data], { transaction });
      }

      for (const backup of backups) {
        const learnerIds = backup.learner_user_ids || [];
        const workplaceIds = backup.workplace_user_ids || [];
        if (learnerIds.length > 0) {
          await sequelize.query(
            'UPDATE users SET institution_id = :institutionId WHERE id IN (:userIds)',
            { replacements: { institutionId: backup.institution_id, userIds: learnerIds }, transaction }
          );
        }
        if (workplaceIds.length > 0) {
          await sequelize.query(
            'UPDATE users SET workplace_institution_id = :institutionId WHERE id IN (:userIds)',
            { replacements: { institutionId: backup.institution_id, userIds: workplaceIds }, transaction }
          );
        }

        for (const row of backup.school_students || []) {
          await sequelize.query(
            'DELETE FROM school_students WHERE id = :id',
            { replacements: { id: row.id }, transaction }
          );
          await queryInterface.bulkInsert('school_students', [row], { transaction });
        }
        for (const row of backup.course_institutions || []) {
          await sequelize.query(
            'DELETE FROM course_institutions WHERE id = :id',
            { replacements: { id: row.id }, transaction }
          );
          await queryInterface.bulkInsert('course_institutions', [row], { transaction });
        }
      }

      await queryInterface.dropTable(BACKUP_TABLE, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
