import React, { useEffect, useState } from 'react';
import { usersAPI, formatDate, formatDateTime } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { name: '', email: '', password: '', role: 'staff', isActive: true });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) { await usersAPI.update(user._id, form); toast.success('User updated'); }
      else { await usersAPI.create(form); toast.success('User created'); }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div><label className="label">Full Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="label">Email *</label><input type="email" className="input" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
            {!user && <div><label className="label">Password *</label><input type="password" className="input" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} /></div>}
            <div><label className="label">Role</label>
              <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-brand-600" />
                <label htmlFor="isActive" className="text-sm font-medium text-surface-700 dark:text-surface-300">Active</label>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : user ? 'Update' : 'Create User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ROLE_COLORS = { admin: 'badge-red', manager: 'badge-blue', staff: 'badge-gray' };

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await usersAPI.getAll(); setUsers(res.data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (id === currentUser._id) return toast.error("Can't deactivate your own account");
    if (!window.confirm('Deactivate this user?')) return;
    await usersAPI.delete(id); toast.success('User deactivated'); load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">{users.length} users</p></div>
        {isAdmin() && <button onClick={() => setModal('create')} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add User</button>}
      </div>
      <div className="card">
        <div className="table-container rounded-none rounded-xl border-0">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array(4).fill(0).map((_, i) => <tr key={i}><td colSpan={7}><div className="h-5 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" /></td></tr>) :
                users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">{u.name?.charAt(0)}</span>
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-surface-500">{u.email}</td>
                    <td><span className={ROLE_COLORS[u.role] || 'badge-gray'}>{u.role}</span></td>
                    <td><span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="text-xs text-surface-400">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                    <td className="text-xs text-surface-400">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-1">
                        {isAdmin() && <>
                          <button onClick={() => { setSelected(u); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                          {u._id !== currentUser._id && <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>}
                        </>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
      {modal && <UserModal user={selected} onClose={() => { setModal(null); setSelected(null); }} onSave={() => { setModal(null); setSelected(null); load(); }} />}
    </div>
  );
}
