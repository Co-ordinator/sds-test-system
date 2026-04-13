"use strict";

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const pgArray = (arr) => {
  if (!arr || !arr.length) return null;
  const escaped = arr.map(s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
};

const normalizeHollandCode = (code) =>
  String(code || '').toUpperCase().replace(/[^RIASEC]/g, '').slice(0, 3);

/**
 * CONSOLIDATED OCCUPATIONS SEEDER
 * Loads all occupations from Holland codes CSV file
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const occupations = [];
    const csvPath = path.join(__dirname, '..', '..', 'docs', 'Holland-codes-and-occupations-master.csv');

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    // CSV format: "riasecCategory","hollandCode","occupation","educationLevel"
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const match = line.match(/"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/);
      if (!match) continue;

      const [, riasecCategory, hollandCode, occupation, educationLevel] = match;
      
      const normalizedCode = normalizeHollandCode(hollandCode);
      if (occupation && normalizedCode.length === 3) {
        occupations.push({
          id: uuidv4(),
          code: normalizedCode,
          name: occupation,
          holland_codes: pgArray([normalizedCode]),
          primary_riasec: riasecCategory || normalizedCode.charAt(0),
          secondary_riasec: normalizedCode.length > 1 ? normalizedCode.charAt(1) : null,
          description: null,
          category: riasecCategory,
          education_level: null,
          education_required: educationLevel || null,
          demand_level: null,
          available_in_eswatini: true,
          local_demand: null,
          skills: null,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('occupations', occupations, { ignoreDuplicates: true });
    console.log(`Seeded ${occupations.length} occupations from CSV.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('occupations', null, {});
  }
};
