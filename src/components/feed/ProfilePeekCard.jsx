// ProfilePeekCard.jsx — desktop hover card showing user preview
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { useFeedStore } from '../../store/feedStore';

export default function ProfilePeekCard({ userId, anchorRect, onClose }) {
  const navigate = useNavigate();
  const openDMPanel = useFeedStore((s) => s.openDMPanel);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!userId) return;

    async function fetchProfile() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data) {
          setProfileData(data);

          // Check follow status
          const { data: follow } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', userId)
            .eq('following_id', userId)
            .maybeSingle();

          setIsFollowing(!!follow);
        }
      } catch (err) {
        console.error('Profile peek fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  if (loading || !profileData) return null;

  const color = getAvatarColor(profileData.full_name);

  // Position card near anchor element
  const style = anchorRect
    ? {
        top: anchorRect.bottom + 8,
        left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - 320)),
      }
    : {};

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className="fixed z-[80] w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 overflow-hidden"
        style={style}
        onMouseLeave={() => setTimeout(onClose, 200)}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {profileData.avatar_url ? (
            <img
              src={profileData.avatar_url}
              alt={profileData.full_name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: color.bg, color: color.text }}
            >
              {getInitials(profileData.full_name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{profileData.full_name}</h4>
            <p className="text-xs text-gray-500 truncate">{profileData.headline}</p>
            {profileData.location && (
              <p className="text-[10px] text-gray-400 mt-0.5">📍 {profileData.location}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => {
              if (isFollowing) return;
              setIsFollowing(true);
              // Fire and forget
              supabase.from('user_follows').insert({
                follower_id: userId, following_id: profileData.id,
              }).catch(() => setIsFollowing(false));
            }}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isFollowing
                ? 'bg-gray-100 text-gray-500'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            {isFollowing ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={() => openDMPanel({ id: profileData.id, full_name: profileData.full_name })}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </button>
        </div>

        {/* View profile link */}
        <button
          onClick={() => { navigate(`/portfolio/${profileData.id}`); onClose(); }}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Profile
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
