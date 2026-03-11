const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const levels = [
      { level: 1, description: "Lower than matric" },
      { level: 2, description: "High school education (matric)" },
      { level: 3, description: "Training at college/technical college/on-the-job-training" },
      { level: 4, description: "Training at teachers' college/technikon/university" },
      { level: 5, description: "Postgraduate degree/university training plus experience" }
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
