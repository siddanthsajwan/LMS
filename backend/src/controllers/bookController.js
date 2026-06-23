const pool = require('../config/db');

// ── GET ALL BOOKS ─────────────────────────────────────────
const getBooks = async (req, res) => {
  try {
    const { search, genre, status } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ? OR book_id LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (genre) {
      query += ' AND genre = ?';
      params.push(genre);
    }
    if (status === 'Available') {
      query += ' AND available_copies > 0';
    } else if (status === 'Unavailable') {
      query += ' AND available_copies = 0';
    }

    query += ' ORDER BY created_at DESC';
    const [books] = await pool.query(query, params);
    res.json({ success: true, data: books });
  } catch (err) {
    console.error('getBooks error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── ADD BOOK (Admin) ──────────────────────────────────────
const addBook = async (req, res) => {
  try {
    const { book_id, title, author, genre, total_copies } = req.body;

    if (!book_id || !title) {
      return res.status(400).json({ success: false, message: 'book_id and title are required.' });
    }

    const copies = parseInt(total_copies) || 1;
    const [result] = await pool.query(
      'INSERT INTO books (book_id, title, author, genre, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?)',
      [book_id, title, author || 'Unknown', genre || 'Other', copies, copies]
    );

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Book added successfully!', data: rows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'A book with this ID already exists.' });
    }
    console.error('addBook error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── UPDATE BOOK (Admin) ───────────────────────────────────
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, genre, total_copies } = req.body;

    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const book = existing[0];
    const newTotal = parseInt(total_copies) || book.total_copies;
    const borrowed = book.total_copies - book.available_copies;
    const newAvailable = Math.max(0, newTotal - borrowed);

    await pool.query(
      'UPDATE books SET title=?, author=?, genre=?, total_copies=?, available_copies=? WHERE id=?',
      [
        title  || book.title,
        author || book.author,
        genre  || book.genre,
        newTotal,
        newAvailable,
        id,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    res.json({ success: true, message: 'Book updated successfully!', data: updated[0] });
  } catch (err) {
    console.error('updateBook error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE BOOK (Admin) ───────────────────────────────────
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting if copies are currently borrowed
    const [borrows] = await pool.query(
      "SELECT id FROM borrows WHERE book_id = ? AND status = 'active'",
      [id]
    );
    if (borrows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book — it has active borrows.',
      });
    }

    const [result] = await pool.query('DELETE FROM books WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    res.json({ success: true, message: 'Book deleted successfully!' });
  } catch (err) {
    console.error('deleteBook error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getBooks, addBook, updateBook, deleteBook };
