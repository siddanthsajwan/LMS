import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MyBooks = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [returnResult, setReturnResult] = useState(null);

  const fetchBorrows = async () => {
    try {
      const { data } = await api.get('/borrows/my');
      setBorrows(data.data);
    } catch { toast.error('Failed to load your books.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBorrows(); }, []);

  const handleReturn = async () => {
    if (!returning) return;
    try {
      const { data } = await api.post(`/borrows/${returning.id}/return`);
      setReturnResult({ message: data.message, fine: data.data.fine_amount, title: data.data.book_title });
      setReturning(null);
      fetchBorrows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  const active   = borrows.filter(b => b.status === 'active');
  const history  = borrows.filter(b => b.status !== 'active');

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📖 My Borrowed Books</h1>
        <span className="count-badge">{active.length} active</span>
      </div>

      {/* Active Borrows */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">📤 Currently Borrowed</span>
        </div>
        <div className="table-wrapper">
          {loading ? <div className="spinner" /> : active.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No active borrows</h3>
              <p>Go to Books to borrow something!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {active.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td style={{color:'var(--text-muted)'}}>{b.author}</td>
                    <td><span className={`badge badge-${b.genre}`}>{b.genre}</span></td>
                    <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{new Date(b.borrowed_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span style={{color: isOverdue(b.due_date) ? 'var(--red)' : 'var(--green)', fontWeight:600, fontSize:'13px'}}>
                        {new Date(b.due_date).toLocaleDateString('en-IN')}
                        {isOverdue(b.due_date) && ' ⚠️'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${isOverdue(b.due_date) ? 'status-overdue' : 'status-active'}`}>
                        {isOverdue(b.due_date) ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => setReturning(b)}>
                        🔄 Return
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📋 Borrow History</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrowed</th>
                  <th>Returned</th>
                  <th>Fine Paid</th>
                </tr>
              </thead>
              <tbody>
                {history.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.title}</strong></td>
                    <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{new Date(b.borrowed_at).toLocaleDateString('en-IN')}</td>
                    <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{b.returned_at ? new Date(b.returned_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      {parseFloat(b.fine_amount) > 0
                        ? <span style={{color:'var(--red)',fontWeight:600}}>₹{parseFloat(b.fine_amount).toFixed(2)}</span>
                        : <span style={{color:'var(--green)'}}>No fine ✅</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Confirm Modal */}
      {returning && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setReturning(null)}>
          <div className="modal">
            <div className="modal-title">🔄 Return Book</div>
            <div style={{background:'var(--surface2)',borderRadius:'10px',padding:'16px',marginBottom:'12px'}}>
              <strong>{returning.title}</strong>
              <p style={{color:'var(--text-muted)',fontSize:'13px',marginTop:'4px'}}>by {returning.author}</p>
            </div>
            {isOverdue(returning.due_date) && (
              <p style={{color:'var(--red)',fontSize:'13px',marginBottom:'8px'}}>
                ⚠️ This book is overdue! A fine of ₹2/day will be calculated.
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setReturning(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReturn}>✅ Confirm Return</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Result Modal */}
      {returnResult && (
        <div className="modal-overlay" onClick={() => setReturnResult(null)}>
          <div className="modal" style={{textAlign:'center'}}>
            <div style={{fontSize:'52px',marginBottom:'16px'}}>
              {parseFloat(returnResult.fine) > 0 ? '💰' : '🎉'}
            </div>
            <div className="modal-title">Book Returned!</div>
            <p style={{color:'var(--text-muted)',marginBottom:'12px',fontSize:'14px'}}>{returnResult.message}</p>
            {parseFloat(returnResult.fine) > 0 && (
              <div style={{background:'rgba(248,113,113,0.1)',border:'1px solid rgba(248,113,113,0.25)',borderRadius:'10px',padding:'12px',marginBottom:'12px'}}>
                <span style={{color:'var(--red)',fontWeight:700,fontSize:'20px'}}>Fine: ₹{parseFloat(returnResult.fine).toFixed(2)}</span>
              </div>
            )}
            <button className="btn btn-primary w-full" onClick={() => setReturnResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBooks;
