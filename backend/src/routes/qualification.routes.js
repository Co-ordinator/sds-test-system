const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/authentication.middleware');
const {
  listQualifications,
  uploadQualification,
  downloadQualification,
  deleteQualification
} = require('../controllers/qualification.controller');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads/qualifications');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG or WebP files are allowed'));
    }
  }
});

// All routes require authentication
router.use(verifyToken);

router.get('/', listQualifications);
router.post('/', upload.single('file'), uploadQualification);
router.get('/:id/file', downloadQualification);
router.delete('/:id', deleteQualification);

// Handle multer errors
router.use((err, _req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'File too large. Maximum size is 5 MB.' });
  }
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
  next(err);
});

module.exports = router;
