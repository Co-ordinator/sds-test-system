"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("occupations");

    if (!table.source) {
      await queryInterface.addColumn("occupations", "source", {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!table.source_code) {
      await queryInterface.addColumn("occupations", "source_code", {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!table.consistency_score) {
      await queryInterface.addColumn("occupations", "consistency_score", {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS occupations_code_idx
        ON occupations (code);

      CREATE INDEX IF NOT EXISTS occupations_primary_riasec_idx
        ON occupations (primary_riasec);

      CREATE INDEX IF NOT EXISTS occupations_secondary_riasec_idx
        ON occupations (secondary_riasec);

      CREATE INDEX IF NOT EXISTS occupations_holland_codes_gin_idx
        ON occupations USING GIN (holland_codes);

      CREATE INDEX IF NOT EXISTS occupations_source_idx
        ON occupations (source);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS occupations_source_idx;
      DROP INDEX IF EXISTS occupations_holland_codes_gin_idx;
      DROP INDEX IF EXISTS occupations_secondary_riasec_idx;
      DROP INDEX IF EXISTS occupations_primary_riasec_idx;
      DROP INDEX IF EXISTS occupations_code_idx;
    `);

    const table = await queryInterface.describeTable("occupations");
    if (table.consistency_score) await queryInterface.removeColumn("occupations", "consistency_score");
    if (table.source_code) await queryInterface.removeColumn("occupations", "source_code");
    if (table.source) await queryInterface.removeColumn("occupations", "source");
  }
};
