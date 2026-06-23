import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects to /login if not authenticated
export const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Redirects to /books if wrong role
export const RoleRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/books" replace />;
  return children;
};
