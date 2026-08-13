import React, { useEffect, useState } from 'react';
import { notificationsAPI, formatDateTime } from '../../utils/api';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

const typeColors = {
  low_stock: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  order_update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  system: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400',
  alert: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationsAPI.getAll();
        setNotifications(res.data || []);
        setUnread(res.unreadCount || 0);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications(n => n.map(x => x._id === id ? { ...x, isRead: true } : x));
    setUnread(u => Math.max(0, u - 1));
  };

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 z-50 animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Notifications</h3>
            {unread > 0 && (
              <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              <CheckIcon className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800">
          {loading ? (
            <div className="py-8 text-center text-sm text-surface-400">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <BellIcon className="w-10 h-10 mx-auto text-surface-300 mb-3" />
              <p className="text-sm text-surface-400">No notifications</p>
            </div>
          ) : notifications.map(n => (
            <div
              key={n._id}
              className={`px-5 py-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${!n.isRead ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''}`}
              onClick={() => !n.isRead && markRead(n._id)}
            >
              <div className="flex items-start gap-3">
                <span className={`badge mt-0.5 ${typeColors[n.type] || typeColors.system}`}>
                  {n.type?.replace('_', ' ')}
                </span>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5 ml-auto" />}
              </div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 mt-1.5">{n.title}</p>
              <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-surface-400 mt-1.5">{formatDateTime(n.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
