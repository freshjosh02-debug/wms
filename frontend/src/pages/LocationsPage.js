import React, { useEffect, useState, useCallback } from 'react';
import { locationsAPI, warehouseAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';

function LocationModal({ location, warehouses, onClose, onSave }) {
  const [form, setForm] = useState(location || { warehouse: '', zone: 'A', aisle: '01', rack: 'R1', shelf: 'S1', bin: '', type: 'standard', capacity: 100 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (location) { await locationsAPI.update(location._id, form); toast.success('Location updated'); }
      else { await locationsAPI.create(form); toast.success('Location created'); }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">{location ? 'Edit Location' : 'Add Location'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Warehouse *</label>
                <select className="select" required value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div><label className="label">Zone *</label><input className="input" required value={form.zone} onChange={e => set('zone', e.target.value)} placeholder="A" /></div>
              <div><label className="label">Aisle *</label><input className="input" required value={form.aisle} onChange={e => set('aisle', e.target.value)} placeholder="01" /></div>
              <div><label className="label">Rack *</label><input className="input" required value={form.rack} onChange={e => set('rack', e.target.value)} placeholder="R1" /></div>
              <div><label className="label">Shelf *</label><input className="input" required value={form.shelf} onChange={e => set('shelf', e.target.value)} placeholder="S1" /></div>
              <div><label className="label">Bin</label><input className="input" value={form.bin} onChange={e => set('bin', e.target.value)} placeholder="Optional" /></div>
              <div><label className="label">Type</label>
                <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {['standard','bulk','cold','hazmat','oversize'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2"><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e => set('capacity', +e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : location ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const { isManager } = useAuth();
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterWarehouse ? { warehouse: filterWarehouse } : {};
      const [loc, wh] = await Promise.all([locationsAPI.getAll(params), warehouseAPI.getAll()]);
      setLocations(loc.data); setWarehouses(wh.data);
    } finally { setLoading(false); }
  }, [filterWarehouse]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this location?')) return;
    await locationsAPI.delete(id); toast.success('Location deactivated'); load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Locations</h1><p className="page-subtitle">{locations.length} locations</p></div>
        {isManager() && <button onClick={() => setModal('create')} className="btn-primary"><PlusIcon className="w-4 h-4" /> Add Location</button>}
      </div>
      <div className="card p-4 flex gap-3">
        <select className="select w-56" value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
          <option value="">All Warehouses</option>
          {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="table-container rounded-none rounded-xl border-0">
          <table>
            <thead><tr><th>Code</th><th>Zone</th><th>Aisle</th><th>Rack</th><th>Shelf</th><th>Type</th><th>Capacity</th><th>Used</th><th>Product</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? Array(6).fill(0).map((_, i) => <tr key={i}><td colSpan={10}><div className="h-5 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" /></td></tr>) :
                locations.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-surface-400">
                    <MapPinIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />No locations
                  </td></tr>
                ) : locations.map(l => (
                  <tr key={l._id}>
                    <td><code className="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded font-mono font-semibold">{l.code}</code></td>
                    <td>{l.zone}</td><td>{l.aisle}</td><td>{l.rack}</td><td>{l.shelf}</td>
                    <td><span className="badge-gray capitalize">{l.type}</span></td>
                    <td>{l.capacity}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-surface-100 dark:bg-surface-800 rounded-full h-1.5">
                          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (l.usedCapacity / l.capacity) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-surface-400">{l.usedCapacity}</span>
                      </div>
                    </td>
                    <td className="text-surface-500 text-xs">{l.currentProduct?.name || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        {isManager() && <>
                          <button onClick={() => { setSelected(l); setModal('edit'); }} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(l._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
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
      {modal && <LocationModal location={selected} warehouses={warehouses} onClose={() => { setModal(null); setSelected(null); }} onSave={() => { setModal(null); setSelected(null); load(); }} />}
    </div>
  );
}
