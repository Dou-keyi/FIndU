import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Global Store & Hooks ---
import { useAuth } from '../hooks/useAuth';
import { useFeedStore } from '../store/feedStore';
import { useFeedRealtime } from '../hooks/useFeedRealtime';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useInfiniteScroll } from '../hooks/useIntersectionObserver';
import { useReducedMotion } from '../hooks/useReducedMotion';

// --- Data Fetching ---
import { supabase } from '../lib/supabase';

// --- Sub-components ---
import FeedFilters from '../components/feed/FeedFilters';
import NewPostsPill from '../components/feed/NewPostsPill';
import PostCard from '../components/feed/post/PostCard';
import { PostSkeletonList } from '../components/feed/post/PostSkeleton';
import CaughtUpCard from '../components/feed/CaughtUpCard';
import ProfilePeekCard from '../components/feed/ProfilePeekCard';

// --- Sheets & Modals ---
import ReportSheet from '../components/feed/moderation/ReportSheet';
import WhyShowingSheet from '../components/feed/moderation/WhyShowingSheet';
import PostInsightsSheet from '../components/feed/PostInsightsSheet';
import BookmarksSheet from '../components/feed/BookmarksSheet';
import DMPanel from '../components/feed/DMPanel';
import KeyboardShortcutsModal from '../components/feed/KeyboardShortcuts';

export default function FeedPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const prefersReduced = useReducedMotion();

  // URL Params
  const hashtagFilter = searchParams.get('hashtag');

  // Global State (Zustand)
  const posts = useFeedStore((s) => s.posts);
  const setPosts = useFeedStore((s) => s.setPosts);
  const appendPosts = useFeedStore((s) => s.appendPosts);
  const pushNewPost = useFeedStore((s) => s.pushNewPost);
  const subFeedMode = useFeedStore((s) => s.subFeedMode);
  const activeFilters = useFeedStore((s) => s.activeFilters);
  const sortBy = useFeedStore((s) => s.sortBy);
  const composerOpen = useFeedStore((s) => s.composerOpen);
  const setComposerOpen = useFeedStore((s) => s.setComposerOpen);

  // Sheets state
  const reportTarget = useFeedStore((s) => s.reportTarget);
  const setReportTarget = useFeedStore((s) => s.setReportTarget);
  const whyTarget = useFeedStore((s) => s.whyTarget);
  const setWhyTarget = useFeedStore((s) => s.setWhyTarget);
  const insightsPostId = useFeedStore((s) => s.insightsPostId);
  const setInsightsPostId = useFeedStore((s) => s.setInsightsPostId);

  // Local state
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Hover card state
  const [peekUser, setPeekUser] = useState(null);
  const [peekAnchor, setPeekAnchor] = useState(null);
  const peekTimer = useRef(null);

  // Initialize Global Hooks
  useFeedRealtime();
  useKeyboardShortcuts();

  // Fetch posts logic
  const fetchPosts = useCallback(async (pageNum = 0, isAppend = false) => {
    if (!user) return;
    try {
      isAppend ? setLoadingMore(true) : setLoading(true);

      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
          company:companies!company_id(id, name, logo_url),
          poll:polls(*, options:poll_options(*), votes:poll_votes(*)),
          job:jobs(*, company:companies!company_id(id, name, logo_url)),
          quoted_post:posts!quoted_post_id(
            *,
            author:profiles!author_id(id, full_name, headline, avatar_url, skills, role),
            company:companies!company_id(id, name, logo_url)
          )
        `);

      // Apply Hashtag Filter
      if (hashtagFilter) {
        query = query.contains('hashtags', [hashtagFilter]);
      }

      // Apply Sub-Feed Mode
      if (subFeedMode === 'following') {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        if (following && following.length > 0) {
          const ids = following.map(f => f.following_id);
          query = query.in('author_id', ids);
        } else {
          // Following nobody, return empty
          if (!isAppend) setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }

      // Apply Type Filters
      if (activeFilters.length > 0) {
        const mappedTypes = [];
        if (activeFilters.includes('polls')) mappedTypes.push('poll');
        if (activeFilters.includes('milestones')) mappedTypes.push('milestone');
        if (activeFilters.includes('events')) mappedTypes.push('event');

        const wantsMedia = activeFilters.includes('media');

        if (mappedTypes.length > 0 && wantsMedia) {
          query = query.or(`type.in.(${mappedTypes.join(',')}),media_urls.neq.{}`);
        } else if (mappedTypes.length > 0) {
          query = query.in('type', mappedTypes);
        } else if (wantsMedia) {
          query = query.neq('media_urls', '{}');
        }
      }

      // Pagination & Sorting
      const PAGE_SIZE = 15;
      query = query.range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (sortBy === 'latest' || sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'top') {
        query = query.order('view_count', { ascending: false });
      } else if (sortBy === 'closest') {
        // Mock sorting by proximity if location exists. In real app, this requires PostGIS
        query = query.order('created_at', { ascending: false }); 
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isAppend) {
        appendPosts(data || []);
      } else {
        setPosts(data || []);
      }
      setPage(pageNum);

    } catch (err) {
      console.error('Fetch posts error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, hashtagFilter, subFeedMode, activeFilters, sortBy, appendPosts, setPosts]);

  // Initial fetch and dependency trigger
  useEffect(() => {
    fetchPosts(0, false);
  }, [fetchPosts]);

  // Infinite Scroll Hook
  const sentinelRef = useInfiniteScroll(
    () => {
      if (!loading && !loadingMore && hasMore) {
        fetchPosts(page + 1, true);
      }
    },
    { enabled: hasMore && !loading }
  );

  // Profile Peek Hover Handlers
  const handleMouseOver = useCallback((e) => {
    // Only trigger on desktop
    if (window.innerWidth < 1024) return;
    
    // Find closest anchor tag or button with a data-user-id attribute
    // In our new components, we need to ensure profile links set data-user-id
    const target = e.target.closest('[data-user-id]');
    if (target) {
      const uid = target.getAttribute('data-user-id');
      if (uid && uid !== user?.id) {
        clearTimeout(peekTimer.current);
        peekTimer.current = setTimeout(() => {
          setPeekUser(uid);
          setPeekAnchor(target.getBoundingClientRect());
        }, 500); // 500ms delay
      }
    }
  }, [user?.id]);

  const handleMouseOut = useCallback((e) => {
    clearTimeout(peekTimer.current);
    // Let ProfilePeekCard handle its own mouseLeave to close
  }, []);

  return (
    <div 
      className="max-w-7xl mx-auto px-0 lg:px-6 py-4 lg:py-8 lg:grid lg:grid-cols-[1fr_320px] gap-8 items-start min-h-screen"
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      {/* ─── MAIN COLUMN ─── */}
      <main className="w-full max-w-2xl mx-auto lg:mx-0 relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between px-4 pb-4 sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Feed <Sparkles className="w-5 h-5 text-violet-500" />
          </h1>
        </div>

        {/* Filters */}
        <div className="sticky top-[105px] lg:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 pb-2 pt-2 lg:pt-0 -mx-4 px-4 lg:mx-0 lg:px-0 lg:border-none lg:bg-transparent">
          <FeedFilters />
        </div>

        {/* Desktop Inline Composer has been moved to /create-post */}

        {/* New Posts Notification Pill */}
        <NewPostsPill />

        {/* Feed Content */}
        <div className="mt-4 lg:mt-6 space-y-4 px-2 lg:px-0 pb-24">
          
          {loading ? (
            <PostSkeletonList count={4} />
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">It's quiet here</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {subFeedMode === 'following' 
                  ? "You aren't following anyone with active posts. Follow more people to populate this feed."
                  : "No posts found matching your current filters."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {posts.map((post, idx) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  index={idx} 
                />
              ))}
            </AnimatePresence>
          )}

          {/* Infinite Scroll Sentinel / Loading More */}
          {hasMore && !loading && (
            <div ref={sentinelRef} className="py-6 flex justify-center">
              <div className="spinner" />
            </div>
          )}

          {/* Caught Up Card */}
          {!hasMore && !loading && posts.length > 0 && (
            <div className="pt-4 pb-12">
              <CaughtUpCard />
            </div>
          )}

        </div>

      </main>

      {/* ─── DESKTOP RIGHT SIDEBAR ─── */}
      <aside className="hidden lg:flex flex-col gap-6 sticky top-24">
        {/* Placeholder for trending tags, suggested connections, etc. */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            Trending <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <div className="space-y-3">
            {['#hiring', '#reactjs', '#design', '#frontend'].map((tag) => (
              <a href={`/feed?hashtag=${encodeURIComponent(tag.replace('#', ''))}`} key={tag} className="flex justify-between items-center group">
                <span className="text-sm font-semibold text-gray-600 group-hover:text-violet-600 transition-colors">{tag}</span>
                <span className="text-xs text-gray-400">🔥</span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="text-xs text-gray-400 font-medium flex flex-wrap gap-x-3 gap-y-2 px-2">
          <a href="#" className="hover:text-gray-600 transition-colors">About</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Accessibility</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Help Center</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy & Terms</a>
          <div className="w-full mt-2 flex items-center gap-1.5">
            <span className="text-gray-500">© 2026 Antigravity</span>
          </div>
          <div className="w-full mt-1">
            <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Press <kbd className="font-mono">Shift + ?</kbd> for shortcuts</span>
          </div>
        </div>
      </aside>

      {/* ─── MOBILE FAB ─── */}
      <button
        onClick={() => window.location.href = '/create-post'}
        className="lg:hidden fixed bottom-[72px] right-4 z-40 w-14 h-14 bg-brand text-white rounded-full shadow-xl flex items-center justify-center hover:bg-brand-dark transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        aria-label="Create Post"
      >
        <Edit3 className="w-6 h-6" />
      </button>

      {/* ─── GLOBALLY MOUNTED SHEETS / MODALS ─── */}

      {/* DM Panel */}
      <DMPanel />

      {/* Bookmarks Collections */}
      <BookmarksSheet 
        isOpen={useFeedStore((s) => s.bookmarksSheetOpen)} 
        onClose={() => useFeedStore.getState().setBookmarksSheetOpen(false)} 
      />

      {/* Post Insights */}
      <PostInsightsSheet 
        postId={insightsPostId}
        isOpen={!!insightsPostId}
        onClose={() => setInsightsPostId(null)}
      />

      {/* Moderation: Report & Mute */}
      <ReportSheet 
        target={reportTarget}
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
      />

      {/* Transparency */}
      <WhyShowingSheet 
        targetPost={whyTarget}
        isOpen={!!whyTarget}
        onClose={() => setWhyTarget(null)}
      />

      {/* Profile Peek (Desktop Hover Card) */}
      <ProfilePeekCard 
        userId={peekUser}
        anchorRect={peekAnchor}
        onClose={() => { setPeekUser(null); setPeekAnchor(null); }}
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcutsModal />

    </div>
  );
}
