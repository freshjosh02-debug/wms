import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  HomeIcon, CubeIcon, ShoppingCartIcon, BuildingOfficeIcon,
  MapPinIcon, ArrowsRightLeftIcon, ChartBarIcon, UsersIcon,
  BellIcon, SunIcon, MoonIcon, Bars3Icon, XMarkIcon,
  UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid';
import NotificationPanel from '../layout/NotificationPanel';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/inventory', label: 'Inventory', icon: CubeIcon },
  { path: '/orders', label: 'Orders', icon: ShoppingCartIcon },
  { path: '/operations', label: 'Operations', icon: ArrowsRightLeftIcon },
  { path: '/warehouse', label: 'Warehouses', icon: BuildingOfficeIcon },
  { path: '/locations', label: 'Locations', icon: MapPinIcon },
  { path: '/reports', label: 'Reports', icon: ChartBarIcon },
];

const adminItems = [
  { path: '/users', label: 'Users', icon: UsersIcon, roles: ['admin', 'manager'] },
];

export default function Layout() {
  const { user, logout, isManager } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
  <img src="/logo.png" alt="WareNova" className="w-full h-full object-contain" />
</div>
<div>
  <div className="font-display font-bold text-lg text-surface-900 dark:text-white leading-none">WareNova</div>
  <div className="text-xs text-surface-400 font-medium mt-0.5">Group</div>
</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">Main</p>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {isManager() && (
          <>
            <p className="px-3 mt-4 mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">Admin</p>
            {adminItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{user?.name}</p>
            <p className="text-xs text-surface-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
          className="sidebar-link w-full mt-1"
        >
          <UserCircleIcon className="w-5 h-5" /> Profile
        </button>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <ArrowRightOnRectangleIcon className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-white dark:bg-surface-900 shadow-2xl flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200 dark:border-surface-800">
              <div className="font-display font-bold text-lg">WareNova</div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto"><SidebarContent /></div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-surface-400">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              title="Toggle theme"
            >
              {isDark ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5 text-surface-500" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
              >
                <BellIcon className="w-5 h-5 text-surface-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                  <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                <ChevronDownIcon className="w-4 h-4 text-surface-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-900 rounded-xl shadow-lg border border-surface-200 dark:border-surface-800 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-800 mb-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-surface-400 capitalize">{user?.role}</p>
                  </div>
                  <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <ArrowRightOnRectangleIcon className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
