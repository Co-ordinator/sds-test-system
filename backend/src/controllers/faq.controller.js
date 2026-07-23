const faqService = require('../services/faq.service');
const logger = require('../utils/logger');

const listPublishedFaqs = async (req, res, next) => {
  try {
    const faqs = await faqService.listPublished();
    res.status(200).json({ status: 'success', data: { faqs } });
  } catch (error) {
    next(error);
  }
};

const listAllFaqs = async (req, res, next) => {
  try {
    const faqs = await faqService.listAll();
    res.status(200).json({ status: 'success', data: { faqs } });
  } catch (error) {
    next(error);
  }
};

const createFaq = async (req, res, next) => {
  try {
    const faq = await faqService.createFaq(req.body, req.user.id);
    logger.info({ actionType: 'ADMIN_ACTION', message: `FAQ created: ${faq.id}`, req, details: { faqId: faq.id } });
    res.status(201).json({ status: 'success', data: { faq } });
  } catch (error) {
    next(error);
  }
};

const updateFaq = async (req, res, next) => {
  try {
    const faq = await faqService.updateFaq(req.params.id, req.body);
    logger.info({ actionType: 'ADMIN_ACTION', message: `FAQ updated: ${faq.id}`, req, details: { faqId: faq.id } });
    res.status(200).json({ status: 'success', data: { faq } });
  } catch (error) {
    next(error);
  }
};

const deleteFaq = async (req, res, next) => {
  try {
    await faqService.deleteFaq(req.params.id);
    logger.info({ actionType: 'ADMIN_ACTION', message: `FAQ deleted: ${req.params.id}`, req, details: { faqId: req.params.id } });
    res.status(200).json({ status: 'success', message: 'FAQ deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listPublishedFaqs, listAllFaqs, createFaq, updateFaq, deleteFaq };
