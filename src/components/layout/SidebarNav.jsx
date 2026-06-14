// SidebarNav.jsx — Desktop navigation sidebar (md:flex)
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe2, Newspaper, FileText, MessageSquare, Clock, LogOut, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import LogoutConfirmModal from './LogoutConfirmModal';
import NotificationsBell from '../NotificationsBell';

const NAV_ITEMS = [
  { path: '/globe', icon: Globe2, label: 'Jobs' },
  { path: '/feed', icon: Newspaper, label: 'Feed' },
  { path: '/portfolio', icon: FileText, label: 'Portfolio' },
  { path: '/messaging', icon: MessageSquare, label: 'Messages' },
  { path: '/tracking', icon: Clock, label: 'Track' },
];

export default function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const name = profile?.full_name || user?.email || 'User';
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
          <span className="text-sm font-bold text-brand">C</span>
        </div>
        <span className="font-bold text-lg text-gray-900 tracking-tight">Career OS</span>
        <div className="ml-auto"><NotificationsBell /></div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/portfolio'
            ? location.pathname.startsWith('/portfolio') || location.pathname.startsWith('/company')
            : location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive
                  ? 'bg-brand/5 text-brand font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className="text-sm tracking-wide">{label}</span>
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-brand rounded-r-full" aria-hidden="true" />
              )}
            </button>
          );
        })}
        {profile?.role === 'employer' && (
          <button
            onClick={() => navigate('/post-job')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              location.pathname === '/post-job'
                ? 'bg-brand/5 text-brand font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
          >
            <PlusCircle
              className={`w-5 h-5 transition-transform duration-200 ${
                location.pathname === '/post-job' ? 'scale-110' : 'group-hover:scale-110'
              }`}
              strokeWidth={location.pathname === '/post-job' ? 2.5 : 2}
            />
            <span className="text-sm tracking-wide">Post Job</span>
            {location.pathname === '/post-job' && (
              <div className="absolute left-0 w-1 h-8 bg-brand rounded-r-full" aria-hidden="true" />
            )}
          </button>
        )}
      </nav>

      {/* Mini Profile (Bottom) */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => navigate('/portfolio')}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {name}
              <span className="ml-1 text-[10px] font-medium text-gray-400 capitalize">· {profile?.role || 'User'}</span>
            </p>
          </div>
        </button>

        {profile?.role === 'employer' && (
          <button
            onClick={() => navigate('/team')}
            className={`w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium text-sm ${
              location.pathname === '/team' ? 'bg-brand/5 text-brand' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>My Team</span>
          </button>
        )}
        <button
          onClick={handleLogoutClick}
          className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 font-medium text-sm"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
      <LogoutConfirmModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogoutConfirm} 
      />
    </>
  );
}

