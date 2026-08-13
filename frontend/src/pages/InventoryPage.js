import React, { useEffect, useState, useCallback } from 'react';
import { productsAPI, locationsAPI, warehouseAPI, formatCurrency, formatDate } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon, PencilIcon,
  TrashIcon, QrCodeIcon, ArrowPathIcon, ExclamationTriangleIcon,
  XMarkIcon, CheckIcon
} from '@heroicons/react/24/outline';

const UNITS = ['pcs', 'kg', 'lbs', 'liters', 'meters', 'boxes', 'pallets', 'cartons'];

const statusBadge = (product) => {
  if (product.quantity === 0) return <span className="badge-red">Out of Stock</span>;
  if (product.quantity <= product.reorderPoint) return <span className="badge-yellow">Low Stock</span>;
  return <span className="badge-green">In Stock</span>;
};

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', category: '', subcategory: '', brand: '',
  unit: 'pcs', quantity: 0, reorderPoint: 10, reorderQuantity: 50, maxQuantity: 1000,
  costPrice: 0, sellingPrice: 0, description: '', weight: 0,
  'supplier.name': '', 'supplier.email': '', 'supplier.leadTime': 7,
  warehouse: '', location: '', tags: ''
};

function ProductModal({ product, warehouses, locations, categories, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    ...product, tags: product.tags?.join(', ') || '',
    warehouse: product.warehouse?._id || product.warehouse || '',
    location: product.location?._id || product.location || '',
    'supplier.name': product.supplier?.name || '',
    'supplier.email': product.supplier?.email || '',
    'supplier.leadTime': product.supplier?.leadTime || 7,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        supplier: { name: form['supplier.name'], email: form['supplier.email'], leadTime: form['supplier.leadTime'] }
      };
      delete payload['supplier.name']; delete payload['supplier.email']; delete payload['supplier.leadTime'];
      if (product) {
        await productsAPI.update(product._id, payload);
        toast.success('Product updated');
      } else {
        await productsAPI.create(payload);
        toast.success('Product created');
      }
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Product name" />
              </div>
              <div>
                <label className="label">SKU</label>
                <input className="input" value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Auto-generated if empty" />
              </div>
              <div>
                <label className="label">Barcode</label>
                <input className="input" value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Scan or enter barcode" />
              </div>
              <div>
                <label className="label">Category *</label>
                <input className="input" list="categories-list" required value={form.category} onChange={e => set('category', e.target.value)} placeholder="Select or type" />
                <datalist id="categories-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="label">Unit</label>
                <select className="select" value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input type="number" min="0" className="input" value={form.quantity} onChange={e => set('quantity', +e.target.value)} />
              </div>
              <div>
                <label className="label">Reorder Point</label>
                <input type="number" min="0" className="input" value={form.reorderPoint} onChange={e => set('reorderPoint', +e.target.value)} />
              </div>
              <div>
                <label className="label">Cost Price (₦)</label>
                <input type="number" min="0" className="input" value={form.costPrice} onChange={e => set('costPrice', +e.target.value)} />
              </div>
              <div>
                <label className="label">Selling Price (₦)</label>
                <input type="number" min="0" className="input" value={form.sellingPrice} onChange={e => set('sellingPrice', +e.target.value)} />
              </div>
              <div>
                <label className="label">Warehouse</label>
                <select className="select" value={form.warehouse} onChange={e => set('warehouse', e.target.value)}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <select className="select" value={form.location} onChange={e => set('location', e.target.value)}>
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l._id} value={l._id}>{l.code}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Brand</label>
                <input className="input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
              </div>
              <div>
                <label className="label">Supplier</label>
                <input className="input" value={form['supplier.name']} onChange={e => set('supplier.name', e.target.value)} placeholder="Supplier name" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Tags (comma-separated)</label>
                <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="tag1, tag2, tag3" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product description" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><CheckIcon className="w-4 h-4" /> {product ? 'Update' : 'Create'} Product</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdjustQtyModal({ product, onClose, onSave }) {
  const [qty, setQty] = useState('');
  const [type, setType] = useState('add');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await productsAPI.updateQuantity(product._id, { quantity: +qty, type, reason });
      toast.success('Quantity updated');
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-sm">
        <div className="modal-header">
          <h2 className="font-display font-semibold text-lg">Adjust Quantity</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4">
            <p className="text-sm text-surface-500">Current quantity: <span className="font-semibold text-surface-900 dark:text-surface-100">{product.quantity} {product.unit}</span></p>
            <div>
              <label className="label">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['add', 'subtract', 'set'].map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2 rounded-lg text-sm font-medium border capitalize transition-colors ${type === t ? 'bg-brand-600 border-brand-600 text-white' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="0" required className="input" value={qty} onChange={e => setQty(e.target.value)} placeholder="Enter quantity" />
            </div>
            <div>
              <label className="label">Reason</label>
              <input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for adjustment" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Update Quantity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { isManager } = useAuth();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'adjust'
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ page, limit: 20, search, category, lowStock: lowStock || undefined });
      setProducts(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } finally { setLoading(false); }
  }, [page, search, category, lowStock]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    productsAPI.getCategories().then(r => setCategories(r.data));
    warehouseAPI.getAll().then(r => setWarehouses(r.data));
    locationsAPI.getAll().then(r => setLocations(r.data));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    await productsAPI.delete(id);
    toast.success('Product deleted');
    load();
  };

  const closeModal = () => { setModal(null); setSelected(null); };
  const onSave = () => { closeModal(); load(); };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{total} products total</p>
        </div>
        {isManager() && (
          <button onClick={() => setModal('create')} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, SKU, category..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="select w-full sm:w-48" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setLowStock(l => !l); setPage(1); }}
          className={`btn flex-shrink-0 gap-2 ${lowStock ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'btn-secondary'}`}
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          {lowStock ? 'Showing Low Stock' : 'Low Stock'}
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container rounded-none rounded-xl border-0">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="py-3"><div className="h-5 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-surface-400">
                  <CubeIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No products found
                </td></tr>
              ) : products.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className="font-medium text-surface-900 dark:text-surface-100">{p.name}</div>
                    {p.brand && <div className="text-xs text-surface-400">{p.brand}</div>}
                  </td>
                  <td><code className="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded font-mono">{p.sku}</code></td>
                  <td>{p.category}</td>
                  <td>
                    <span className={`font-semibold ${p.quantity === 0 ? 'text-red-500' : p.quantity <= p.reorderPoint ? 'text-amber-600' : 'text-surface-900 dark:text-surface-100'}`}>
                      {p.quantity} {p.unit}
                    </span>
                    {p.reservedQuantity > 0 && <div className="text-xs text-surface-400">{p.reservedQuantity} reserved</div>}
                  </td>
                  <td className="text-surface-500">{p.location?.code || '—'}</td>
                  <td>{formatCurrency(p.costPrice)}</td>
                  <td>{statusBadge(p)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(p); setModal('adjust'); }}
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors" title="Adjust quantity">
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                      {isManager() && <>
                        <button onClick={() => { setSelected(p); setModal('edit'); }}
                          className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-brand-600 transition-colors" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-colors" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {modal === 'create' && (
        <ProductModal warehouses={warehouses} locations={locations} categories={categories} onClose={closeModal} onSave={onSave} />
      )}
      {modal === 'edit' && selected && (
        <ProductModal product={selected} warehouses={warehouses} locations={locations} categories={categories} onClose={closeModal} onSave={onSave} />
      )}
      {modal === 'adjust' && selected && (
        <AdjustQtyModal product={selected} onClose={closeModal} onSave={onSave} />
      )}
    </div>
  );
}
