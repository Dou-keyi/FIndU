// PortfolioHeader.jsx — profile header for portfolio page (own or read-only view)
import React, { useState } from 'react';
import { Pencil, MapPin, Check, X, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInitials, getAvatarColor } from '../../lib/avatarUtils';
import { supabase } from '../../lib/supabase';

export default function PortfolioHeader({ profile, isOwn, onProfileUpdate }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editHeadline, setEditHeadline] = useState(profile?.headline || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const initials = getInitials(profile?.full_name);
  const avatarColor = getAvatarColor(profile?.full_name);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim(), headline: editHeadline.trim(), phone: editPhone.trim() })
        .eq('id', profile.id);

      if (!error) {
        onProfileUpdate?.({ ...profile, full_name: editName.trim(), headline: editHeadline.trim(), phone: editPhone.trim() });
        setEditing(false);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Edit toggle — own portfolio only */}
      {isOwn && !editing && (
        <button
          onClick={() => setEditing(true)}
          className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Edit profile"
        >
          <Pencil className="w-4 h-4 text-gray-400" />
        </button>
      )}

      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ring-4 ring-white shadow-md"
          style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
        >
          {initials}
        </div>

        {/* Name */}
        {editing ? (
          <input
            className="text-xl font-bold text-gray-900 text-center border-b-2 border-brand focus:outline-none mb-1 w-full max-w-xs"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
        ) : (
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">{profile?.full_name || 'Unknown'}</h1>
        )}

        {/* Headline */}
        {editing ? (
          <input
            className="text-sm text-gray-500 text-center border-b border-gray-300 focus:outline-none focus:border-brand mb-2 w-full max-w-xs"
            value={editHeadline}
            onChange={(e) => setEditHeadline(e.target.value)}
          />
        ) : (
          <p className="text-sm text-gray-500 mb-2">{profile?.headline}</p>
        )}

        {/* Phone Edit */}
        {editing && (
          <input
            className="text-sm text-gray-500 text-center border-b border-gray-300 focus:outline-none focus:border-brand mb-2 w-full max-w-xs"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="Phone number"
          />
        )}

        {/* Edit save/cancel */}
        {editing && (
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditName(profile?.full_name || '');
                setEditHeadline(profile?.headline || '');
                setEditPhone(profile?.phone || '');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        )}

        {/* Location + work type + phone */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-3">
          {profile?.phone && !editing && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Phone className="w-3 h-3" />
              {profile.phone}
            </span>
          )}
          {profile?.location && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {profile.location}
            </span>
          )}
          {(profile?.work_type || []).map((wt) => (
            <span
              key={wt}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100"
            >
              {wt.charAt(0).toUpperCase() + wt.slice(1)}
            </span>
          ))}
        </div>

        {/* Skills */}
        {(profile?.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand border border-brand-200"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
