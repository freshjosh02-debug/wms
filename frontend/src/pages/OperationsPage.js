import React, { useEffect, useState, useCallback } from 'react';
import { operationsAPI, formatDateTime } from '../utils/api';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const TYPE_COLORS = {
  goods_in: 'badge-green', goods_out: 'badge-blue', transfer: 'badge-purple',
  adjustment: 'badge-yellow', return: 'badge-gray', stocktake: 'badge-gray'
};

export default function OperationsPage() {
  const [ops, setOps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await operationsAPI.getAll({ page, limit: 25, type });
      setOps(res.data); setTotal(res.total);
    } finally { setLoading(false); }
  }, [page, type]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations</h1>
          <p className="page-subtitle">All stock movements and adjustments ({total} records)</p>
        </div>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="select w-48" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {['goods_in','goods_out','transfer','adjustment','return','stocktake'].map(t => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="table-container rounded-none rounded-xl border-0">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Before</th>
                <th>After</th>
                <th>From</th>
                <th>To</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array(8).fill(0).map((_, i) => <tr key={i}><td colSpan={10}><div className="h-5 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" /></td></tr>) :
                ops.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-surface-400">
                    <ArrowsRightLeftIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />No operations found
                  </td></tr>
                ) : ops.map(op => (
                  <tr key={op._id}>
                    <td><code className="text-xs font-mono text-surface-600 dark:text-surface-400">{op.referenceNumber}</code></td>
                    <td><span className={TYPE_COLORS[op.type] || 'badge-gray'}>{op.type?.replace('_', ' ')}</span></td>
                    <td>
                      <div className="font-medium text-surface-900 dark:text-surface-100">{op.product?.name}</div>
                      <div className="text-xs text-surface-400">{op.product?.sku}</div>
                    </td>
                    <td className="font-semibold">{op.quantity}</td>
                    <td className="text-surface-500">{op.previousQuantity ?? '—'}</td>
                    <td className="font-medium text-surface-900 dark:text-surface-100">{op.newQuantity ?? '—'}</td>
                    <td className="text-xs text-surface-400">{op.fromLocation?.code || '—'}</td>
                    <td className="text-xs text-surface-400">{op.toLocation?.code || '—'}</td>
                    <td className="text-surface-500">{op.performedBy?.name || 'System'}</td>
                    <td className="text-xs text-surface-400 whitespace-nowrap">{formatDateTime(op.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {total > 25 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 dark:border-surface-800">
            <p className="text-sm text-surface-500">Page {page}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm disabled:opacity-40">Prev</button>
              <button disabled={ops.length < 25} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
