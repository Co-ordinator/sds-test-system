"use strict";

const { v4: uuidv4 } = require('uuid');
const now = new Date();

/**
 * Assessments + Answers Seeder
 *
 * Creates completed assessments for 6 users with varied Holland Code profiles:
 *   Thabo Zwane      (20250101)  → IRS  (Investigative-Realistic-Social)
 *   Siphiwe Dube     (20250102)  → SAE  (Social-Artistic-Enterprising)
 *   Lungelo Masuku   (20250201)  → RIE  (Realistic-Investigative-Enterprising)
 *   Zanele Motsa     (zanele…)   → ICS  (Investigative-Conventional-Social)
 *   Mandla Dlamini   (mandla…)   → CES  (Conventional-Enterprising-Social)
 *   Demo Student     (student@…) → ESC  (Enterprising-Social-Conventional)
 *
 * Scoring rules (mirroring ScoringService.finalizeAssessment):
 *   activities / competencies / occupations → YES = +1
 *   self_estimates → raw 1-7 rating added directly
 */

/**
 * Given a probability map and a question, return a realistic answer value.
 * @param {object} profile  e.g. { R:0.9, I:0.7, A:0.3, S:0.4, E:0.3, C:0.2 }
 * @param {string} riasec   single letter
 * @param {string} section
 * @param {number} seed     deterministic offset so the same profile always
 *                          produces the same score (avoids random variance)
 */
function answerFor(profile, riasec, section, seed) {
  const prob = profile[riasec] || 0;
  if (section === 'self_estimates') {
    // Scale probability (0-1) to 1-7 rating
    return String(Math.max(1, Math.min(7, Math.round(prob * 7))));
  }
  // Use a deterministic pseudo-random based on seed
  const pseudo = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  return pseudo < prob ? 'YES' : 'NO';
}

/**
 * Build answer rows for one assessment.
 * @param {string}   assessmentId
 * @param {object[]} questions     rows from DB (id, section, riasec_type, order)
 * @param {object}   profile       RIASEC probability map (0-1)
 * @returns {{ answers: object[], scores: object }}
 */
function buildAnswers(assessmentId, questions, profile) {
  const answers = [];
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  questions.forEach((q, idx) => {
    const value = answerFor(profile, q.riasec_type, q.section, idx + 1);
    answers.push({
      id: uuidv4(),
      assessment_id: assessmentId,
      question_id: q.id,
      value,
      section: q.section,
      riasec_type: q.riasec_type,
      created_at: now,
      updated_at: now
    });

    if (['activities', 'competencies', 'occupations'].includes(q.section)) {
      if (value === 'YES') scores[q.riasec_type]++;
    } else if (q.section === 'self_estimates') {
      scores[q.riasec_type] += parseInt(value, 10);
    }
  });

  return { answers, scores };
}

function hollandCodeFromScores(scores) {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k)
    .join('');
}

module.exports = {
  async up(queryInterface) {
    // ── 1. Fetch all questions ─────────────────────────────────────────
    const [questions] = await queryInterface.sequelize.query(
      'SELECT id, section, riasec_type, "order" FROM questions ORDER BY section, "order"'
    );

    if (questions.length === 0) {
      console.warn('No questions found – skipping assessments seeder.');
      return;
    }

    // ── 2. Fetch education levels ─────────────────────────────────────
    const [eduLevels] = await queryInterface.sequelize.query(
      'SELECT id, level FROM education_levels ORDER BY level'
    );
    const byLevel = (n) => {
      const f = eduLevels.find(l => parseInt(l.level) === n);
      return f ? f.id : null;
    };

    // ── 3. Fetch target users ─────────────────────────────────────────
    const targetUsernames = ['20250101', '20250102', '20250201', 'zanele.motsa', 'mandla.dlamini', 'demo.student'];
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, username, education_level FROM users
       WHERE username IN (${targetUsernames.map(() => '?').join(',')})`,
      { replacements: targetUsernames }
    );

    // ── 4. Per-user profile definitions ──────────────────────────────
    const profiles = {
      '20250101':     { R: 0.80, I: 0.92, A: 0.35, S: 0.55, E: 0.30, C: 0.28 },  // IRS
      '20250102':     { R: 0.25, I: 0.30, A: 0.75, S: 0.90, E: 0.70, C: 0.20 },  // SAE
      '20250201':     { R: 0.88, I: 0.72, A: 0.25, S: 0.28, E: 0.65, C: 0.30 },  // RIE
      'zanele.motsa': { R: 0.30, I: 0.90, A: 0.25, S: 0.48, E: 0.38, C: 0.75 },  // ICS
      'mandla.dlamini':{ R: 0.20, I: 0.45, A: 0.25, S: 0.50, E: 0.78, C: 0.92 }, // CES
      'demo.student': { R: 0.40, I: 0.42, A: 0.35, S: 0.70, E: 0.85, C: 0.65 }   // ESC
    };

    const completedDates = {
      '20250101':     new Date('2026-02-10T09:30:00'),
      '20250102':     new Date('2026-02-12T10:15:00'),
      '20250201':     new Date('2026-02-14T14:00:00'),
      'zanele.motsa': new Date('2026-02-16T11:45:00'),
      'mandla.dlamini': new Date('2026-02-18T08:00:00'),
      'demo.student': new Date('2026-02-20T15:30:00')
    };

    const allAssessments = [];
    const allAnswers = [];

    for (const user of users) {
      const profile  = profiles[user.username];
      const completedAt = completedDates[user.username] || now;
      if (!profile) continue;

      const assessmentId = uuidv4();
      const { answers, scores } = buildAnswers(assessmentId, questions, profile);
      const hollandCode = hollandCodeFromScores(scores);

      allAssessments.push({
        id: assessmentId,
        user_id: user.id,
        status: 'completed',
        progress: 100.00,
        score_r: scores.R,
        score_i: scores.I,
        score_a: scores.A,
        score_s: scores.S,
        score_e: scores.E,
        score_c: scores.C,
        holland_code: hollandCode,
        education_level_at_test: user.education_level || byLevel(2),
        completed_at: completedAt,
        created_at: completedAt,
        updated_at: completedAt
      });

      allAnswers.push(...answers.map(a => ({ ...a, created_at: completedAt, updated_at: completedAt })));

      console.log(`  ${user.username}: Holland Code = ${hollandCode}  scores = R${scores.R} I${scores.I} A${scores.A} S${scores.S} E${scores.E} C${scores.C}`);
    }

    // Also create one in-progress assessment (Nokwanda — no answers yet)
    const [nokwanda] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE username = '20250202' LIMIT 1`
    );
    if (nokwanda && nokwanda[0]) {
      allAssessments.push({
        id: uuidv4(),
        user_id: nokwanda[0].id,
        status: 'in_progress',
        progress: 42.50,
        score_r: 0, score_i: 0, score_a: 0, score_s: 0, score_e: 0, score_c: 0,
        holland_code: null,
        education_level_at_test: byLevel(2),
        completed_at: null,
        created_at: new Date('2026-02-22T13:00:00'),
        updated_at: new Date('2026-02-22T13:45:00')
      });
    }

    if (allAssessments.length > 0) {
      await queryInterface.bulkInsert('assessments', allAssessments, { ignoreDuplicates: true });
      console.log(`Inserted ${allAssessments.length} assessments.`);
    }

    if (allAnswers.length > 0) {
      // Insert in batches of 500 to avoid parameter limits
      const batchSize = 500;
      for (let i = 0; i < allAnswers.length; i += batchSize) {
        await queryInterface.bulkInsert('answers', allAnswers.slice(i, i + batchSize), { ignoreDuplicates: true });
      }
      console.log(`Inserted ${allAnswers.length} answers.`);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('answers', null, {});
    await queryInterface.bulkDelete('assessments', null, {});
  }
};
