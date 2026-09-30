import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Settings,
  Sparkles,
  X,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    name: 'Overview',
    path: '/dashboard/overview',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'Formulation Builder',
    path: '/dashboard/formulation',
    icon: FlaskConical
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    badge: null,
  },
];

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const location = useLocation();

  const isLinkActive = (path) => {
    if (path === '/dashboard/overview') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/overview';
    }
    return location.pathname.startsWith(path);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <img src="/pharmanexus-logo.svg" alt="" className="w-9 h-9 object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              PharmaNexus AI
            </span>
            <span className="text-[10px] uppercase font-semibold text-brand-600 dark:text-brand-400 tracking-wider">
              FORMULATION INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.path);

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onCloseMobile}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 h-screen sticky top-0 z-20">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-slide-right">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
