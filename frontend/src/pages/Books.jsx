import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GENRES = ['Fiction', 'Science', 'History', 'Tech', 'Other'];

const Books = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editBook, setEditBook]     = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);
  const [form, setForm]             = useState({ book_id:'', title:'', author:'', genre:'Fiction', total_copies:1 });
  const [submitting, setSubmitting] = useState(false);

  const fetchBooks = async () => {
    try {
      const params = {};
      if (search)      params.search = search;
      if (filterGenre) params.genre  = filterGenre;
      const { data } = await api.get('/books', { params });
      setBooks(data.data);
    } catch { toast.error('Failed to load books.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, [search, filterGenre]);

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAdd = () => {
    setEditBook(null);
    setForm({ book_id:'', title:'', author:'', genre:'Fiction', total_copies:1 });
    setShowForm(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({ book_id: book.book_id, title: book.title, author: book.author, genre: book.genre, total_copies: book.total_copies });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editBook) {
        await api.put(`/books/${editBook.id}`, form);
        toast.success('Book updated!');
      } else {
        await api.post('/books', form);
        toast.success('Book added!');
      }
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try {
      await api.delete(`/books/${book.id}`);
      toast.success('Book deleted!');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleBorrow = async () => {
    if (!borrowModal) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/borrows', { book_id: borrowModal.id });
      toast.success(data.message);
      setBorrowModal(null);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Borrow failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📚 Library Books</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openAdd}>＋ Add Book</button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && isAdmin && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{editBook ? '✏️ Edit Book' : '＋ New Book'}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Book ID</label>
                  <input className="form-input" name="book_id" value={form.book_id} onChange={handleFormChange} placeholder="BK-001" required disabled={!!editBook} />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" name="title" value={form.title} onChange={handleFormChange} placeholder="Book Title" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Author</label>
                  <input className="form-input" name="author" value={form.author} onChange={handleFormChange} placeholder="Author Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Genre</label>
                  <select className="form-select" name="genre" value={form.genre} onChange={handleFormChange}>
                    {GENRES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Copies</label>
                  <input className="form-input" type="number" name="total_copies" value={form.total_copies} onChange={handleFormChange} min="1" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editBook ? '💾 Update' : '＋ Add Book'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Table */}
      <div className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={15} />
            <input
              placeholder="Search by title, author, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
            <option value="">All Genres</option>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
          <span className="count-badge">{books.length} books</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="spinner" />
          ) : books.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No books found</h3>
              <p>Try a different search or add a new book.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Book ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Copies</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.id}>
                    <td><code style={{color:'var(--accent2)',fontSize:'12px'}}>{book.book_id}</code></td>
                    <td><strong>{book.title}</strong></td>
                    <td style={{color:'var(--text-muted)'}}>{book.author}</td>
                    <td><span className={`badge badge-${book.genre}`}>{book.genre}</span></td>
                    <td>{book.total_copies}</td>
                    <td>
                      <span className={`status-badge ${book.available_copies > 0 ? 'status-active' : 'status-overdue'}`}>
                        {book.available_copies > 0 ? `${book.available_copies} available` : 'Unavailable'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {isAdmin ? (
                          <>
                            <button className="icon-btn edit" onClick={() => openEdit(book)} title="Edit">✏️</button>
                            <button className="icon-btn del"  onClick={() => handleDelete(book)} title="Delete">🗑️</button>
                          </>
                        ) : (
                          <button
                            className="icon-btn borrow"
                            onClick={() => book.available_copies > 0 && setBorrowModal(book)}
                            title={book.available_copies > 0 ? 'Borrow' : 'Unavailable'}
                            disabled={book.available_copies === 0}
                          >
                            📖
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Borrow Modal */}
      {borrowModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setBorrowModal(null)}>
          <div className="modal">
            <div className="modal-title">📖 Borrow Book</div>
            <p style={{color:'var(--text-muted)',fontSize:'14px',marginBottom:'12px'}}>
              You are about to borrow:
            </p>
            <div style={{background:'var(--surface2)',borderRadius:'10px',padding:'16px',marginBottom:'4px'}}>
              <strong>{borrowModal.title}</strong>
              <p style={{color:'var(--text-muted)',fontSize:'13px',marginTop:'4px'}}>by {borrowModal.author}</p>
            </div>
            <p style={{color:'var(--text-muted)',fontSize:'13px',marginTop:'12px'}}>
              📅 Due date: <strong style={{color:'var(--accent2)'}}>14 days from today</strong>
            </p>
            <p style={{color:'var(--yellow)',fontSize:'12px',marginTop:'6px'}}>
              ⚠️ Fine: ₹2 per day if returned late
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setBorrowModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={handleBorrow} disabled={submitting}>
                {submitting ? 'Borrowing...' : '✅ Confirm Borrow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
