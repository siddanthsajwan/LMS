const pool = require('../config/db');

const getStats = async (req, res) => {
  try {
    const [[totalBooks]]     = await pool.query('SELECT COUNT(*) as count FROM books');
    const [[totalUsers]]     = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [[activeborrows]]  = await pool.query("SELECT COUNT(*) as count FROM borrows WHERE status = 'active'");
    const [[overdueCount]]   = await pool.query(
      "SELECT COUNT(*) as count FROM borrows WHERE status = 'active' AND due_date < CURDATE()"
    );
    const [[totalFines]]     = await pool.query(
      "SELECT COALESCE(SUM(fine_amount), 0) as total FROM borrows WHERE status = 'returned'"
    );
    const [[returnedCount]]  = await pool.query("SELECT COUNT(*) as count FROM borrows WHERE status = 'returned'");

    // Genre distribution for chart
    const [genreData] = await pool.query(
      'SELECT genre, COUNT(*) as count FROM books GROUP BY genre ORDER BY count DESC'
    );

    // Recent borrows (last 7)
    const [recentBorrows] = await pool.query(
      `SELECT b.id, b.borrowed_at, b.due_date, b.status,
              u.name as student_name, bk.title
       FROM borrows b
       JOIN users u  ON b.user_id  = u.id
       JOIN books bk ON b.book_id  = bk.id
       ORDER BY b.borrowed_at DESC LIMIT 7`
    );

    res.json({
      success: true,
      data: {
        totalBooks:    totalBooks.count,
        totalStudents: totalUsers.count,
        activeBorrows: activeborrows.count,
        overdueCount:  overdueCount.count,
        totalFines:    parseFloat(totalFines.total).toFixed(2),
        returnedCount: returnedCount.count,
        genreData,
        recentBorrows,
      },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getStats };
