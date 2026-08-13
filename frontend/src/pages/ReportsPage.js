import React, { useEffect, useState } from 'react';
import { reportsAPI, downloadCSV, formatCurrency } from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const TABS = ['Overview', 'Inventory', 'Orders', 'Movements'];

export default function ReportsPage() {
  const [tab, setTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (tab === 'Overview') {
      setLoading(true);
      reportsAPI.getAnalytics().then(r => setAnalytics(r.data)).finally(() => setLoading(false));
    } else if (tab === 'Inventory') {
      setLoading(true);
      reportsAPI.getInventory().then(r => setInventory(r.data)).finally(() => setLoading(false));
    } else if (tab === 'Orders') {
      setLoading(true);
      reportsAPI.getOrders().then(r => setOrders(r.data)).finally(() => setLoading(false));
    } else if (tab === 'Movements') {
      setLoading(true);
      reportsAPI.getMovements().then(r => setMovements(r.data)).finally(() => setLoading(false));
    }
  }, [tab]);

  const exportCSV = async (type) => {
    setExporting(true);
    try {
      let blob;
      if (type === 'inventory') blob = await reportsAPI.exportInventory();
      else blob = await reportsAPI.exportOrders();
      downloadCSV(blob, `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Report exported');
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: isDark ? '#94a3b8' : '#475569', font: { family: 'DM Sans', size: 12 } } },
      tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#f1f5f9' : '#0f172a', bodyColor: isDark ? '#94a3b8' : '#475569', borderColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1 }
    },
    scales: {
      x: { grid: { color: isDark ? '#1e293b' : '#f1f5f9' }, ticks: { color: isDark ? '#64748b' : '#94a3b8' } },
      y: { grid: { color: isDark ? '#1e293b' : '#f1f5f9' }, ticks: { color: isDark ? '#64748b' : '#94a3b8' } }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Insights and data exports</p></div>
        <button onClick={() => exportCSV(tab === 'Orders' ? 'orders' : 'inventory')} disabled={exporting} className="btn-secondary">
          <ArrowDownTrayIcon className="w-4 h-4" />{exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'Overview' && analytics ? (
        <div className="space-y-5">
          {/* Top Moving Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Top Moving Products (30 days)</h3>
              {analytics.topMovingProducts?.length > 0 ? (
                <div className="chart-container h-64">
                  <Bar
                    data={{
                      labels: analytics.topMovingProducts.map(p => p.name?.slice(0, 20)),
                      datasets: [{ label: 'Units Moved', data: analytics.topMovingProducts.map(p => p.totalMoved), backgroundColor: '#3b82f6cc', borderRadius: 4 }]
                    }}
                    options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }}
                  />
                </div>
              ) : <p className="text-surface-400 text-sm text-center py-8">No data available</p>}
            </div>

            <div className="card p-6">
              <h3 className="font-display font-semibold mb-4">Order Fulfillment Status</h3>
              {analytics.orderFulfillment?.length > 0 ? (
                <div className="chart-container h-64">
                  <Doughnut
                    data={{
                      labels: analytics.orderFulfillment.map(o => o._id),
                      datasets: [{
                        data: analytics.orderFulfillment.map(o => o.count),
                        backgroundColor: ['#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#10b981','#22c55e','#ef4444','#f97316'],
                        borderWidth: 0
                      }]
                    }}
                    options={{ ...chartOpts, scales: undefined, cutout: '60%' }}
                  />
                </div>
              ) : <p className="text-surface-400 text-sm text-center py-8">No data available</p>}
            </div>
          </div>

          {/* Category Analysis */}
          <div className="card p-6">
            <h3 className="font-display font-semibold mb-4">Inventory Value by Category</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>Category</th><th>Products</th><th>Total Quantity</th><th>Avg Cost</th><th>Total Value</th></tr></thead>
                <tbody>
                  {(analytics.categoryAnalysis || []).map((c, i) => (
                    <tr key={i}>
                      <td className="font-medium">{c._id}</td>
                      <td>{c.products}</td>
                      <td>{c.totalQty?.toLocaleString()}</td>
                      <td>{formatCurrency(c.avgPrice)}</td>
                      <td className="font-semibold text-brand-600">{formatCurrency(c.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      ) : tab === 'Inventory' ? (
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold">Inventory Report ({inventory.length} products)</h3>
          </div>
          <div className="table-container rounded-none border-0">
            <table>
              <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Qty</th><th>Reserved</th><th>Available</th><th>Reorder Pt.</th><th>Cost</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {inventory.map(p => (
                  <tr key={p._id}>
                    <td><code className="text-xs font-mono">{p.sku}</code></td>
                    <td className="font-medium">{p.name}</td>
                    <td>{p.category}</td>
                    <td className={p.quantity === 0 ? 'text-red-500 font-semibold' : p.quantity <= p.reorderPoint ? 'text-amber-600 font-semibold' : ''}>{p.quantity}</td>
                    <td>{p.reservedQuantity}</td>
                    <td>{p.availableQuantity}</td>
                    <td>{p.reorderPoint}</td>
                    <td>{formatCurrency(p.costPrice)}</td>
                    <td>{p.location?.code || '—'}</td>
                    <td>{p.quantity === 0 ? <span className="badge-red">Out</span> : p.quantity <= p.reorderPoint ? <span className="badge-yellow">Low</span> : <span className="badge-green">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : tab === 'Orders' ? (
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold">Orders Report ({orders.length} orders)</h3>
          </div>
          <div className="table-container rounded-none border-0">
            <table>
              <thead><tr><th>Order #</th><th>Type</th><th>Status</th><th>Priority</th><th>Customer</th><th>Items</th><th>Value</th><th>Assigned</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td><code className="text-xs font-mono font-semibold">{o.orderNumber}</code></td>
                    <td><span className={`badge capitalize bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>{o.type}</span></td>
                    <td><span className="badge-gray capitalize">{o.status}</span></td>
                    <td className="capitalize">{o.priority}</td>
                    <td>{o.customer?.name || o.supplier?.name || '—'}</td>
                    <td>{o.totalItems}</td>
                    <td className="font-medium">{formatCurrency(o.totalValue)}</td>
                    <td>{o.assignedTo?.name || '—'}</td>
                    <td className="text-xs text-surface-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : tab === 'Movements' ? (
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold">Stock Movements ({movements.length} records)</h3>
          </div>
          <div className="table-container rounded-none border-0">
            <table>
              <thead><tr><th>Reference</th><th>Type</th><th>Product</th><th>Qty</th><th>Before</th><th>After</th><th>By</th><th>Date</th></tr></thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m._id}>
                    <td><code className="text-xs font-mono">{m.referenceNumber}</code></td>
                    <td><span className="badge-gray capitalize">{m.type?.replace('_', ' ')}</span></td>
                    <td>{m.product?.name}</td>
                    <td className="font-semibold">{m.quantity}</td>
                    <td className="text-surface-400">{m.previousQuantity ?? '—'}</td>
                    <td>{m.newQuantity ?? '—'}</td>
                    <td>{m.performedBy?.name || 'System'}</td>
                    <td className="text-xs text-surface-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
