// CommentItem.jsx — single comment with reactions, reply, and menu
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pin, MessageCircle } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../../lib/avatarUtils';
import { formatRelativeTime } from '../../../lib/relativeTime';
import { REACTION_TYPES } from '../../../lib/feedConstants';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import CommentComposer from './CommentComposer';

export default function CommentItem({ comment, postAuthorId, onReplyCreated, children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(comment._reactionCount || 0);
  const [showMenu, setShowMenu] = useState(false);

  const author = comment.author;
  const displayName = author?.full_name || 'Unknown';
  const avatarColor = getAvatarColor(displayName);
  const isPostAuthor = comment.user_id === postAuthorId;
  const isOwner = user?.id === comment.user_id;

  const [translatedData, setTranslatedData] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = async () => {
    if (!user || !author?.id || followLoading) return;
    setFollowLoading(true);
    try {
      const { error } = await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: author.id,
      });
      if (error && error.code !== '23505') throw error;
      setIsFollowing(true);
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleTranslate = async (e) => {
    e.stopPropagation();
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translatedData) {
      setShowTranslation(true);
      return;
    }
    setIsTranslating(true);
    try {
      const { translateText } = await import('../../../lib/translation');
      const targetLang = navigator.language.split('-')[0] || 'en';
      const result = await translateText(comment.body, targetLang);
      setTranslatedData({
        translated: result.translated,
        detectedLang: result.detectedLang
      });
      setShowTranslation(true);
    } catch (err) {
      console.error('Failed to translate comment:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReact = useCallback(async (type) => {
    if (!user) return;
    const prev = userReaction;

    setUserReaction(type);
    setReactionCount((c) => {
      if (type === null) return Math.max(0, c - 1);
      if (prev) return c;
      return c + 1;
    });

    try {
      if (type === null) {
        await supabase.from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
      } else if (prev) {
        await supabase.from('comment_reactions')
          .update({ type })
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
      } else {
        await supabase.from('comment_reactions')
          .insert({ comment_id: comment.id, user_id: user.id, type });
      }
    } catch (err) {
      setUserReaction(prev);
      console.error('Comment reaction failed:', err);
    }
  }, [user, userReaction, comment.id]);

  const handleDelete = async () => {
    try {
      await supabase.from('comments').delete().eq('id', comment.id);
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  return (
    <div className="group">
      <div className="flex gap-2.5">
        {/* Avatar */}
        <button
          onClick={() => author?.id && navigate(`/portfolio/${author.id}`)}
          className="flex-shrink-0 focus-visible:outline-none"
        >
          {author?.avatar_url ? (
            <img src={author.avatar_url} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {getInitials(displayName)}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Pinned label */}
          {comment.is_pinned && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold mb-1">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
          )}

          {/* Comment bubble */}
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <button
                onClick={() => author?.id && navigate(`/portfolio/${author.id}`)}
                className="text-xs font-bold text-gray-800 hover:text-violet-700 transition-colors"
              >
                {displayName}
              </button>
              {isPostAuthor && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700">
                  Author
                </span>
              )}
              <span className="text-[10px] text-gray-400">
                {formatRelativeTime(comment.created_at)}
              </span>
              
              {/* Inline Follow Button */}
              {!isOwner && (
                <>
                  <span className="text-gray-300 text-[10px]">•</span>
                  <button
                    onClick={isFollowing ? undefined : handleFollow}
                    disabled={followLoading || isFollowing}
                    className={`text-[10px] font-bold transition-colors ${
                      isFollowing ? 'text-gray-400 cursor-default' : 'text-violet-600 hover:text-violet-800'
                    }`}
                  >
                    {isFollowing ? 'Followed' : 'Follow'}
                  </button>
                </>
              )}
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {showTranslation && translatedData ? translatedData.translated : comment.body}
            </p>

            {/* Attached image */}
            {comment.image_url && (
              <img
                src={comment.image_url}
                alt="Comment attachment"
                className="mt-2 max-h-40 rounded-lg object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3 mt-1 ml-1">
            {/* Quick react */}
            <button
              onClick={() => handleReact(userReaction ? null : 'like')}
              className={`text-[11px] font-semibold transition-colors ${
                userReaction ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {userReaction
                ? REACTION_TYPES.find((r) => r.key === userReaction)?.emoji || '👍'
                : 'Like'}
              {reactionCount > 0 && (
                <span className="ml-0.5 text-gray-400">{reactionCount}</span>
              )}
            </button>

            {/* Reply button */}
            {!comment.parent_id && (
              <button
                onClick={() => setShowReplyComposer((v) => !v)}
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5"
              >
                <MessageCircle className="w-3 h-3" />
                Reply
              </button>
            )}

            {/* Translate button */}
            {comment.body && comment.body.length > 5 && (
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5"
              >
                {isTranslating ? 'Translating...' : showTranslation ? `See original (${translatedData.detectedLang.toUpperCase()})` : 'Translate'}
              </button>
            )}

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-0.5 rounded text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div className="absolute left-0 top-full mt-0.5 z-50 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                  {isOwner && (
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                  {!isOwner && (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply composer */}
          {showReplyComposer && (
            <div className="mt-2">
              <CommentComposer
                postId={comment.post_id}
                parentId={comment.id}
                onCommentCreated={(reply) => {
                  onReplyCreated?.(reply);
                  setShowReplyComposer(false);
                }}
              />
            </div>
          )}

          {/* Nested replies */}
          {children}
        </div>
      </div>
    </div>
  );
}
