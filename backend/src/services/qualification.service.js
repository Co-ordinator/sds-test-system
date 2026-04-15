'use strict';

const path = require('path');
const fs = require('fs');
const { UserQualification } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/errors/appError');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/qualifications');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

module.exports = {

  listQualifications: async (userId) => {
    return await UserQualification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['filePath'] }
    });
  },

  uploadQualification: async (userId, file, { title, documentType, issuedBy, issueDate }) => {
    if (!file) throw new BadRequestError('No file uploaded', 'FILE_REQUIRED');
    if (!title || !title.trim()) {
      fs.unlink(file.path, () => {});
      throw new BadRequestError('Title is required', 'TITLE_REQUIRED');
    }

    const qualification = await UserQualification.create({
      userId,
      title: title.trim(),
      documentType: documentType || 'certificate',
      issuedBy: issuedBy ? issuedBy.trim() : null,
      issueDate: issueDate || null,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    return {
      id: qualification.id,
      title: qualification.title,
      documentType: qualification.documentType,
      issuedBy: qualification.issuedBy,
      issueDate: qualification.issueDate,
      fileName: qualification.fileName,
      fileSize: qualification.fileSize,
      mimeType: qualification.mimeType,
      createdAt: qualification.createdAt
    };
  },

  getQualificationFile: async (qualificationId, userId) => {
    const qualification = await UserQualification.findOne({
      where: { id: qualificationId, userId }
    });

    if (!qualification) throw new NotFoundError('Qualification not found', 'QUALIFICATION_NOT_FOUND');
    if (!fs.existsSync(qualification.filePath)) throw new NotFoundError('File not found on server', 'FILE_NOT_FOUND');

    return {
      filePath: qualification.filePath,
      mimeType: qualification.mimeType,
      fileName: qualification.fileName,
      fileSize: qualification.fileSize
    };
  },

  deleteQualification: async (qualificationId, userId) => {
    const qualification = await UserQualification.findOne({
      where: { id: qualificationId, userId }
    });

    if (!qualification) throw new NotFoundError('Qualification not found', 'QUALIFICATION_NOT_FOUND');

    if (fs.existsSync(qualification.filePath)) {
      fs.unlinkSync(qualification.filePath);
    }

    await qualification.destroy();
    return qualification;
  }
};
