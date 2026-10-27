const router = require('express').Router();
const c = require('../controllers/geminiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/explain', c.explain);
router.post('/docs', c.docs);
router.post('/readme', c.readme);

module.exports = router;
