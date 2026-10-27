const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const config = require('../config');

// Verifies the JWT and attaches req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }
    const decoded = jwt.verify(header.split(' ')[1], config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Loads project from :projectId and ensures the user is owner or member
const projectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const uid = req.user._id.toString();
    const isOwner = project.owner.toString() === uid;
    const isMember = project.members.some((m) => m.toString() === uid);
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    req.project = project;
    req.isOwner = isOwner;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
};

module.exports = { protect, projectMember };
