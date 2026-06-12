// feedStore.js — Zustand store for feed-wide state management
import { create } from 'zustand';
import { SUB_FEED_MODES } from '../lib/feedConstants';

export const useFeedStore = create((set, get) => ({
  // ─── Posts ────────────────────────────────────
  posts: [],
  jobs: [],
  topJobs: [],
  initialLoading: true,
  loadingMore: false,
  hasMore: true,
  page: 0,

  setPosts: (posts) => set({ posts }),
  appendPosts: (newPosts) => set((s) => ({ posts: [...s.posts, ...newPosts] })),
  prependPosts: (newPosts) => set((s) => ({ posts: [...newPosts, ...s.posts] })),
  updatePost: (postId, updater) =>
    set((s) => ({
      posts: s.posts.map((p) => (p.id === postId ? { ...p, ...updater(p) } : p)),
    })),
  removePost: (postId) =>
    set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) })),
  setJobs: (jobs) => set({ jobs }),
  setTopJobs: (topJobs) => set({ topJobs }),
  setInitialLoading: (v) => set({ initialLoading: v }),
  setLoadingMore: (v) => set({ loadingMore: v }),
  setHasMore: (v) => set({ hasMore: v }),
  setPage: (v) => set({ page: v }),
  incrementPage: () => set((s) => ({ page: s.page + 1 })),

  // ─── Tabs & Filters ──────────────────────────
  activeTab: 'all',
  subFeedMode: localStorage.getItem('feedSubMode') || SUB_FEED_MODES.FOR_YOU,
  activeFilters: [],
  sortBy: 'latest',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSubFeedMode: (mode) => {
    localStorage.setItem('feedSubMode', mode);
    set({ subFeedMode: mode });
  },
  toggleFilter: (filter) =>
    set((s) => ({
      activeFilters: s.activeFilters.includes(filter)
        ? s.activeFilters.filter((f) => f !== filter)
        : [...s.activeFilters, filter],
    })),
  setSortBy: (sort) => set({ sortBy: sort }),

  // ─── Search Bar ──────────────────────────────
  searchQuery: '',
  searchTags: [],
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchTags: (tags) => set({ searchTags: tags }),
  addSearchTag: (tag) => set((s) => {
    const cleanTag = tag.replace(/^#/, '').toLowerCase();
    if (s.searchTags.includes(cleanTag)) return s;
    return { searchTags: [...s.searchTags, cleanTag] };
  }),
  removeSearchTag: (tag) => set((s) => ({
    searchTags: s.searchTags.filter(t => t !== tag)
  })),

  // ─── Focused Post (keyboard nav) ─────────────
  focusedIndex: -1,
  setFocusedIndex: (i) => set({ focusedIndex: i }),
  focusNext: () =>
    set((s) => ({
      focusedIndex: Math.min(s.focusedIndex + 1, s.posts.length - 1),
    })),
  focusPrev: () =>
    set((s) => ({
      focusedIndex: Math.max(s.focusedIndex - 1, 0),
    })),

  // ─── Real-time New Posts Buffer ───────────────
  newPostsBuffer: [],
  pushNewPost: (post) =>
    set((s) => ({ newPostsBuffer: [post, ...s.newPostsBuffer] })),
  flushNewPosts: () =>
    set((s) => ({
      posts: [...s.newPostsBuffer, ...s.posts],
      newPostsBuffer: [],
    })),
  clearNewPosts: () => set({ newPostsBuffer: [] }),

  // ─── Composer State ──────────────────────────
  composerOpen: false,
  setComposerOpen: (v) => set({ composerOpen: v }),

  // ─── Comments Open Map ────────────────────────
  openComments: {},
  toggleComments: (postId) =>
    set((s) => ({
      openComments: {
        ...s.openComments,
        [postId]: !s.openComments[postId],
      },
    })),

  // ─── DM Panel ─────────────────────────────────
  dmPanelOpen: false,
  dmAttachedPost: null,
  dmRecipient: null,
  openDMPanel: (recipient = null, post = null) =>
    set({ dmPanelOpen: true, dmRecipient: recipient, dmAttachedPost: post }),
  closeDMPanel: () =>
    set({ dmPanelOpen: false, dmAttachedPost: null, dmRecipient: null }),

  // ─── Sheets ───────────────────────────────────
  jobDetailNode: null,
  applyConfirmNode: null,
  insightsPostId: null,
  bookmarksOpen: false,
  reportTarget: null,
  whyTarget: null,
  shortcutsModalOpen: false,

  setJobDetailNode: (v) => set({ jobDetailNode: v }),
  setApplyConfirmNode: (v) => set({ applyConfirmNode: v }),
  setInsightsPostId: (v) => set({ insightsPostId: v }),
  setBookmarksOpen: (v) => set({ bookmarksOpen: v }),
  setReportTarget: (v) => set({ reportTarget: v }),
  setWhyTarget: (v) => set({ whyTarget: v }),
  setShortcutsModalOpen: (v) => set({ shortcutsModalOpen: v }),
}));
