const router = require('express').Router({ mergeParams: true });
const c = require('../controllers/notesController');

router.route('/').get(c.getNotes).post(c.createNote);
router.route('/:noteId').put(c.updateNote).delete(c.deleteNote);

module.exports = router;
