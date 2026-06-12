// ComposerCore.jsx — shared composer logic used by both InlineComposer and PostComposerSheet
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image, Video, FileText, LinkIcon, BarChart3, MapPin,
  Clock, Bold, Italic, List, AtSign, Hash, Loader2, Plus,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { createPost } from '../../../lib/feedData';
import { generatePortfolioSuggestion } from '../../../lib/portfolioSuggestion';
import { usePortfolioSuggestion } from '../../../context/PortfolioSuggestionContext';
import { MAX_POST_CHARS, MEDIA_CONFIG, POLL_EXPIRY_OPTIONS } from '../../../lib/feedConstants';
import CharacterRing from './CharacterRing';
import IntentBadgeSelector from './IntentBadgeSelector';
import AudienceSelector from './AudienceSelector';
import PollCreator from './PollCreator';
import MediaGrid from './MediaGrid';
import MentionDropdown from './MentionDropdown';
import DraftBanner from './DraftBanner';

const DRAFT_KEY = 'findu_post_draft';

export default function ComposerCore({
  onPostCreated,
  onClose,
  compact = false,
  expanded = false,
  className = '',
}) {
  const { user, profile } = useAuth();
  const { setSuggestion } = usePortfolioSuggestion();
  const textareaRef = useRef(null);
  const role = profile?.role || 'candidate';

  // ─── Core state ──────────────────────────────
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  // ─── Post metadata ───────────────────────────
  const [intent, setIntent] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // ─── Media ───────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState([]);

  // ─── Link preview ────────────────────────────
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkDismissed, setLinkDismissed] = useState(false);

  // ─── Poll ────────────────────────────────────
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiry, setPollExpiry] = useState('1d');

  // ─── Mention autocomplete ────────────────────
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  // ─── Draft ───────────────────────────────────
  const [hasDraft, setHasDraft] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);

  // ─── Expanded tools ──────────────────────────
  const [showTools, setShowTools] = useState(false);

  // Check for saved draft on mount
  useEffect(() => {
    if (draftChecked) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.content?.trim()) {
          setHasDraft(true);
        }
      }
    } catch {}
    setDraftChecked(true);
  }, [draftChecked]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!content.trim()) return;
    const interval = setInterval(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        content, intent, visibility, location, scheduledAt,
        pollQuestion, pollOptions, pollExpiry, showPoll,
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, [content, intent, visibility, location, scheduledAt, pollQuestion, pollOptions, pollExpiry, showPoll]);

  // Auto-expand textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const lineH = 20;
      const maxH = lineH * 8;
      el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    }
  }, []);

  useEffect(() => { autoResize(); }, [content, autoResize]);

  // URL auto-detection
  useEffect(() => {
    if (linkDismissed) return;
    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    if (urlMatch && !linkPreview) {
      // Simulate OG fetch (in production, call a Supabase Edge Function)
      const url = urlMatch[0];
      setLinkPreview({
        url,
        title: null,
        description: null,
        image: null,
      });
    }
  }, [content, linkPreview, linkDismissed]);

  // Detect @mention trigger
  const handleContentChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_POST_CHARS) {
      setContent(val);
    }

    // Check for @mention
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (selectedUser) => {
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);
    const mentionStart = textBefore.lastIndexOf('@');
    const mentionText = `@[${selectedUser.full_name}](${selectedUser.id}) `;
    const newContent = textBefore.slice(0, mentionStart) + mentionText + textAfter;
    setContent(newContent);
    setShowMentions(false);
    textarea.focus();
  };

  // Resume draft
  const handleResumeDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (draft) {
        setContent(draft.content || '');
        setIntent(draft.intent || null);
        setVisibility(draft.visibility || 'public');
        setLocation(draft.location || '');
        setScheduledAt(draft.scheduledAt || '');
        if (draft.showPoll) {
          setShowPoll(true);
          setPollQuestion(draft.pollQuestion || '');
          setPollOptions(draft.pollOptions || ['', '']);
          setPollExpiry(draft.pollExpiry || '1d');
        }
      }
    } catch {}
    setHasDraft(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // Media handlers
  const handleAddMedia = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files
      .slice(0, MEDIA_CONFIG.MAX_IMAGES - mediaFiles.length)
      .map((f) => ({ file: f, type: f.type, preview: URL.createObjectURL(f), alt: '' }));
    setMediaFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async () => {
    if (!content.trim() || !user || posting) return;
    setPosting(true);

    try {
      let companyId = null;
      if (role === 'employer') {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);
        companyId = companies?.[0]?.id || null;
      }

      // Extract hashtags from content
      const tags = content.match(/#[\w]+/g)?.map((t) => t.replace('#', '')) || [];

      // Upload media files to Supabase Storage
      const uploadedUrls = [];
      const uploadedTypes = [];
      for (const mf of mediaFiles) {
        const ext = mf.file.name.split('.').pop();
        const path = `posts/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploaded, error: uploadErr } = await supabase.storage
          .from('post-media')
          .upload(path, mf.file);

        if (uploadErr) {
          console.error('Upload failed:', uploadErr);
          continue;
        }

        const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
        uploadedTypes.push(mf.type);
      }

      // Build post data
      const postData = {
        author_id: user.id,
        company_id: companyId,
        content: content.trim(),
        hashtags: tags,
        post_type: role === 'employer' ? 'company' : 'candidate',
        intent: intent || undefined,
        visibility,
        location: location || undefined,
        scheduled_at: scheduledAt || undefined,
        media_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        media_types: uploadedTypes.length > 0 ? uploadedTypes : undefined,
        link_preview: linkPreview && !linkDismissed ? linkPreview : undefined,
        type: showPoll ? 'poll' : 'default',
      };

      // Remove undefined fields
      Object.keys(postData).forEach((k) => postData[k] === undefined && delete postData[k]);

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          *,
          author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
          company:companies!company_id(id, name, logo_url)
        `)
        .single();

      if (error) throw error;

      // Create poll if needed
      if (showPoll && pollQuestion.trim() && newPost) {
        const expiryHours = POLL_EXPIRY_OPTIONS.find((o) => o.key === pollExpiry)?.hours || 24;
        const expiresAt = new Date(Date.now() + expiryHours * 3600000).toISOString();

        const { data: poll } = await supabase
          .from('polls')
          .insert({ post_id: newPost.id, question: pollQuestion.trim(), expires_at: expiresAt })
          .select()
          .single();

        if (poll) {
          const optionsToInsert = pollOptions
            .filter((o) => o.trim())
            .map((text, i) => ({ poll_id: poll.id, text: text.trim(), position: i }));
          await supabase.from('poll_options').insert(optionsToInsert);
        }
      }

      if (newPost) {
        onPostCreated?.(newPost);

        // Candidate portfolio suggestion
        if (role === 'candidate') {
          const { data: items } = await supabase
            .from('portfolio_items')
            .select('item_type, title')
            .eq('candidate_id', user.id);

          generatePortfolioSuggestion(content.trim(), items || []).then((result) => {
            if (result?.suggest) setSuggestion(result);
          });
        }

        // Clear everything
        setContent('');
        setIntent(null);
        setLocation('');
        setScheduledAt('');
        setMediaFiles([]);
        setLinkPreview(null);
        setLinkDismissed(false);
        setShowPoll(false);
        setPollQuestion('');
        setPollOptions(['', '']);
        localStorage.removeItem(DRAFT_KEY);
        onClose?.();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPosting(false);
    }
  };

  const canPost = content.trim().length > 0 && !posting;

  return (
    <div className={className}>
      {/* Draft banner */}
      {hasDraft && (
        <DraftBanner onResume={handleResumeDraft} onDiscard={handleDiscardDraft} />
      )}

      {/* Audience + Character ring row */}
      <div className="flex items-center justify-between mb-2">
        <AudienceSelector value={visibility} onChange={setVisibility} />
        <CharacterRing current={content.length} max={MAX_POST_CHARS} />
      </div>

      {/* Textarea with mention dropdown */}
      <div className={`relative ${expanded ? 'flex-1 flex flex-col' : ''}`}>
        <textarea
          ref={textareaRef}
          className={`w-full resize-none text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed ${
            expanded ? 'text-lg lg:text-xl font-medium flex-1' : 'text-sm'
          }`}
          placeholder={expanded ? "What do you want to talk about?" : "Share an update, milestone, or question…"}
          value={content}
          onChange={handleContentChange}
          style={{ minHeight: expanded ? '250px' : compact ? '48px' : '80px' }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <MentionDropdown
          query={mentionQuery}
          onSelect={handleMentionSelect}
          visible={showMentions}
        />
      </div>

      {/* Intent badges */}
      <div className="mb-3">
        <IntentBadgeSelector selected={intent} onSelect={setIntent} />
      </div>

      {/* Media previews */}
      <MediaGrid files={mediaFiles} onRemove={handleRemoveMedia} />

      {/* Link preview */}
      {linkPreview && !linkDismissed && (
        <div className="relative border border-gray-100 rounded-xl p-3 mb-3 bg-gray-50/50">
          <button
            onClick={() => setLinkDismissed(true)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 text-gray-400"
          >
            ✕
          </button>
          <p className="text-xs text-gray-500 truncate">{linkPreview.url}</p>
          {linkPreview.title && (
            <p className="text-sm font-semibold text-gray-800 mt-1">{linkPreview.title}</p>
          )}
        </div>
      )}

      {/* Poll creator */}
      {showPoll && (
        <div className="mb-3">
          <PollCreator
            question={pollQuestion}
            options={pollOptions}
            expiry={pollExpiry}
            onQuestionChange={setPollQuestion}
            onOptionChange={(i, val) => {
              const next = [...pollOptions];
              next[i] = val;
              setPollOptions(next);
            }}
            onAddOption={() => setPollOptions((prev) => [...prev, ''])}
            onRemoveOption={(i) => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))}
            onExpiryChange={setPollExpiry}
            onRemovePoll={() => setShowPoll(false)}
          />
        </div>
      )}

      {/* Location */}
      {location !== null && showTools && (
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Add location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="text-xs border-b border-gray-200 py-1 focus:outline-none focus:border-violet-500 flex-1 placeholder-gray-400"
          />
        </div>
      )}

      {/* Schedule */}
      {scheduledAt !== null && showTools && (
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      )}

      {/* Toolbar + Submit */}
      <div className={`flex items-center justify-between pt-3 border-t border-gray-50 ${expanded ? 'mt-auto' : ''}`}>
        <div className="flex items-center gap-0.5">
          {/* Image upload */}
          <label className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer">
            <Image className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleAddMedia}
            />
          </label>

          {/* Video upload */}
          <label className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer">
            <Video className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleAddMedia}
            />
          </label>

          {/* Document upload */}
          <label className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer">
            <FileText className="w-4 h-4" />
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleAddMedia}
            />
          </label>

          {/* Poll toggle */}
          <button
            onClick={() => setShowPoll((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${
              showPoll ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'
            }`}
            aria-label="Add poll"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* More tools toggle */}
          <button
            onClick={() => setShowTools((v) => !v)}
            className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-violet-600 hover:bg-violet-50 ${
              showTools ? 'text-violet-600 bg-violet-50' : ''
            }`}
            aria-label="More options"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canPost}
          className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {scheduledAt ? 'Schedule' : 'Post'}
        </button>
      </div>
    </div>
  );
}
