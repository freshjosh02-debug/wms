import React, { useEffect, useState, useCallback } from 'react';
import { warehouseAPI, usersAPI, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

function WarehouseModal({ warehouse, users, onClose, onSave }) {
  const [form, setForm] = useState(warehouse || {
    name: '', code: '', type: 'main', capacity: 10000,
    'address.city': '', 'address.country': 'Nigeria', phone: '', email: '',
    manager: ''
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name, code: form.code, type: form.type,
        capacity: +form.capacity, phone: form.phone, email: form.email,
        manager: form.manager || undefined,
        address: { city: form['address.city'], country: form['address.country'] }
      };
      if (warehouse) { await warehouseAPI.update(warehouse._id, payload); toast.success('Warehouse updated'); }
      else { await warehouseAPI.create(payload); toast.success('Warehouse created'); }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">{warehouse ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Name *</label><input className="input" required value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Code</label><input className="input uppercase" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="MDC-01" /></div>
              <div><label className="label">Type</label>
                <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {['main','transit','cold_storage','hazmat','retail'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e => set('capacity', e.target.value)} /></div>
              <div><label className="label">Manager</label>
                <select className="select" value={form.manager} onChange={e => set('manager', e.target.value)}>
                  <option value="">No manager</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div><label className="label">City</label><input className="input" value={form['address.city']} onChange={e => set('address.city', e.target.value)} /></div>
              <div><label className="label">Country</label><input className="input" value={form['address.country']} onChange={e => set('address.country', e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : warehouse ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WarehousePage() {
  const { isAdmin } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [wh, us] = await Promise.all([warehouseAPI.getAll(), usersAPI.getAll()]);
      setWarehouses(wh.data); setUsers(us.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this warehouse?')) return;
    await warehouseAPI.delete(id); toast.success('Warehouse deactivated'); load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Warehouses</h1><p className="page-subtitle">{warehouses.length} active</p></div>
        {isAdmin() && <button onClick={() => setModal('create')} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add Warehouse</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_, i) => <div key={i} className="card p-6 h-48 animate-pulse bg-surface-100 dark:bg-surface-800" />) :
          warehouses.map(wh => (
            <div key={wh._id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="stat-icon bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
                  <BuildingOfficeIcon className="w-6 h-6" />
                </div>
                {isAdmin() && (
                  <div className="flex gap-1">
                    <button onClick={() => { setSelected(wh); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(wh._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100">{wh.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded font-mono">{wh.code}</code>
                <span className="badge-gray capitalize">{wh.type?.replace('_', ' ')}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {wh.address?.city && <p className="text-surface-500">📍 {wh.address.city}, {wh.address.country}</p>}
                {wh.manager && <p className="text-surface-500">👤 {wh.manager.name}</p>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-100 dark:bg-surface-800 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (wh.usedCapacity / wh.capacity) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-surface-400">{Math.round((wh.usedCapacity / wh.capacity) * 100)}%</span>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      {modal && <WarehouseModal warehouse={selected} users={users} onClose={() => { setModal(null); setSelected(null); }} onSave={() => { setModal(null); setSelected(null); load(); }} />}
    </div>
  );
}

export default WarehousePage;
