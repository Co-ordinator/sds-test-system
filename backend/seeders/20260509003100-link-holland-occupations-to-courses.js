"use strict";

const { v4: uuidv4 } = require("uuid");

const now = () => new Date();

const normalizeCode = (code) =>
  String(code || "").toUpperCase().replace(/[^RIASEC]/g, "").slice(0, 3);

const uniqueCodes = (codes) => {
  const input = Array.isArray(codes) ? codes : [];
  return [...new Set(input.map(normalizeCode).filter((code) => code.length === 3))];
};

const scorePair = (occupationCode, courseCode) => {
  const occupation = normalizeCode(occupationCode);
  const course = normalizeCode(courseCode);
  if (occupation.length !== 3 || course.length !== 3) return 0;
  if (occupation === course) return 1;
  if (occupation.slice(0, 2) === course.slice(0, 2)) return 0.92;
  return 0;
};

module.exports = {
  async up(queryInterface) {
    const [occupations] = await queryInterface.sequelize.query(`
      SELECT id, code, holland_codes
      FROM occupations
      WHERE status = 'approved'
        AND COALESCE(array_length(holland_codes, 1), 0) > 0;
    `);

    const [courses] = await queryInterface.sequelize.query(`
      SELECT id, name, riasec_codes, funding_priority
      FROM courses
      WHERE is_active = TRUE
        AND COALESCE(array_length(riasec_codes, 1), 0) > 0;
    `);

    const links = [];
    const timestamp = now();

    for (const occupation of occupations) {
      const occupationCodes = uniqueCodes(occupation.holland_codes || [occupation.code]);
      const matches = [];

      for (const course of courses) {
        const courseCodes = uniqueCodes(course.riasec_codes || []);
        let bestScore = 0;

        for (const occupationCode of occupationCodes) {
          for (const courseCode of courseCodes) {
            bestScore = Math.max(bestScore, scorePair(occupationCode, courseCode));
          }
        }

        if (bestScore >= 0.9) {
          matches.push({
            courseId: course.id,
            score: bestScore,
            isPriority: course.funding_priority === true
          });
        }
      }

      matches
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (Number(b.isPriority) !== Number(a.isPriority)) return Number(b.isPriority) - Number(a.isPriority);
          return String(a.courseId).localeCompare(String(b.courseId));
        })
        .slice(0, 5)
        .forEach((match) => {
          links.push({
            id: uuidv4(),
            occupation_id: occupation.id,
            course_id: match.courseId,
            relevance_score: match.score.toFixed(2),
            is_primary_pathway: match.score >= 0.92,
            notes: "Auto-linked by Holland code alignment from the Dictionary of Holland Occupational Codes dataset.",
            created_at: timestamp,
            updated_at: timestamp
          });
        });
    }

    for (let i = 0; i < links.length; i += 1000) {
      await queryInterface.bulkInsert("occupation_courses", links.slice(i, i + 1000), {
        ignoreDuplicates: true
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM occupation_courses
      WHERE notes = 'Auto-linked by Holland code alignment from the Dictionary of Holland Occupational Codes dataset.';
    `);
  }
};
