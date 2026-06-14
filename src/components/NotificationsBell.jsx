// NotificationsBell — bell + unread badge + dropdown, backed by the notifications table.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserPlus, Briefcase, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatRelativeTime } from '../lib/relativeTime';

const ICONS = { join: UserPlus, applicant: Briefcase, message: MessageSquare, status: CheckCircle, system: Bell };

export default function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, type, body, link, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setItems(data || []);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const unread = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
  };

  const handleClick = async (n) => {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    setOpen(false);
    if (!n.read) await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button onClick={() => { setOpen((v) => !v); if (!open) fetchItems(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        aria-label="Notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-80 max-w-[88vw] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">Notifications</p>
              {unread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-brand hover:text-brand-dark">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications.</p>
              ) : (
                items.map((n) => {
                  const Icon = ICONS[n.type] || Bell;
                  return (
                    <button key={n.id} onClick={() => handleClick(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${n.read ? '' : 'bg-brand-50/40'}`}>
                      <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.body}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
