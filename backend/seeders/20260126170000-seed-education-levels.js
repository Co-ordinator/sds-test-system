const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const levels = [
      { level: 1, description: 'Lower Than High School' },
      { level: 2, description: 'High School Level (including A-Level and IB Certificate)' },
      { level: 3, description: 'Certificate / Diploma' },
      { level: 4, description: "Bachelor's Degree" },
      { level: 5, description: 'Postgraduate' }
    ];

    const timestamp = new Date();
    await queryInterface.bulkInsert('education_levels', levels.map(l => ({
      id: uuidv4(),
      ...l,
      created_at: timestamp,
      updated_at: timestamp
    })), { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('education_levels', {
      level: { [Sequelize.Op.in]: [1, 2, 3, 4, 5] }
    });
  }
};
