const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const c = require('../controllers/fileController');

fs.mkdirSync(c.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, c.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const BLOCKED_EXT = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.scr'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXT.includes(ext)) return cb(new Error('This file type is not allowed'));
    cb(null, true);
  },
});

router.route('/').get(c.getFiles).post(upload.single('file'), c.uploadFile);
router.get('/:fileId/raw', c.serveFile);
router.get('/:fileId/text', c.getFileText);
router.delete('/:fileId', c.deleteFile);

module.exports = router;
