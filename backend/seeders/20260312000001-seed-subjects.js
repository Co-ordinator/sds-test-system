'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const subjects = [
      // Realistic (R)
      { name: 'Mathematics', riasec_codes: ['R', 'I', 'E', 'C'], level: 'both', display_order: 1 },
      { name: 'Physical Science', riasec_codes: ['R', 'I'], level: 'high_school', display_order: 2 },
      { name: 'Technical Drawing', riasec_codes: ['R'], level: 'high_school', display_order: 3 },
      { name: 'Agricultural Science', riasec_codes: ['R', 'I'], level: 'both', display_order: 4 },
      { name: 'Computer Science', riasec_codes: ['R', 'I', 'C'], level: 'both', display_order: 5 },
      
      // Investigative (I)
      { name: 'Biology', riasec_codes: ['I', 'S'], level: 'both', display_order: 6 },
      { name: 'Chemistry', riasec_codes: ['I'], level: 'both', display_order: 7 },
      { name: 'Physics', riasec_codes: ['I', 'R'], level: 'both', display_order: 8 },
      
      // Artistic (A)
      { name: 'Art', riasec_codes: ['A'], level: 'both', display_order: 9 },
      { name: 'Music', riasec_codes: ['A'], level: 'both', display_order: 10 },
      { name: 'English Language', riasec_codes: ['A', 'S', 'E'], level: 'both', display_order: 11 },
      { name: 'Literature', riasec_codes: ['A'], level: 'both', display_order: 12 },
      { name: 'Drama', riasec_codes: ['A', 'S'], level: 'both', display_order: 13 },
      { name: 'Design & Technology', riasec_codes: ['A', 'R'], level: 'both', display_order: 14 },
      
      // Social (S)
      { name: 'History', riasec_codes: ['S', 'I'], level: 'both', display_order: 15 },
      { name: 'Religious Education', riasec_codes: ['S'], level: 'high_school', display_order: 16 },
      { name: 'Home Economics', riasec_codes: ['S', 'C'], level: 'high_school', display_order: 17 },
      { name: 'Geography', riasec_codes: ['S', 'I'], level: 'both', display_order: 18 },
      { name: 'SiSwati', riasec_codes: ['S', 'A'], level: 'high_school', display_order: 19 },
      
      // Enterprising (E)
      { name: 'Business Studies', riasec_codes: ['E', 'C'], level: 'both', display_order: 20 },
      { name: 'Economics', riasec_codes: ['E', 'I', 'C'], level: 'both', display_order: 21 },
      { name: 'Accounting', riasec_codes: ['E', 'C'], level: 'both', display_order: 22 },
      { name: 'Commerce', riasec_codes: ['E', 'C'], level: 'both', display_order: 23 },
      
      // Conventional (C)
      { name: 'Information Technology', riasec_codes: ['C', 'R', 'I'], level: 'both', display_order: 24 },
      { name: 'Statistics', riasec_codes: ['C', 'I'], level: 'tertiary', display_order: 25 }
    ];

    const now = new Date();
    const subjectsWithTimestamps = subjects.map(s => ({
      id: Sequelize.literal('uuid_generate_v4()'),
      ...s,
      is_active: true,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('subjects', subjectsWithTimestamps);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subjects', null, {});
  }
};
