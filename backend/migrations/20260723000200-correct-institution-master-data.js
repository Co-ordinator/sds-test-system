'use strict';

const BACKUP_TABLE = 'qa_institution_master_data_backup';

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();
    try {
      await queryInterface.createTable(BACKUP_TABLE, {
        institution_id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
        previous_type: { type: Sequelize.STRING, allowNull: false },
        previous_region: { type: Sequelize.STRING, allowNull: true },
        previous_district: { type: Sequelize.STRING, allowNull: true },
        previous_updated_at: { type: Sequelize.DATE, allowNull: false },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      await sequelize.query(`
        INSERT INTO ${BACKUP_TABLE} (
          institution_id,
          previous_type,
          previous_region,
          previous_district,
          previous_updated_at
        )
        SELECT id, type::text, region::text, district, updated_at
        FROM institutions
        WHERE (
          type <> 'school'
          AND (
            name ILIKE '%high school%'
            OR name ILIKE '%secondary school%'
            OR name ILIKE '%central school%'
          )
        )
        OR acronym = 'ECOT'
        OR name ILIKE 'Eswatini College of Technology'
      `, { transaction });

      await sequelize.query(`
        UPDATE institutions
        SET type = 'school',
            updated_at = NOW()
        WHERE type <> 'school'
          AND (
            name ILIKE '%high school%'
            OR name ILIKE '%secondary school%'
            OR name ILIKE '%central school%'
          )
      `, { transaction });

      await sequelize.query(`
        UPDATE institutions
        SET region = 'hhohho',
            district = 'Mbabane',
            updated_at = NOW()
        WHERE acronym = 'ECOT'
           OR name ILIKE 'Eswatini College of Technology'
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
      await sequelize.query(`
        UPDATE institutions AS i
        SET type = b.previous_type::enum_institutions_type,
            region = b.previous_region::enum_institutions_region,
            district = b.previous_district,
            updated_at = b.previous_updated_at
        FROM ${BACKUP_TABLE} AS b
        WHERE i.id = b.institution_id
      `, { transaction });
      await queryInterface.dropTable(BACKUP_TABLE, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
