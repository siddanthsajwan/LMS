const router      = require('express').Router();
const { borrowBook, returnBook, getMyBorrows, getAllBorrows } = require('../controllers/borrowController');
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.post('/',            auth, requireRole('student','admin'), borrowBook);
router.post('/:id/return',  auth, returnBook);
router.get('/my',           auth, getMyBorrows);
router.get('/',             auth, requireRole('admin'), getAllBorrows);

module.exports = router;
