// MentionDropdown.jsx — @mention autocomplete dropdown
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { getInitials, getAvatarColor } from '../../../lib/avatarUtils';

export default function MentionDropdown({ query, onSelect, visible }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible || !query || query.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, headline, avatar_url')
          .ilike('full_name', `%${query}%`)
          .limit(6);
        setResults(data || []);
      } catch (err) {
        console.error('Mention search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, visible]);

  if (!visible || results.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-1 z-50 w-72 max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 py-1"
    >
      {results.map((user) => {
        const color = getAvatarColor(user.full_name);
        return (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors text-left focus-visible:outline-none"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: color.bg, color: color.text }}
              >
                {getInitials(user.full_name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-400 truncate">{user.headline}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
