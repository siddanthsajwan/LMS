const router      = require('express').Router();
const { getStats } = require('../controllers/dashboardController');
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/stats', auth, requireRole('admin'), getStats);

module.exports = router;
