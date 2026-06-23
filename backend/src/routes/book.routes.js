const router      = require('express').Router();
const { getBooks, addBook, updateBook, deleteBook } = require('../controllers/bookController');
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/',     auth,                        getBooks);
router.post('/',    auth, requireRole('admin'),  addBook);
router.put('/:id',  auth, requireRole('admin'),  updateBook);
router.delete('/:id', auth, requireRole('admin'), deleteBook);

module.exports = router;
