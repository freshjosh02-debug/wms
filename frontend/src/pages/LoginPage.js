import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CubeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@wms.com', password: 'admin123' },
      manager: { email: 'manager@wms.com', password: 'manager123' },
      staff: { email: 'staff@wms.com', password: 'staff123' },
    };
    setForm(creds[role]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/30 to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
         <div className="inline-flex w-24 h-24 rounded-2xl items-center justify-center mb-4 overflow-hidden">
  <img src="/logo.png" alt="WareNova Group" className="w-full h-full object-contain" />
</div>
<h1 className="font-display text-3xl font-bold text-surface-900 dark:text-white">WareNova Group</h1>
<p className="text-surface-500 mt-2 text-sm">Smarter Warehouses. Stronger Supply Chains.</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl">
          <h2 className="text-xl font-display font-semibold text-surface-900 dark:text-surface-50 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-surface-100 dark:border-surface-800">
            <p className="text-xs font-medium text-surface-400 text-center mb-3">DEMO ACCOUNTS</p>
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'manager', 'staff'].map(role => (
                <button
                  key={role}
                  onClick={() => fillDemo(role)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-surface-200 dark:border-surface-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/30 dark:hover:border-brand-800 transition-all capitalize text-surface-600 dark:text-surface-400"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
         © {new Date().getFullYear()} WareNova Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
