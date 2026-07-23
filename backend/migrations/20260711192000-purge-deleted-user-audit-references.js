"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM audit_logs al
      WHERE (
        al.details ? 'resourceId'
        AND al.details->>'resourceType' = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.id::text = al.details->>'resourceId'
        )
      ) OR (
        al.details ? 'userId'
        AND NOT EXISTS (
          SELECT 1 FROM users u WHERE u.id::text = al.details->>'userId'
        )
      ) OR (
        jsonb_typeof(al.details->'ids') = 'array'
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(al.details->'ids') deleted_id
          WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id::text = deleted_id
          )
        )
      )
    `);
  },

  async down() {}
};
