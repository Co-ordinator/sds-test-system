const path = require('path');
const fs = require('fs');
const { UserQualification } = require('../models');
const logger = require('../utils/logger');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/qualifications');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// GET /api/v1/qualifications — list current user's qualifications
const listQualifications = async (req, res, next) => {
  try {
    const qualifications = await UserQualification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['filePath'] }
    });
    res.status(200).json({ status: 'success', data: { qualifications } });
  } catch (error) {
    logger.error({ actionType: 'QUALIFICATION_LIST_FAILED', message: 'Failed to list qualifications', req, details: { error: error.message } });
    next(error);
  }
};

// POST /api/v1/qualifications — upload a qualification document
const uploadQualification = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const { title, documentType, issuedBy, issueDate } = req.body;

    if (!title || !title.trim()) {
      // Remove uploaded file if validation fails
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }

    const qualification = await UserQualification.create({
      userId: req.user.id,
      title: title.trim(),
      documentType: documentType || 'certificate',
      issuedBy: issuedBy ? issuedBy.trim() : null,
      issueDate: issueDate || null,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    logger.info({
      actionType: 'QUALIFICATION_UPLOAD',
      message: `Qualification uploaded by user ${req.user.id}`,
      req,
      details: { qualificationId: qualification.id, title: qualification.title }
    });

    res.status(201).json({
      status: 'success',
      data: {
        qualification: {
          id: qualification.id,
          title: qualification.title,
          documentType: qualification.documentType,
          issuedBy: qualification.issuedBy,
          issueDate: qualification.issueDate,
          fileName: qualification.fileName,
          fileSize: qualification.fileSize,
          mimeType: qualification.mimeType,
          createdAt: qualification.createdAt
        }
      }
    });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    logger.error({ actionType: 'QUALIFICATION_UPLOAD_FAILED', message: 'Failed to upload qualification', req, details: { error: error.message } });
    next(error);
  }
};

// GET /api/v1/qualifications/:id/file — stream/download the actual file
const downloadQualification = async (req, res, next) => {
  try {
    const qualification = await UserQualification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!qualification) {
      return res.status(404).json({ status: 'error', message: 'Qualification not found' });
    }

    if (!fs.existsSync(qualification.filePath)) {
      return res.status(404).json({ status: 'error', message: 'File not found on server' });
    }

    res.setHeader('Content-Type', qualification.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(qualification.fileName)}"`
    );
    res.setHeader('Content-Length', qualification.fileSize);

    const stream = fs.createReadStream(qualification.filePath);
    stream.pipe(res);
  } catch (error) {
    logger.error({ actionType: 'QUALIFICATION_DOWNLOAD_FAILED', message: 'Failed to serve qualification file', req, details: { error: error.message } });
    next(error);
  }
};

// DELETE /api/v1/qualifications/:id — delete a qualification
const deleteQualification = async (req, res, next) => {
  try {
    const qualification = await UserQualification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!qualification) {
      return res.status(404).json({ status: 'error', message: 'Qualification not found' });
    }

    // Remove file from disk
    if (fs.existsSync(qualification.filePath)) {
      fs.unlinkSync(qualification.filePath);
    }

    await qualification.destroy();

    logger.info({
      actionType: 'QUALIFICATION_DELETE',
      message: `Qualification deleted by user ${req.user.id}`,
      req,
      details: { qualificationId: req.params.id }
    });

    res.status(200).json({ status: 'success', message: 'Qualification deleted' });
  } catch (error) {
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
