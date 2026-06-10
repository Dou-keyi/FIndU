// CommentComposer.jsx — inline comment input with @mentions and emoji
import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { getInitials, getAvatarColor } from '../../../lib/avatarUtils';
import { MAX_COMMENT_CHARS } from '../../../lib/feedConstants';

export default function CommentComposer({ postId, parentId = null, onCommentCreated }) {
  const { user, profile } = useAuth();
  const [body, setBody] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const displayName = profile?.full_name || 'You';
  const color = getAvatarColor(displayName);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!body.trim() || !user || submitting) return;
    setSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if attached
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `comments/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('post-media')
          .upload(path, imageFile);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_id: parentId,
          user_id: user.id,
          body: body.trim(),
          image_url: imageUrl,
        })
        .select(`
          *,
          author:profiles!user_id(id, full_name, headline, avatar_url, role)
        `)
        .single();

      if (error) throw error;

      onCommentCreated?.(data);
      setBody('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2.5">
      {/* Avatar */}
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {getInitials(displayName)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Input */}
        <div className="relative bg-gray-50 rounded-xl border border-gray-100 focus-within:border-violet-200 focus-within:ring-1 focus-within:ring-violet-200 transition-all">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => {
              if (e.target.value.length <= MAX_COMMENT_CHARS) setBody(e.target.value);
            }}
            placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
            className="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent px-3 py-2 focus:outline-none resize-none min-h-[36px] max-h-[100px]"
            rows={1}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="px-3 pb-2">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Attachment"
                  className="h-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white flex items-center justify-center text-[8px]"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="flex items-center gap-0.5">
              <label className="p-1 rounded text-gray-400 hover:text-violet-600 cursor-pointer transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <button className="p-1 rounded text-gray-400 hover:text-violet-600 transition-colors">
                <Smile className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Post comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 mt-1 text-right">
          ⌘+Enter to submit
        </p>
      </div>
    </div>
  );
}
