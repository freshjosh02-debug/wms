import React, { useEffect, useState, useCallback } from 'react';
import { ordersAPI, productsAPI, usersAPI, warehouseAPI, formatCurrency, formatDate, formatDateTime } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon,
  TrashIcon, XMarkIcon, CheckIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-purple',
  picked: 'badge-blue', packed: 'badge-blue', shipped: 'badge-green',
  delivered: 'badge-green', cancelled: 'badge-red', returned: 'badge-gray'
};
const TYPE_COLORS = {
  inbound: 'badge-green', outbound: 'badge-blue', transfer: 'badge-purple', return: 'badge-yellow'
};

const ALL_STATUSES = ['pending','confirmed','processing','picked','packed','shipped','delivered','cancelled','returned'];

function OrderDetailModal({ order, users, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await ordersAPI.updateStatus(order._id, { status: newStatus, note });
      toast.success('Status updated');
      onStatusChange();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="font-display font-semibold text-lg">{order.orderNumber}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={TYPE_COLORS[order.type]}>{order.type}</span>
              <span className={STATUS_COLORS[order.status]}>{order.status}</span>
              <span className={`badge ${order.priority === 'urgent' ? 'badge-red' : order.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>
                {order.priority}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="modal-body space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {order.customer?.name && (
              <div><p className="text-surface-400">Customer</p><p className="font-medium">{order.customer.name}</p></div>
            )}
            {order.supplier?.name && (
              <div><p className="text-surface-400">Supplier</p><p className="font-medium">{order.supplier.name}</p></div>
            )}
            <div><p className="text-surface-400">Created</p><p className="font-medium">{formatDateTime(order.createdAt)}</p></div>
            <div><p className="text-surface-400">Assigned To</p><p className="font-medium">{order.assignedTo?.name || 'Unassigned'}</p></div>
            {order.trackingNumber && (
              <div><p className="text-surface-400">Tracking</p><p className="font-mono text-sm">{order.trackingNumber}</p></div>
            )}
            <div><p className="text-surface-400">Total Value</p><p className="font-semibold text-brand-600">{formatCurrency(order.totalValue)}</p></div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Order Items ({order.totalItems})</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="font-medium">{item.name}</td>
                      <td><code className="text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded">{item.sku}</code></td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td className="font-medium">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Update */}
          {!['delivered', 'cancelled'].includes(order.status) && (
            <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
              <h3 className="font-semibold text-sm mb-3">Update Status</h3>
              <div className="flex gap-2">
                <select className="select flex-1" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select new status</option>
                  {ALL_STATUSES.filter(s => s !== order.status).map(s => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
                <button onClick={handleStatusChange} disabled={!newStatus || saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
              <input className="input mt-2" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" />
            </div>
          )}

          {/* History */}
          {order.statusHistory?.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Status History</h3>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={STATUS_COLORS[h.status]}>{h.status}</span>
                    <span className="text-surface-400">{formatDateTime(h.timestamp)}</span>
                    {h.note && <span className="text-surface-500">— {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateOrderModal({ products, users, warehouses, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: 'outbound', priority: 'normal', warehouse: '',
    'customer.name': '', 'customer.email': '', 'supplier.name': '',
    assignedTo: '', notes: ''
  });
  const [items, setItems] = useState([{ productId: '', name: '', sku: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addItem = () => setItems(i => [...i, { productId: '', name: '', sku: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i) => setItems(items => items.filter((_, idx) => idx !== i));
  const setItem = (i, k, v) => setItems(items => items.map((item, idx) => {
    if (idx !== i) return item;
    if (k === 'productId') {
      const p = products.find(p => p._id === v);
      return p ? { ...item, productId: v, name: p.name, sku: p.sku, unitPrice: p.sellingPrice } : { ...item, productId: v };
    }
    return { ...item, [k]: v };
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(i => !i.productId)) return toast.error('Please select a product for all items');
    setSaving(true);
    try {
      const payload = {
        type: form.type, priority: form.priority, warehouse: form.warehouse,
        assignedTo: form.assignedTo || undefined, notes: form.notes,
        createdBy: user._id,
        customer: form.type === 'outbound' ? { name: form['customer.name'], email: form['customer.email'] } : undefined,
        supplier: form.type === 'inbound' ? { name: form['supplier.name'] } : undefined,
        items: items.map(i => ({ product: i.productId, name: i.name, sku: i.sku, quantity: +i.quantity, unitPrice: +i.unitPrice, totalPrice: +i.quantity * +i.unitPrice }))
      };
      await ordersAPI.create(payload);
      toast.success('Order created');
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">Create Order</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Order Type</label>
                <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="outbound">Outbound (Ship)</option>
                  <option value="inbound">Inbound (Receive)</option>
                  <option value="transfer">Transfer</option>
                  <option value="return">Return</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Warehouse</label>
                <select className="select" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assign To</label>
                <select className="select" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              {form.type === 'outbound' && <>
                <div>
                  <label className="label">Customer Name</label>
                  <input className="input" value={form['customer.name']} onChange={e => set('customer.name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Customer Email</label>
                  <input type="email" className="input" value={form['customer.email']} onChange={e => set('customer.email', e.target.value)} />
                </div>
              </>}
              {form.type === 'inbound' && (
                <div className="col-span-2">
                  <label className="label">Supplier Name</label>
                  <input className="input" value={form['supplier.name']} onChange={e => set('supplier.name', e.target.value)} />
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Items</label>
                <button type="button" onClick={addItem} className="btn-ghost btn-sm text-brand-600">
                  <PlusIcon className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select className="select" value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)} required>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="1" className="input" placeholder="Qty" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} required />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" className="input" placeholder="Price" value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-surface-400 mt-2">
                Total: {formatCurrency(items.reduce((s, i) => s + (+i.quantity * +i.unitPrice), 0))}
              </p>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Order notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ page, limit: 20, search, status, type });
      setOrders(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } finally { setLoading(false); }
  }, [page, search, status, type]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    productsAPI.getAll({ limit: 200 }).then(r => setProducts(r.data));
    usersAPI.getAll().then(r => setUsers(r.data));
    warehouseAPI.getAll().then(r => setWarehouses(r.data));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    await ordersAPI.delete(id);
    toast.success('Order cancelled');
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{total} orders total</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input className="input pl-9" placeholder="Search orders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="select w-40" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {['inbound','outbound','transfer','return'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <select className="select w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container rounded-none rounded-xl border-0">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Customer/Supplier</th>
                <th>Items</th>
                <th>Value</th>
                <th>Assigned</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={10}><div className="h-5 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-surface-400">No orders found</td></tr>
              ) : orders.map(o => (
                <tr key={o._id}>
                  <td><span className="font-mono text-xs font-semibold text-surface-900 dark:text-surface-100">{o.orderNumber}</span></td>
                  <td><span className={TYPE_COLORS[o.type]}>{o.type}</span></td>
                  <td><span className={STATUS_COLORS[o.status]}>{o.status}</span></td>
                  <td><span className={`badge capitalize ${o.priority === 'urgent' ? 'badge-red' : o.priority === 'high' ? 'badge-yellow' : 'badge-gray'}`}>{o.priority}</span></td>
                  <td className="max-w-32 truncate">{o.customer?.name || o.supplier?.name || '—'}</td>
                  <td>{o.totalItems}</td>
                  <td className="font-medium">{formatCurrency(o.totalValue)}</td>
                  <td>{o.assignedTo?.name || <span className="text-surface-400">Unassigned</span>}</td>
                  <td className="text-surface-400 text-xs">{formatDate(o.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(o); setModal('view'); }}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {isManager() && !['delivered','cancelled'].includes(o.status) && (
                        <button onClick={() => handleDelete(o._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800">
            <p className="text-sm text-surface-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {modal === 'view' && selected && (
        <OrderDetailModal order={selected} users={users} onClose={() => { setModal(null); setSelected(null); }} onStatusChange={() => { load(); }} />
      )}
      {modal === 'create' && (
        <CreateOrderModal products={products} users={users} warehouses={warehouses} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
