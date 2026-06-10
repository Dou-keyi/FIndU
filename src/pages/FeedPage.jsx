// FeedPage.jsx — Responsive desktop-first social feed with 2-column layout on large screens
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, X, Loader2, Sparkles, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getFeedPosts, getFeedJobs, createPost } from '../lib/feedData';
import { generatePortfolioSuggestion } from '../lib/portfolioSuggestion';
import { usePortfolioSuggestion } from '../context/PortfolioSuggestionContext';
import { supabase } from '../lib/supabase';
import PostCard from '../components/feed/PostCard';
import PostComposerSheet from '../components/feed/PostComposerSheet';
import JobStripCard from '../components/feed/JobStripCard';
import FeedJobCard from '../components/feed/FeedJobCard';
import JobDetailModal from '../components/swipe/JobDetailModal';
import ApplyConfirmSheet from '../components/swipe/ApplyConfirmSheet';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'candidates', label: 'Candidates' },
  { key: 'companies', label: 'Companies' },
];

export default function FeedPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setSuggestion } = usePortfolioSuggestion();
  const role = profile?.role || 'candidate';

  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [topJobs, setTopJobs] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Mobile composer sheet
  const [composerOpen, setComposerOpen] = useState(false);
  
  // Inline desktop composer state
  const [inlineContent, setInlineContent] = useState('');
  const [inlinePosting, setInlinePosting] = useState(false);

  // Sheet state
  const [jobDetailNode, setJobDetailNode] = useState(null);
  const [applyConfirmNode, setApplyConfirmNode] = useState(null);

  // Hashtag filter from URL
  const hashtagFilter = searchParams.get('hashtag') || '';

  // Initial data load
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    async function fetchAll() {
      if (posts.length === 0 && jobs.length === 0) setInitialLoading(true);
      try {
        const [postsData, jobsData] = await Promise.all([
          getFeedPosts('all', hashtagFilter),
          getFeedJobs(profile),
        ]);
        if (cancelled) return;
        setPosts(postsData);
        setJobs(jobsData);
        setTopJobs(jobsData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [profile, hashtagFilter]);

  const displayedPosts = activeTab === 'all'
    ? posts
    : activeTab === 'candidates'
      ? posts.filter((p) => p.post_type === 'candidate')
      : activeTab === 'companies'
        ? posts.filter((p) => p.post_type === 'company')
        : posts;

  const clearHashtag = () => {
    searchParams.delete('hashtag');
    setSearchParams(searchParams);
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleJobApply = async (job) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('applications')
        .insert({ job_id: job.id, candidate_id: user.id });

      if (error && error.code !== '23505') throw error;
      setApplyConfirmNode({ ...job, title: job.title, company_name: job.company?.name });
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, has_applied: true } : j));
      setTopJobs(prev => prev.map(j => j.id === job.id ? { ...j, has_applied: true } : j));
      if (jobDetailNode?.id === job.id) {
        setJobDetailNode(prev => ({ ...prev, has_applied: true }));
      }
    } catch (err) {
      console.error('Failed to apply:', err);
    }
  };

  const openJobDetail = (job) => {
    setJobDetailNode({
      ...job,
      label: job.title,
      sublabel: job.company?.name,
      company_name: job.company?.name,
      skills_required: job.skills_required,
    });
  };

  // Handle inline composer submit
  const submitInlinePost = async () => {
    if (!inlineContent.trim() || !user || inlinePosting) return;
    setInlinePosting(true);
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

      // Very naive hashtag extraction for inline composer
      const tags = inlineContent.match(/#[\w]+/g)?.map(t => t.replace('#', '')) || [];
      
      const newPost = await createPost(
        user.id,
        inlineContent.trim(),
        tags,
        role === 'employer' ? 'company' : 'candidate',
        companyId
      );

      if (newPost) {
        handlePostCreated(newPost);
        if (role === 'candidate') {
          const { data: items } = await supabase.from('portfolio_items').select('item_type, title').eq('candidate_id', user.id);
          generatePortfolioSuggestion(inlineContent.trim(), items || []).then((result) => {
            if (result?.suggest) setSuggestion(result);
          });
        }
        setInlineContent('');
      }
    } finally {
      setInlinePosting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full min-w-0">
      {/* Mobile Floating Action Button (Hidden on lg) */}
      <div className="lg:hidden fixed bottom-[76px] right-4 z-40">
        <button
          onClick={() => setComposerOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:bg-brand-dark transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
          aria-label="Create new post"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Main Grid Layout for Desktop */}
      <div className="flex-1 lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:p-8 min-w-0">
        
        {/* CENTER COLUMN: Feed Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Tab bar — sticky */}
          <div className="sticky top-[56px] lg:top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm lg:shadow-none lg:rounded-t-2xl lg:px-2">
            <div className="flex lg:gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 lg:flex-none lg:px-6 py-3 text-xs lg:text-sm font-semibold text-center transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset ${
                    activeTab === tab.key
                      ? 'text-brand'
                      : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-1/2 lg:left-0 lg:w-full -translate-x-1/2 lg:translate-x-0 w-8 h-[2px] rounded-t-full bg-brand"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Inline Composer */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-6 mb-2">
            <textarea
              className="w-full resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-h-[60px]"
              placeholder="Share an update or milestone..."
              value={inlineContent}
              onChange={(e) => setInlineContent(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-3">
              <span className="text-[10px] text-gray-400">Use #hashtags to categorize</span>
              <button
                onClick={submitInlinePost}
                disabled={!inlineContent.trim() || inlinePosting}
                className="px-5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {inlinePosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Post
              </button>
            </div>
          </div>

          {/* Hashtag filter banner */}
          {hashtagFilter && (
            <div className="bg-violet-50/80 border border-violet-100 lg:rounded-xl px-4 py-3 lg:my-4 flex items-center justify-between">
              <span className="text-sm text-violet-700 font-medium flex items-center gap-1.5">
                <Hash className="w-4 h-4" /> Showing posts tagged <span className="font-bold">#{hashtagFilter}</span>
              </span>
              <button
                onClick={clearHashtag}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-violet-600 hover:bg-violet-100 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Clear
              </button>
            </div>
          )}

          {/* Feed Content Area */}
          <div className="flex-1 px-4 py-4 lg:px-0">
            {initialLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {/* ALL TAB */}
                {activeTab === 'all' && (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Mobile Only: Picked for you horizontal strip */}
                    {!hashtagFilter && topJobs.length > 0 && (
                      <div className="mb-6 lg:hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider text-balance">
                            Picked for you
                          </h2>
                        </div>
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
                          {topJobs.map((job) => (
                            <JobStripCard key={job.id} job={job} onClick={() => openJobDetail(job)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posts */}
                    {displayedPosts.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-12">No posts found. Be the first to share!</p>
                    ) : (
                      displayedPosts.map((post) => (
                        <PostCard key={post.id} post={post} viewerRole={role} />
                      ))
                    )}
                  </motion.div>
                )}

                {/* CANDIDATES / COMPANIES TABS */}
                {(activeTab === 'candidates' || activeTab === 'companies') && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {displayedPosts.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-12">No {activeTab} posts yet.</p>
                    ) : (
                      displayedPosts.map((post) => (
                        <PostCard key={post.id} post={post} viewerRole={role} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Desktop Context Sidebar */}
        <aside className="hidden lg:block w-80 space-y-6 pt-16">
          {!hashtagFilter && topJobs.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900 tracking-tight text-balance">
                  Picked for you
                </h2>
              </div>
              <div className="space-y-3">
                {topJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => openJobDetail(job)}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate group-hover:text-gray-500 transition-colors">
                      {job.company?.name || 'Company'}
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1 group-hover:text-brand transition-colors text-balance line-clamp-2">
                      {job.title}
                    </h4>
                    {job.salary_min && job.salary_max && (
                      <p className="text-xs font-semibold text-emerald-600">
                        {job.currency || 'MYR'} {(job.salary_min/1000).toFixed(0)}k – {(job.salary_max/1000).toFixed(0)}k
                      </p>
                    )}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => navigate('/globe')}
                className="w-full mt-4 py-2.5 text-xs font-semibold text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                View all jobs →
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile Post composer sheet */}
      <PostComposerSheet
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Sheets */}
      <JobDetailModal
        node={jobDetailNode}
        isOpen={!!jobDetailNode}
        onClose={() => setJobDetailNode(null)}
        onApply={() => {
          if (jobDetailNode) handleJobApply(jobDetailNode);
          setJobDetailNode(null);
        }}
      />
      <ApplyConfirmSheet
        node={applyConfirmNode}
        isOpen={!!applyConfirmNode}
        onClose={() => setApplyConfirmNode(null)}
      />
    </div>
  );
}
