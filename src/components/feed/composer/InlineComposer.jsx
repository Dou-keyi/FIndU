// InlineComposer.jsx — desktop inline composer wrapping ComposerCore
import React from 'react';
import { getInitials, getAvatarColor } from '../../../lib/avatarUtils';
import { useAuth } from '../../../hooks/useAuth';
import ComposerCore from './ComposerCore';

export default function InlineComposer({ onPostCreated }) {
  const { profile } = useAuth();
  const displayName = profile?.full_name || 'You';
  const avatarColor = getAvatarColor(displayName);

  return (
    <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-6 mb-2 transition-shadow hover:shadow-md">
      <div className="flex gap-3">
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
          >
            {getInitials(displayName)}
          </div>
        )}

        {/* Composer */}
        <div className="flex-1 min-w-0">
          <ComposerCore
            onPostCreated={onPostCreated}
            compact
          />
        </div>
      </div>
    </div>
  );
}
