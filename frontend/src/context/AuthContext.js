import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wms_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('wms_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.me();
      setUser(res.user);
      localStorage.setItem('wms_user', JSON.stringify(res.user));
    } catch {
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('wms_token', res.token);
    localStorage.setItem('wms_user', JSON.stringify(res.user));
    setUser(res.user);
    toast.success(`Welcome back, ${res.user.name}!`);
    return res;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const hasPermission = (perm) => user?.permissions?.includes(perm);
  const isAdmin = () => user?.role === 'admin';
  const isManager = () => ['admin', 'manager'].includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe, hasRole, hasPermission, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
