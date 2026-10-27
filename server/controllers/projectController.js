const Project = require('../models/Project');
const Note = require('../models/Note');
const File = require('../models/File');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });
    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard: all projects where user is owner or member
exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json({ ...project.toObject(), isOwner: req.isOwner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (!req.isOwner) return res.status(403).json({ message: 'Only the owner can edit the project' });
    const { name, description, readme } = req.body;
    if (name !== undefined) req.project.name = name;
    if (description !== undefined) req.project.description = description;
    if (readme !== undefined) req.project.readme = readme;
    await req.project.save();
    res.json(req.project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!req.isOwner) return res.status(403).json({ message: 'Only the owner can delete the project' });
    await Note.deleteMany({ project: req.project._id });
    await File.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Owner adds a registered user by email
exports.addMember = async (req, res) => {
  try {
    if (!req.isOwner) return res.status(403).json({ message: 'Only the owner can add members' });
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Member email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No registered user with that email' });
    if (user._id.equals(req.project.owner)) {
      return res.status(400).json({ message: 'Owner is already part of the project' });
    }
    if (req.project.members.some((m) => m.equals(user._id))) {
      return res.status(409).json({ message: 'User is already a member' });
    }
    req.project.members.push(user._id);
    await req.project.save();
    const populated = await Project.findById(req.project._id).populate('members', 'name email');
    res.json(populated.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    if (!req.isOwner) return res.status(403).json({ message: 'Only the owner can remove members' });
    req.project.members = req.project.members.filter((m) => m.toString() !== req.params.userId);
    await req.project.save();
    const populated = await Project.findById(req.project._id).populate('members', 'name email');
    res.json(populated.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Basic contribution analytics: notes created & files uploaded per member
exports.getAnalytics = async (req, res) => {
  try {
    const projectId = req.project._id;
    const [noteAgg, fileAgg] = await Promise.all([
      Note.aggregate([
        { $match: { project: projectId } },
        { $group: { _id: '$author', notes: { $sum: 1 } } },
      ]),
      File.aggregate([
        { $match: { project: projectId } },
        { $group: { _id: '$uploadedBy', files: { $sum: 1 } } },
      ]),
    ]);

    const ids = [req.project.owner, ...req.project.members];
    const users = await User.find({ _id: { $in: ids } }, 'name email');

    const rows = users.map((u) => ({
      userId: u._id,
      name: u.name,
      notes: noteAgg.find((n) => n._id.equals(u._id))?.notes || 0,
      files: fileAgg.find((f) => f._id.equals(u._id))?.files || 0,
    }));

    res.json({
      totalNotes: rows.reduce((s, r) => s + r.notes, 0),
      totalFiles: rows.reduce((s, r) => s + r.files, 0),
      contributors: rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Owner toggles public sharing; generates the unique link id once
exports.togglePublic = async (req, res) => {
  try {
    if (!req.isOwner) return res.status(403).json({ message: 'Only the owner can change sharing' });
    req.project.isPublic = !req.project.isPublic;
    if (req.project.isPublic && !req.project.publicId) req.project.generatePublicId();
    await req.project.save();
    res.json({ isPublic: req.project.isPublic, publicId: req.project.publicId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public read-only page (no auth)
exports.getPublicProject = async (req, res) => {
  try {
    const project = await Project.findOne({ publicId: req.params.publicId, isPublic: true })
      .populate('owner', 'name')
      .select('name description readme owner createdAt updatedAt');
    if (!project) return res.status(404).json({ message: 'Public project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
