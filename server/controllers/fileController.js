const path = require('path');
const fs = require('fs');
const File = require('../models/File');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

exports.UPLOAD_DIR = UPLOAD_DIR;

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const doc = await File.create({
      project: req.project._id,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    res.status(201).json(await doc.populate('uploadedBy', 'name'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ project: req.project._id })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Streams the file (auth protected). Used for image preview and download.
exports.serveFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, project: req.project._id });
    if (!file) return res.status(404).json({ message: 'File not found' });
    const full = path.join(UPLOAD_DIR, path.basename(file.storedName));
    if (!fs.existsSync(full)) return res.status(404).json({ message: 'File missing on server' });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    res.sendFile(full);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Returns text content for text/code files (for preview + "Explain this code")
exports.getFileText = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, project: req.project._id });
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.size > 200 * 1024) {
      return res.status(413).json({ message: 'File too large for text preview (max 200KB)' });
    }
    const full = path.join(UPLOAD_DIR, path.basename(file.storedName));
    const text = await fs.promises.readFile(full, 'utf8');
    res.json({ name: file.originalName, text });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, project: req.project._id });
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (!req.isOwner && !file.uploadedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the uploader or project owner can delete this file' });
    }
    const full = path.join(UPLOAD_DIR, path.basename(file.storedName));
    fs.promises.unlink(full).catch(() => {});
    await file.deleteOne();
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
