import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('lms_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('lms_token'));

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('lms_token', data.token);
    localStorage.setItem('lms_user',  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('lms_token', data.token);
    localStorage.setItem('lms_user',  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin   = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
