const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ project: req.project._id })
      .populate('author', 'name')
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ message: 'Note title is required' });
    const note = await Note.create({
      project: req.project._id,
      author: req.user._id,
      title,
      content: content || '',
    });
    req.project.updatedAt = new Date();
    await req.project.save();
    res.status(201).json(await note.populate('author', 'name'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, project: req.project._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.content !== undefined) note.content = req.body.content;
    await note.save();
    res.json(await note.populate('author', 'name'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Author or project owner can delete
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, project: req.project._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!req.isOwner && !note.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the author or project owner can delete this note' });
    }
    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
