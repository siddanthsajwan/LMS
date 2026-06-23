import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LayoutDashboard, BookMarked, LogOut, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to={isAdmin ? '/dashboard' : '/books'} className="navbar-brand">
        <div className="navbar-logo">📚</div>
        <div>
          <div className="navbar-title">LibraryOS</div>
          <div className="navbar-sub">Smart Library</div>
        </div>
      </Link>

      <div className="navbar-links">
        {isAdmin && (
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        )}
        <Link to="/books" className={`nav-link ${isActive('/books')}`}>
          <BookOpen size={16} />
          Books
        </Link>
        {isAdmin && (
          <Link to="/borrows" className={`nav-link ${isActive('/borrows')}`}>
            <BookMarked size={16} />
            All Borrows
          </Link>
        )}
        {!isAdmin && (
          <Link to="/my-books" className={`nav-link ${isActive('/my-books')}`}>
            <BookMarked size={16} />
            My Books
          </Link>
        )}
      </div>

      <div className="navbar-user">
        <div className="user-pill">
          <User size={14} />
          <span>{user?.name}</span>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
