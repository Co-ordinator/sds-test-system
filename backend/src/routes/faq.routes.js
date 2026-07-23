const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authentication.middleware');
const {
  listPublishedFaqs,
  listAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq
} = require('../controllers/faq.controller');

const router = express.Router();

router.get('/', listPublishedFaqs);
router.get('/all', verifyToken, restrictTo('System Administrator'), listAllFaqs);
router.post('/', verifyToken, restrictTo('System Administrator'), createFaq);
router.patch('/:id', verifyToken, restrictTo('System Administrator'), updateFaq);
router.delete('/:id', verifyToken, restrictTo('System Administrator'), deleteFaq);

module.exports = router;
