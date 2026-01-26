const { TestResult, User } = require('../models');
const logger = require('../utils/logger');

module.exports = {
  // Get test result
  getResult: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'RESULT_ACCESS',
        message: `Fetching test result for attempt ${req.params.attemptId}`,
        req,
        details: {
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      
      const result = await TestResult.findOne({
        where: { attemptId: req.params.attemptId },
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'email', 'role']
          }
        ]
      });

      if (!result) {
        logger.warn({
          actionType: 'RESULT_ACCESS_FAILED',
          message: `Test result not found: ${req.params.attemptId}`,
          req,
          details: {
            userId: req.user?.id,
            ipAddress: req.ip
          }
        });
        return res.status(404).json({
          status: 'error',
          message: 'Result not found'
        });
      }

      logger.info({
        actionType: 'RESULT_ACCESS',
        message: `Fetched test result: ${req.params.attemptId}`,
        req,
        details: {
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      
      res.status(200).json({
        status: 'success',
        data: { result }
      });
    } catch (error) {
      logger.error({
        actionType: 'RESULT_ACCESS_FAILED',
        message: `Failed to fetch test result ${req.params.attemptId}`,
        req,
        details: {
          error: error.message,
          stack: error.stack,
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      next(error);
    }
  },

  // Generate PDF report
  getReport: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'REPORT_ACCESS',
        message: `Generating PDF report for attempt ${req.params.attemptId}`,
        req,
        details: {
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      
      // TODO: Implement PDF generation
      res.status(200).json({
        status: 'success',
        message: 'PDF report endpoint'
      });
    } catch (error) {
      logger.error({
        actionType: 'REPORT_ACCESS_FAILED',
        message: `Failed to generate PDF report ${req.params.attemptId}`,
        req,
        details: {
          error: error.message,
          stack: error.stack,
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      next(error);
    }
  },

  // Get career recommendations
  getRecommendations: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'RECOMMENDATION_ACCESS',
        message: `Fetching recommendations for attempt ${req.params.attemptId}`,
        req,
        details: {
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      
      const result = await TestResult.findByPk(req.params.attemptId, {
        include: ['occupationRecommendations']
      });

      if (!result) {
        logger.warn({
          actionType: 'RECOMMENDATION_ACCESS_FAILED',
          message: `Result not found for recommendations: ${req.params.attemptId}`,
          req,
          details: {
            userId: req.user?.id,
            ipAddress: req.ip
          }
        });
        return res.status(404).json({
          status: 'error',
          message: 'Result not found'
        });
      }

      logger.info({
        actionType: 'RECOMMENDATION_ACCESS',
        message: `Fetched ${result.occupationRecommendations?.length || 0} recommendations`,
        req,
        details: {
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          recommendations: result.occupationRecommendations
        }
      });
    } catch (error) {
      logger.error({
        actionType: 'RECOMMENDATION_ACCESS_FAILED',
        message: `Failed to fetch recommendations ${req.params.attemptId}`,
        req,
        details: {
          error: error.message,
          stack: error.stack,
          userId: req.user?.id,
          ipAddress: req.ip
        }
      });
      next(error);
    }
  }
};
