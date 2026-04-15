const fs = require('fs');
const qualificationService = require('../services/qualification.service');
const logger = require('../utils/logger');

const listQualifications = async (req, res, next) => {
  try {
    const qualifications = await qualificationService.listQualifications(req.user.id);
    res.status(200).json({ status: 'success', data: { qualifications } });
  } catch (error) {
    logger.error({ actionType: 'QUALIFICATION_LIST_FAILED', message: 'Failed to list qualifications', req, details: { error: error.message } });
    next(error);
  }
};

const uploadQualification = async (req, res, next) => {
  try {
    const qualification = await qualificationService.uploadQualification(req.user.id, req.file, req.body);
    logger.info({ actionType: 'QUALIFICATION_UPLOAD', message: `Qualification uploaded by user ${req.user.id}`, req, details: { qualificationId: qualification.id, title: qualification.title } });
    res.status(201).json({ status: 'success', data: { qualification } });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    if (error.code === 'FILE_REQUIRED' || error.code === 'TITLE_REQUIRED') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    logger.error({ actionType: 'QUALIFICATION_UPLOAD_FAILED', message: 'Failed to upload qualification', req, details: { error: error.message } });
    next(error);
  }
};

const downloadQualification = async (req, res, next) => {
  try {
    const file = await qualificationService.getQualificationFile(req.params.id, req.user.id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Content-Length', file.fileSize);
    const stream = fs.createReadStream(file.filePath);
    stream.pipe(res);
  } catch (error) {
    if (error.code === 'QUALIFICATION_NOT_FOUND' || error.code === 'FILE_NOT_FOUND') {
      return res.status(404).json({ status: 'error', message: error.message });
    }
    logger.error({ actionType: 'QUALIFICATION_DOWNLOAD_FAILED', message: 'Failed to serve qualification file', req, details: { error: error.message } });
    next(error);
  }
};

const deleteQualification = async (req, res, next) => {
  try {
    await qualificationService.deleteQualification(req.params.id, req.user.id);
    logger.info({ actionType: 'QUALIFICATION_DELETE', message: `Qualification deleted by user ${req.user.id}`, req, details: { qualificationId: req.params.id } });
    res.status(200).json({ status: 'success', message: 'Qualification deleted' });
  } catch (error) {
    if (error.code === 'QUALIFICATION_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
    logger.error({ actionType: 'QUALIFICATION_DELETE_FAILED', message: 'Failed to delete qualification', req, details: { error: error.message } });
    next(error);
  }
};

module.exports = {
  listQualifications,
  uploadQualification,
  downloadQualification,
  deleteQualification
};
