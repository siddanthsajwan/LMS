const pool = require('../config/db');

const FINE_PER_DAY  = parseFloat(process.env.FINE_PER_DAY)  || 2;
const BORROW_DAYS   = parseInt(process.env.BORROW_DAYS)      || 14;

// ── BORROW A BOOK ─────────────────────────────────────────
const borrowBook = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { book_id } = req.body; // internal DB id of the book
    const user_id = req.user.id;

    if (!book_id) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'book_id is required.' });
    }

    // Lock the book row
    const [books] = await conn.query('SELECT * FROM books WHERE id = ? FOR UPDATE', [book_id]);
    if (books.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    const book = books[0];
    if (book.available_copies <= 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'No copies available right now.' });
    }

    // Check student doesn't already have this book
    const [activeBorrow] = await conn.query(
      "SELECT id FROM borrows WHERE user_id = ? AND book_id = ? AND status = 'active'",
      [user_id, book_id]
    );
    if (activeBorrow.length > 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'You already have this book borrowed.' });
    }

    // Calculate due date
    const due = new Date();
    due.setDate(due.getDate() + BORROW_DAYS);
    const due_date = due.toISOString().split('T')[0];

    // Insert borrow record
    const [result] = await conn.query(
      "INSERT INTO borrows (user_id, book_id, due_date, status) VALUES (?, ?, ?, 'active')",
      [user_id, book_id, due_date]
    );

    // Decrement available copies
    await conn.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      message: `Book borrowed! Due date: ${due_date}`,
      data: { borrow_id: result.insertId, due_date, book_title: book.title },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('borrowBook error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── RETURN A BOOK ─────────────────────────────────────────
const returnBook = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { id } = req.params; // borrow id
    const user_id = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [borrows] = await conn.query(
      'SELECT b.*, bk.title FROM borrows b JOIN books bk ON b.book_id = bk.id WHERE b.id = ?',
      [id]
    );
    if (borrows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Borrow record not found.' });
    }

    const borrow = borrows[0];

    // Students can only return their own borrows
    if (!isAdmin && borrow.user_id !== user_id) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ success: false, message: 'Unauthorised.' });
    }

    if (borrow.status === 'returned') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Book already returned.' });
    }

    // Calculate fine
    const today     = new Date();
    const dueDate   = new Date(borrow.due_date);
    const msPerDay  = 1000 * 60 * 60 * 24;
    const daysLate  = Math.floor((today - dueDate) / msPerDay);
    const fine      = daysLate > 0 ? daysLate * FINE_PER_DAY : 0;

    // Update borrow record
    await conn.query(
      "UPDATE borrows SET returned_at = NOW(), fine_amount = ?, status = 'returned' WHERE id = ?",
      [fine, id]
    );

    // Increment available copies
    await conn.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [borrow.book_id]
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: fine > 0
        ? `Book returned. Fine applied: ₹${fine.toFixed(2)} (${daysLate} day${daysLate > 1 ? 's' : ''} late)`
        : 'Book returned on time. No fine!',
      data: { fine_amount: fine, days_late: Math.max(0, daysLate), book_title: borrow.title },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('returnBook error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── MY BORROWS (Student) ──────────────────────────────────
const getMyBorrows = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.borrowed_at, b.due_date, b.returned_at, b.fine_amount, b.status,
              bk.id as book_db_id, bk.book_id, bk.title, bk.author, bk.genre
       FROM borrows b
       JOIN books bk ON b.book_id = bk.id
       WHERE b.user_id = ?
       ORDER BY b.borrowed_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMyBorrows error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── ALL BORROWS (Admin) ───────────────────────────────────
const getAllBorrows = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.id, b.borrowed_at, b.due_date, b.returned_at, b.fine_amount, b.status,
             u.id as user_db_id, u.name as student_name, u.email as student_email,
             bk.id as book_db_id, bk.book_id, bk.title, bk.author, bk.genre
      FROM borrows b
      JOIN users u  ON b.user_id  = u.id
      JOIN books bk ON b.book_id  = bk.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE b.status = ?';
      params.push(status);
    }
    query += ' ORDER BY b.borrowed_at DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllBorrows error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { borrowBook, returnBook, getMyBorrows, getAllBorrows };
