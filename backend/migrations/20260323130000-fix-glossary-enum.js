'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Use raw SQL to drop and recreate the enum and table
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS glossary_terms;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_glossary_terms_section;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_glossary_terms_section AS ENUM (
        'riasec', 'structure', 'actions', 'occupations', 
        'activities', 'competencies', 'self_estimates', 'general'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE glossary_terms (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        term VARCHAR(255) NOT NULL,
        definition TEXT NOT NULL,
        section enum_glossary_terms_section NOT NULL DEFAULT 'general',
        example TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_term_idx ON glossary_terms(term);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_section_idx ON glossary_terms(section);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_is_active_idx ON glossary_terms(is_active);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS glossary_terms;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_glossary_terms_section;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_glossary_terms_section AS ENUM (
        'activities', 'competencies', 'occupations', 'self_estimates', 'general'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE glossary_terms (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        term VARCHAR(255) NOT NULL,
        definition TEXT NOT NULL,
        section enum_glossary_terms_section NOT NULL DEFAULT 'general',
        example TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_term_idx ON glossary_terms(term);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_section_idx ON glossary_terms(section);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX glossary_terms_is_active_idx ON glossary_terms(is_active);
    `);
  },
};
