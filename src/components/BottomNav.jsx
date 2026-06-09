// BottomNav.jsx — fixed bottom navigation bar with 5 route icons
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe2, Newspaper, FileText, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCounts } from '../lib/messagingData';

const NAV_ITEMS = [
  { path: '/globe', icon: Globe2, label: 'Globe' },
  { path: '/feed', icon: Newspaper, label: 'Feed' },
  { path: '/portfolio', icon: FileText, label: 'Portfolio' },
  { path: '/messaging', icon: MessageSquare, label: 'Messages' },
  { path: '/tracking', icon: Clock, label: 'Track' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      if (!user) return;
      const count = await getUnreadCounts(user.id);
      if (mounted) setUnreadCount(count);
    }
    fetchUnread();
    
    // Optional: could set up an interval or real-time sub here if needed, 
    // but fetching on mount/location change is a good start
  }, [user, location.pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-2 safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 60 }}
      role="navigation"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        const isActive = path === '/portfolio'
          ? location.pathname.startsWith('/portfolio') || location.pathname.startsWith('/company')
          : location.pathname === path;

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`
              relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5
              transition-colors duration-200 rounded-lg min-w-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
              ${isActive
                ? 'text-brand'
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
                aria-hidden="true"
              />
              {path === '/messaging' && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
              )}
            </div>
            <span
              className={`text-[10px] font-medium tracking-wide ${
                isActive ? 'font-semibold' : ''
              }`}
            >
              {label}
            </span>
            {isActive && (
              <span
                className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-brand"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
