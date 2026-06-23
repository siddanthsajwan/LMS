require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes      = require('./src/routes/auth.routes');
const bookRoutes      = require('./src/routes/book.routes');
const borrowRoutes    = require('./src/routes/borrow.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LibraryOS API is running 🚀' });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/books',     bookRoutes);
app.use('/api/borrows',   borrowRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 LibraryOS API running on http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
});
