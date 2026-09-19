// src/components/Layout.jsx
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Search, BookOpen, Sparkles, ImageIcon, Grid, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/search', label: 'Search', icon: Search },
];

const AI_TOOLS_NAV = [
  { to: '/ai/summarize', label: 'AI Summarizer', icon: Sparkles },
  { to: '/ai/explain', label: 'AI Text Explainer', icon: BookOpen },
  { to: '/ai/image-studio', label: 'AI Vision Studio', icon: ImageIcon },
  { to: '/gallery', label: 'Image Gallery', icon: Grid },
];

function NavItem({ to, label, icon: Icon, end, onClose }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          w-60 bg-white border-r border-gray-200
          shadow-lg lg:shadow-none
          transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">ResearchMate</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Main Menu
            </p>
            <div className="space-y-0.5">
              {MAIN_NAV.map((item) => (
                <NavItem key={item.to} {...item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Tools
            </p>
            <div className="space-y-0.5">
              {AI_TOOLS_NAV.map((item) => (
                <NavItem key={item.to} {...item} onClose={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer — user info + logout */}
        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar — click to go to profile */}
            <Link
              to="/profile"
              className="flex items-center gap-3 flex-1 min-w-0 rounded-xl hover:bg-indigo-50 px-1 py-1 -ml-1 transition-colors"
              title="View profile"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-xs font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              {/* Name + email */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name ?? 'User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ''}</p>
              </div>
            </Link>
            {/* Logout button */}
            <button
              id="logout-btn"
              onClick={handleLogout}
              title="Log out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 flex-shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 sticky top-0 z-20 flex-shrink-0">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setSidebarOpen((s) => !s)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">ResearchMate</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
