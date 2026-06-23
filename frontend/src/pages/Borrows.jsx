import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Borrows = () => {
  const [borrows, setBorrows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('');

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const { data } = await api.get('/borrows', { params });
      setBorrows(data.data);
    } catch { toast.error('Failed to load borrows.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBorrows(); }, [filterStatus]);

  const handleReturn = async (borrow) => {
    if (!window.confirm(`Return "${borrow.title}" for ${borrow.student_name}?`)) return;
    try {
      const { data } = await api.post(`/borrows/${borrow.id}/return`);
      toast.success(data.message);
      fetchBorrows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
  };

  const totalFine = borrows.reduce((s, b) => s + parseFloat(b.fine_amount || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 All Borrows</h1>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          {totalFine > 0 && (
            <span style={{color:'var(--yellow)',fontWeight:700,fontSize:'14px'}}>
              💰 Total Fines: ₹{totalFine.toFixed(2)}
            </span>
          )}
          <span className="count-badge">{borrows.length} records</span>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <select className="filter-select" value={filterStatus} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="table-wrapper">
          {loading ? <div className="spinner" /> : borrows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No borrow records</h3>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Genre</th>
                  <th>Borrowed</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{fontWeight:500}}>{b.student_name}</div>
                      <div style={{color:'var(--text-muted)',fontSize:'12px'}}>{b.student_email}</div>
                    </td>
                    <td>
                      <div style={{fontWeight:500}}>{b.title}</div>
                      <code style={{color:'var(--accent2)',fontSize:'11px'}}>{b.book_id}</code>
                    </td>
                    <td><span className={`badge badge-${b.genre}`}>{b.genre}</span></td>
                    <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{new Date(b.borrowed_at).toLocaleDateString('en-IN')}</td>
                    <td style={{fontSize:'13px',color: b.status === 'overdue' ? 'var(--red)' : 'var(--text)'}}>
                      {new Date(b.due_date).toLocaleDateString('en-IN')}
                    </td>
                    <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                    <td>
                      {parseFloat(b.fine_amount) > 0
                        ? <span style={{color:'var(--red)',fontWeight:700}}>₹{parseFloat(b.fine_amount).toFixed(2)}</span>
                        : <span style={{color:'var(--text-muted)'}}>—</span>
                      }
                    </td>
                    <td>
                      {b.status === 'active' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleReturn(b)}>
                          🔄 Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Borrows;
