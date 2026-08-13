import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, formatDateTime } from '../utils/api';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, BellIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally { setSaving(false); }
  };

  const ROLE_PERMISSIONS = {
    admin: ['Read all data', 'Write all data', 'Delete records', 'Manage users', 'Manage warehouse', 'View reports', 'Export data'],
    manager: ['Read all data', 'Write all data', 'Manage warehouse', 'View reports', 'Export data'],
    staff: ['Read data', 'Write data']
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-brand-700 dark:text-brand-400">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-surface-900 dark:text-surface-50">{user?.name}</h2>
            <p className="text-surface-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge capitalize ${user?.role === 'admin' ? 'badge-red' : user?.role === 'manager' ? 'badge-blue' : 'badge-gray'}`}>
                {user?.role}
              </span>
              <span className="badge-green">Active</span>
            </div>
          </div>
        </div>
        {user?.lastLogin && (
          <p className="mt-4 text-xs text-surface-400 border-t border-surface-100 dark:border-surface-800 pt-4">
            Last login: {formatDateTime(user.lastLogin)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {[
          { id: 'profile', label: 'Profile', icon: UserCircleIcon },
          { id: 'password', label: 'Password', icon: KeyIcon },
          { id: 'permissions', label: 'Permissions', icon: ShieldCheckIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === id ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700'}`}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100">Personal Information</h3>
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} disabled />
            <p className="text-xs text-surface-400 mt-1">Email cannot be changed. Contact an admin.</p>
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input capitalize" value={user?.role} disabled />
          </div>
          <div className="flex justify-end">
            <button className="btn-primary" disabled>Save Changes</button>
          </div>
          <p className="text-xs text-surface-400">Profile editing coming soon. Contact an admin to update your details.</p>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100">Change Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" required value={pwForm.currentPassword} onChange={e => setPw('currentPassword', e.target.value)} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" required minLength={6} value={pwForm.newPassword} onChange={e => setPw('newPassword', e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" required value={pwForm.confirmPassword} onChange={e => setPw('confirmPassword', e.target.value)} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {tab === 'permissions' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100">Your Permissions</h3>
          <p className="text-sm text-surface-500">Based on your role: <span className="font-semibold capitalize text-surface-900 dark:text-surface-100">{user?.role}</span></p>
          <div className="space-y-2">
            {(ROLE_PERMISSIONS[user?.role] || []).map((perm, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300">{perm}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
