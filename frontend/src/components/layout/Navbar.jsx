import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  Bell,
  LogOut,
  User,
  Shield,
  Menu,
  ChevronDown,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('You have been logged out.');
    } catch {
      toast.error('Failed to log out cleanly.');
    }
  };

  const sampleNotifications = [
    { id: 1, title: 'API Key regenerated', time: '10m ago', read: false },
    { id: 2, title: 'Database sync completed successfully', time: '1h ago', read: false },
    { id: 3, title: 'Welcome to Enterprise Portal', time: '1d ago', read: true },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="p-2 -ml-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span>Portal</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Dashboard</span>
          </div>
        </div>

        {/* Right: Actions (Notifications, User menu) */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-zinc-950" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-2 z-50 animate-slide-down">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Notifications</span>
                  <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-64 overflow-y-auto">
                  {sampleNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer flex items-start gap-2.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* User Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {user?.name || user?.username || 'User'}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  {user?.role || 'Member'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl py-1.5 z-50 animate-slide-down">
                <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Shield className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Security & Access</span>
                  </Link>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
