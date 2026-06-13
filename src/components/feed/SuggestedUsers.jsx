import React, { useState, useEffect } from 'react';
import { Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { getAvatarColor, getInitials } from '../../lib/avatarUtils';

export default function SuggestedUsers() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!user) return;
      
      try {
        // 1. Get who we are following
        const { data: followingData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);
          
        const followingIds = new Set(followingData?.map(f => f.following_id) || []);
        followingIds.add(user.id); // Also exclude ourselves
        
        // 2. Fetch some profiles
        // We'll just fetch a bunch of profiles ordered by created_at desc for now
        // since random() is not natively supported without RPC
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, headline, avatar_url')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        // 3. Filter and pick top 3
        const candidates = profiles.filter(p => !followingIds.has(p.id));
        
        // Shuffle candidates simple
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        
        setSuggestions(candidates.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSuggestions();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          Suggested for you <Sparkles className="w-4 h-4 text-violet-500" />
        </h3>
        <div className="flex justify-center py-4">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        Suggested for you <Sparkles className="w-4 h-4 text-violet-500" />
      </h3>
      
      <div className="space-y-4">
        {suggestions.map((profile) => {
          const colors = getAvatarColor(profile.full_name);
          return (
            <div key={profile.id} className="flex items-center justify-between group">
              <a href={`/profile/${profile.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(profile.full_name)
                  )}
                </div>
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                    {profile.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {profile.headline || 'Member'}
                  </p>
                </div>
              </a>
              
              <button 
                className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center flex-shrink-0 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                title="Follow"
                onClick={async () => {
                  // Optimistic follow UI would go here in a real implementation
                  await supabase.from('followers').insert({ follower_id: user.id, following_id: profile.id });
                  setSuggestions(prev => prev.filter(p => p.id !== profile.id));
                }}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
