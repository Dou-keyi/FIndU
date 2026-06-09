import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';

export default function MobileHeader() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const name = profile?.full_name || user?.email || 'User';
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10">
          <span className="text-xs font-bold text-brand">C</span>
        </div>
        <span className="font-semibold text-[15px] text-gray-900 tracking-tight">Career OS</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand shadow-sm ring-1 ring-gray-100"
          style={{ backgroundColor: color.bg, color: color.text }}
          aria-label="User menu"
        >
          <span className="text-xs font-bold">{initials}</span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile?.role || 'User'}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/portfolio');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50 font-medium"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                View Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:bg-red-50 font-medium"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
