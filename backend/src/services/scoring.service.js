const { Answer, Assessment, Occupation, EducationLevel, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * SDS Scoring Service
 * Handles the calculation of RIASEC scores and career matching
 * based on the 228-item assessment and Education Levels 1-5.
 */
class ScoringService {
  /**
   * Main entry point to finalize an assessment
   */
  async finalizeAssessment(assessmentId) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Fetch the assessment and the associated user's education level
      const assessment = await Assessment.findByPk(assessmentId, {
        include: ['user'],
        transaction
      });

      if (!assessment) throw new Error('Assessment not found');

      // 2. Fetch all answers
      const answers = await Answer.findAll({ 
        where: { assessmentId },
        transaction 
      });

      // 3. Initialize RIASEC tally
      const totals = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

      answers.forEach(ans => {
        const type = ans.riasecType; // R, I, A, S, E, or C
        
        if (['activities', 'competencies', 'occupations'].includes(ans.section)) {
          // Sections I, II, III: Binary scoring (YES = 1 point)
          if (ans.value.toUpperCase() === 'YES') {
            totals[type] += 1;
          }
        } else if (ans.section === 'self_estimates') {
          // Section IV: Scale scoring (Values 1-6)
          const rating = parseInt(ans.value, 10);
          if (!isNaN(rating)) {
            totals[type] += rating;
          }
        }
      });

      // 4. Generate the 3-letter Holland Code (e.g., "RIA")
      const hollandCode = Object.entries(totals)
        .sort(([, valA], [, valB]) => valB - valA) // Sort by score descending
        .slice(0, 3) // Take top 3
        .map(([key]) => key)
        .join('');

      // 5. Update Assessment with final scores and code
      await assessment.update({
        scoreR: totals.R,
        scoreI: totals.I,
        scoreA: totals.A,
        scoreS: totals.S,
        scoreE: totals.E,
        scoreC: totals.C,
        hollandCode,
        status: 'completed',
        completedAt: new Date(),
        // Store the education level at time of completion for historical accuracy
        educationLevelAtTest: assessment.user.currentEducationLevel 
      }, { transaction });

      // 6. Fetch Matching Occupations based on Code AND Education Level (1-5)
      const recommendations = await this.getRecommendations(
        hollandCode, 
        assessment.user.currentEducationLevel,
        transaction
      );

      await transaction.commit();

      return {
        scores: totals,
        hollandCode,
        recommendations
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Matches Holland Code against the Appendix data
   * Logic: Finds occupations with the same 3-letter code and matching education level.
   */
  async getRecommendations(code, eduLevel, transaction = null) {
    // 1. Validate education level exists
    const levelExists = await EducationLevel.findByPk(eduLevel, { transaction });
    if (!levelExists) {
      console.warn(`Warning: Education Level ${eduLevel} not found in master data.`);
      return [];
    }

    // 2. Perform the matching with level details for UI
    return await Occupation.findAll({
      where: {
        code,
        educationLevel: eduLevel
      },
      include: [{ model: EducationLevel, as: 'education' }],
      transaction
    });
  }
}

module.exports = new ScoringService();