// feedConstants.js — shared enums, config values, and design tokens for the feed system

// ─── Character Limits ────────────────────────────────────────
export const MAX_POST_CHARS = 500;
export const MAX_COMMENT_CHARS = 300;
export const CHAR_WARN_PERCENT = 0.8;
export const CHAR_DANGER_PERCENT = 0.95;

// ─── Post Intent Types ──────────────────────────────────────
export const POST_INTENTS = [
  { key: 'hiring',      emoji: '🔥', label: 'Hiring' },
  { key: 'open_to_work', emoji: '🙋', label: 'Open to Work' },
  { key: 'sharing',     emoji: '📢', label: 'Sharing' },
  { key: 'asking',      emoji: '❓', label: 'Asking' },
  { key: 'celebrating', emoji: '🎉', label: 'Celebrating' },
];

// ─── Post Types ─────────────────────────────────────────────
export const POST_TYPES = {
  DEFAULT: 'default',
  MILESTONE: 'milestone',
  POLL: 'poll',
  JOB: 'job',
  ARTICLE: 'article',
  PORTFOLIO: 'portfolio',
  CANDIDATE_SPOTLIGHT: 'candidate_spotlight',
  EVENT: 'event',
  QUOTE_REPOST: 'quote_repost',
};

// ─── Visibility Options ─────────────────────────────────────
export const VISIBILITY_OPTIONS = [
  { key: 'public', label: 'Public', icon: '🌐' },
  { key: 'connections', label: 'Connections Only', icon: '🔗' },
];

// ─── Reaction Types ─────────────────────────────────────────
export const REACTION_TYPES = [
  { key: 'like',        emoji: '👍', label: 'Like' },
  { key: 'congrats',    emoji: '👏', label: 'Congrats' },
  { key: 'insightful',  emoji: '💡', label: 'Insightful' },
  { key: 'impressive',  emoji: '🔥', label: 'Impressive' },
  { key: 'connect',     emoji: '🤝', label: 'Connect' },
  { key: 'love',        emoji: '❤️', label: 'Love' },
];

// ─── Poll Expiry Options ────────────────────────────────────
export const POLL_EXPIRY_OPTIONS = [
  { key: '1d', label: '1 day',  hours: 24 },
  { key: '3d', label: '3 days', hours: 72 },
  { key: '7d', label: '7 days', hours: 168 },
];

// ─── Report Reasons ─────────────────────────────────────────
export const REPORT_REASONS = [
  { key: 'spam',            label: 'Spam' },
  { key: 'misinformation',  label: 'Misinformation' },
  { key: 'harassment',      label: 'Harassment' },
  { key: 'inappropriate',   label: 'Inappropriate' },
  { key: 'fake_account',    label: 'Fake Account' },
  { key: 'other',           label: 'Other' },
];

// ─── Mute Duration Options ──────────────────────────────────
export const MUTE_DURATIONS = [
  { key: '1w',      label: '1 week',   days: 7 },
  { key: '1m',      label: '1 month',  days: 30 },
  { key: 'forever', label: 'Forever',  days: null },
];

// ─── Feed Filter Pills ─────────────────────────────────────
export const FEED_FILTER_PILLS = [
  { key: 'media',      emoji: '📷', label: 'Media' },
  { key: 'polls',      emoji: '📊', label: 'Polls' },
  { key: 'milestones', emoji: '🎉', label: 'Milestones' },
  { key: 'events',     emoji: '📅', label: 'Events' },
];

// ─── Feed Sort Options ──────────────────────────────────────
export const FEED_SORT_OPTIONS = [
  { key: 'latest',  label: 'Latest' },
  { key: 'top',     label: 'Top' },
  { key: 'closest', label: 'Closest' },
];

// ─── Feed Sub-Feed Modes ────────────────────────────────────
export const SUB_FEED_MODES = {
  FOR_YOU: 'for_you',
  FOLLOWING: 'following',
};

// ─── Comment Sort Options ───────────────────────────────────
export const COMMENT_SORT_OPTIONS = [
  { key: 'top',    label: 'Top' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
];

// ─── Keyboard Shortcuts ─────────────────────────────────────
export const KEYBOARD_SHORTCUTS = [
  { key: 'n', label: 'New post',           action: 'composer' },
  { key: 'j', label: 'Next post',          action: 'next' },
  { key: 'k', label: 'Previous post',      action: 'prev' },
  { key: 'l', label: 'Like / React',       action: 'react' },
  { key: 'r', label: 'Reply / Comment',    action: 'reply' },
  { key: 'b', label: 'Bookmark',           action: 'bookmark' },
  { key: '/', label: 'Focus search',       action: 'search' },
  { key: '?', label: 'Show shortcuts',     action: 'help' },
];

// ─── Media Config ───────────────────────────────────────────
export const MEDIA_CONFIG = {
  MAX_IMAGES: 4,
  MAX_VIDEO_SIZE_MB: 100,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DOC_SIZE_MB: 25,
  ACCEPTED_IMAGES: { 'image/jpeg': [], 'image/png': [], 'image/gif': [], 'image/webp': [] },
  ACCEPTED_VIDEO: { 'video/mp4': [], 'video/webm': [], 'video/quicktime': [] },
  ACCEPTED_DOCS: { 'application/pdf': [] },
};

// ─── Presence / Typing ──────────────────────────────────────
export const TYPING_TIMEOUT_MS = 3000;
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ─── Pagination ─────────────────────────────────────────────
export const POSTS_PER_PAGE = 20;
export const COMMENTS_INITIAL = 3;
export const REPLIES_INITIAL = 2;

// ─── Thread ─────────────────────────────────────────────────
export const MAX_THREAD_CARDS = 10;
