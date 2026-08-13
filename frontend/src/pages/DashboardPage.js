import React, { useEffect, useState } from 'react';
import { dashboardAPI, formatCurrency, formatDateTime } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  CubeIcon, ShoppingCartIcon, ExclamationTriangleIcon,
  ArrowTrendingUpIcon, CurrencyDollarIcon, ClockIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
      <p className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50 mt-1">{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-1">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        <ArrowTrendingUpIcon className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const chartOptions = (isDark) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: isDark ? '#94a3b8' : '#475569', font: { family: 'DM Sans', size: 12 } } },
    tooltip: { backgroundColor: isDark ? '#1e293b' : '#fff', titleColor: isDark ? '#f1f5f9' : '#0f172a', bodyColor: isDark ? '#94a3b8' : '#475569', borderColor: isDark ? '#334155' : '#e2e8f0', borderWidth: 1 }
  },
  scales: {
    x: { grid: { color: isDark ? '#1e293b' : '#f1f5f9' }, ticks: { color: isDark ? '#64748b' : '#94a3b8' } },
    y: { grid: { color: isDark ? '#1e293b' : '#f1f5f9' }, ticks: { color: isDark ? '#64748b' : '#94a3b8' } }
  }
});

const statusColors = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  picked: '#06b6d4', packed: '#0ea5e9', shipped: '#10b981',
  delivered: '#22c55e', cancelled: '#ef4444', returned: '#f97316'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setData(res.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overview = data?.overview || {};

  // Prepare chart data
  const orderStatusData = {
    labels: (data?.ordersByStatus || []).map(s => s._id),
    datasets: [{
      data: (data?.ordersByStatus || []).map(s => s.count),
      backgroundColor: (data?.ordersByStatus || []).map(s => statusColors[s._id] || '#94a3b8'),
      borderWidth: 0,
    }]
  };

  const categoryData = {
    labels: (data?.inventoryByCategory || []).slice(0, 6).map(c => c._id),
    datasets: [{
      label: 'Stock Quantity',
      data: (data?.inventoryByCategory || []).slice(0, 6).map(c => c.totalQty),
      backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'].map(c => c + 'cc'),
      borderRadius: 6,
    }]
  };

  const movementDays = [...new Set((data?.stockMovement || []).map(m => m._id.day))].sort().slice(-14);
  const goodsIn = movementDays.map(day => {
    const found = data.stockMovement.find(m => m._id.day === day && m._id.type === 'goods_in');
    return found?.total || 0;
  });
  const goodsOut = movementDays.map(day => {
    const found = data.stockMovement.find(m => m._id.day === day && m._id.type === 'goods_out');
    return found?.total || 0;
  });

  const movementData = {
    labels: movementDays.map(d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Goods In',
        data: goodsIn,
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Goods Out',
        data: goodsOut,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening in your warehouse today.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CubeIcon} label="Total Products" value={overview.totalProducts?.toLocaleString() || '0'}
          sub={`${overview.outOfStock || 0} out of stock`} color="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" />
        <StatCard icon={ExclamationTriangleIcon} label="Low Stock Alerts" value={overview.lowStockProducts || '0'}
          sub="Need reordering" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
        <StatCard icon={ShoppingCartIcon} label="Pending Orders" value={overview.pendingOrders || '0'}
          sub={`${overview.processingOrders || 0} processing`} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <StatCard icon={CurrencyDollarIcon} label="Inventory Value" value={formatCurrency(overview.inventoryValue)}
          sub="Total stock value" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock Movement */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-4">Stock Movement (30 days)</h3>
          <div className="chart-container h-64">
            <Line data={movementData} options={chartOptions(isDark)} />
          </div>
        </div>

        {/* Order Status */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-4">Orders by Status</h3>
          <div className="chart-container h-64">
            <Doughnut data={orderStatusData} options={{ ...chartOptions(isDark), scales: undefined, cutout: '65%' }} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inventory by Category */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-4">Inventory by Category</h3>
          <div className="chart-container h-56">
            <Bar data={categoryData} options={{ ...chartOptions(isDark), plugins: { ...chartOptions(isDark).plugins, legend: { display: false } } }} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-surface-400" /> Recent Activity
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {(data?.recentActivity || []).length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-4">No recent activity</p>
            ) : (data?.recentActivity || []).map((op, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${op.type === 'goods_in' ? 'bg-emerald-100 text-emerald-700' :
                    op.type === 'goods_out' ? 'bg-blue-100 text-blue-700' :
                    'bg-surface-100 text-surface-600'}`}>
                  {op.type === 'goods_in' ? '+' : op.type === 'goods_out' ? '-' : '~'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {op.product?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-surface-400">
                    {op.type.replace('_', ' ')} • qty {op.quantity} • {op.performedBy?.name || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {overview.lowStockProducts > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-5 py-4 flex items-center gap-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              {overview.lowStockProducts} product{overview.lowStockProducts !== 1 ? 's' : ''} below reorder point
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Review your inventory to avoid stockouts and fulfillment delays.
            </p>
          </div>
          <a href="/inventory?lowStock=true" className="ml-auto flex-shrink-0 btn-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-medium px-3 py-1.5">
            View Items
          </a>
        </div>
      )}
    </div>
  );
}
