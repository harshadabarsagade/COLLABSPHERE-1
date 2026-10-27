const router = require('express').Router();
const c = require('../controllers/projectController');
const { protect, projectMember } = require('../middleware/authMiddleware');
const notesRoutes = require('./notesRoutes');
const fileRoutes = require('./fileRoutes');

// Public, read-only (no auth) - must come before /:projectId
router.get('/public/:publicId', c.getPublicProject);

router.use(protect);

router.route('/').get(c.getMyProjects).post(c.createProject);

router
  .route('/:projectId')
  .get(projectMember, c.getProject)
  .put(projectMember, c.updateProject)
  .delete(projectMember, c.deleteProject);

router.post('/:projectId/members', projectMember, c.addMember);
router.delete('/:projectId/members/:userId', projectMember, c.removeMember);
router.get('/:projectId/analytics', projectMember, c.getAnalytics);
router.post('/:projectId/share', projectMember, c.togglePublic);

// Nested resources
router.use('/:projectId/notes', projectMember, notesRoutes);
router.use('/:projectId/files', projectMember, fileRoutes);

module.exports = router;
