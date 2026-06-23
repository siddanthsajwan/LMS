import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute, RoleRoute } from './components/PrivateRoute';
import Navbar   from './components/Navbar';
import Login    from './pages/Login';
import Register from './pages/Register';
import Books    from './pages/Books';
import MyBooks  from './pages/MyBooks';
import Borrows  from './pages/Borrows';
import Dashboard from './pages/Dashboard';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login"    element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/books'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/books" /> : <Register />} />

        {/* Shared */}
        <Route path="/books" element={<PrivateRoute><Books /></PrivateRoute>} />

        {/* Student only */}
        <Route path="/my-books" element={<PrivateRoute><RoleRoute role="student"><MyBooks /></RoleRoute></PrivateRoute>} />

        {/* Admin only */}
        <Route path="/dashboard" element={<PrivateRoute><RoleRoute role="admin"><Dashboard /></RoleRoute></PrivateRoute>} />
        <Route path="/borrows"   element={<PrivateRoute><RoleRoute role="admin"><Borrows /></RoleRoute></PrivateRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/dashboard' : '/books') : '/login'} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#22263a',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10d9a0', secondary: '#22263a' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#22263a' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
