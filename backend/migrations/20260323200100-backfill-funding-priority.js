'use strict';

/**
 * Backfill funding_priority on existing courses based on the
 * Eswatini Government (SLAS) scholarship priority programme list.
 *
 * Source: https://slas.gov.sz/LoanProcess/ApplicationRequirements.aspx
 *
 * HIGH  – directly funded: Education, Engineering, Agriculture,
 *         Health Sciences, Technical/Vocational, Science, Technology
 * MEDIUM – partially aligned: Social Sciences, Consumer Sciences
 * NONE  – not currently prioritised: Business, Creative Arts, Humanities, Theology
 */
module.exports = {
  async up(queryInterface) {
    // HIGH priority fields
    await queryInterface.sequelize.query(`
      UPDATE courses SET funding_priority = 'high'
      WHERE field_of_study IN (
        'Education',
        'Engineering',
        'Agriculture',
        'Health Sciences',
        'Trades',
        'Science',
        'Technology'
      )
    `);

    // MEDIUM priority fields
    await queryInterface.sequelize.query(`
      UPDATE courses SET funding_priority = 'medium'
      WHERE field_of_study IN (
        'Social Sciences',
        'Consumer Sciences'
      )
    `);

    // Remaining stay 'none' (the column default)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE courses SET funding_priority = 'none'
    `);
  }
};
