import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6c63ff','#10d9a0','#fb923c','#60a5fa','#94a3b8'];

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!stats)  return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Admin Dashboard</h1>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="📚" label="Total Books"     value={stats.totalBooks}    colorClass="c-total" />
        <StatCard icon="👥" label="Students"        value={stats.totalStudents} colorClass="c-students" />
        <StatCard icon="📤" label="Active Borrows"  value={stats.activeBorrows} colorClass="c-borrowed" />
        <StatCard icon="⚠️" label="Overdue"         value={stats.overdueCount}  colorClass="c-overdue" />
        <StatCard icon="💰" label="Total Fines (₹)" value={`₹${stats.totalFines}`} colorClass="c-fines" />
        <StatCard icon="✅" label="Returned"        value={stats.returnedCount} colorClass="c-total" />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px'}}>
        {/* Genre Chart */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📈 Books by Genre</span>
          </div>
          <div className="panel-body" style={{height:'260px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.genreData} dataKey="count" nameKey="genre" cx="50%" cy="50%" outerRadius={90} label={({genre,percent})=>`${genre} ${(percent*100).toFixed(0)}%`}>
                  {stats.genreData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:'#22263a',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:'#e2e8f0'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Borrows */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">🕐 Recent Borrows</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBorrows.map(b => (
                  <tr key={b.id}>
                    <td style={{fontWeight:500}}>{b.student_name}</td>
                    <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{b.title}</td>
                    <td><span className={`status-badge status-${b.status}`}>{b.status}</span></td>
                    <td style={{color:'var(--text-muted)',fontSize:'12px'}}>
                      {new Date(b.due_date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
