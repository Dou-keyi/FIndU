// PortfolioPage.jsx — living portfolio with CRUD, AI suggestions, and employer read-only view
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioSuggestion } from '../context/PortfolioSuggestionContext';
import { supabase } from '../lib/supabase';
import PortfolioHeader from '../components/portfolio/PortfolioHeader';
import PortfolioItemCard from '../components/portfolio/PortfolioItemCard';
import PortfolioItemForm from '../components/portfolio/PortfolioItemForm';
import AISuggestionBanner from '../components/portfolio/AISuggestionBanner';
import MessageRequestSheet from '../components/messaging/MessageRequestSheet';

export default function PortfolioPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { suggestion, clearSuggestion } = usePortfolioSuggestion();

  const [targetProfile, setTargetProfile] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Message request state
  const [employerJob, setEmployerJob] = useState(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);

  // Determine if viewing own portfolio
  const isOwn = !candidateId || candidateId === user?.id;
  const targetId = isOwn ? user?.id : candidateId;

  // Employer redirect: if employer with no candidateId, redirect to company page
  useEffect(() => {
    if (!loading && profile?.role === 'employer' && isOwn) {
      // Find employer's company
      supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]?.id) {
            navigate(`/company/${data[0].id}`, { replace: true });
          }
        });
    }
  }, [profile, isOwn, loading, user, navigate]);

  // Load profile and portfolio items
  const loadData = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      // Fetch target profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (profErr) throw profErr;
      setTargetProfile(profData);

      // Fetch portfolio items
      const { data: items, error: itemsErr } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('candidate_id', targetId)
        .order('created_at', { ascending: false });

      if (itemsErr) throw itemsErr;
      setPortfolioItems(items || []);

      // If employer viewing candidate, get employer's active job for context
      if (!isOwn && profile?.role === 'employer') {
        const { data: jobData } = await supabase
          .from('jobs')
          .select('id, title')
          .eq('posted_by', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (jobData) setEmployerJob(jobData);
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle profile inline edit
  const handleProfileUpdate = (updatedProfile) => {
    setTargetProfile(updatedProfile);
  };

  // Save portfolio item (create or update)
  const handleSaveItem = async (itemData) => {
    if (!user) return;
    try {
      if (itemData.id) {
        // Update existing
        const { error } = await supabase
          .from('portfolio_items')
          .update({
            item_type: itemData.item_type,
            title: itemData.title,
            description: itemData.description,
            tags: itemData.tags,
          })
          .eq('id', itemData.id);

        if (error) throw error;
        setPortfolioItems((prev) =>
          prev.map((i) => (i.id === itemData.id ? { ...i, ...itemData } : i))
        );
      } else {
        // Create new
        const { data, error } = await supabase
          .from('portfolio_items')
          .insert({
            candidate_id: user.id,
            item_type: itemData.item_type,
            title: itemData.title,
            description: itemData.description,
            tags: itemData.tags,
            source: 'manual',
          })
          .select()
          .single();

        if (error) throw error;
        setPortfolioItems((prev) => [data, ...prev]);
      }

      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to save portfolio item:', err);
    }
  };

  // Delete portfolio item
  const handleDeleteItem = async (item) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      setPortfolioItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error('Failed to delete portfolio item:', err);
    }
  };

  // Accept AI suggestion
  const handleAcceptSuggestion = async (sugg) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert({
          candidate_id: user.id,
          item_type: sugg.item_type,
          title: sugg.title,
          description: sugg.description,
          tags: sugg.tags || [],
          source: 'ai_suggestion',
        })
        .select()
        .single();

      if (error) throw error;
      setPortfolioItems((prev) => [data, ...prev]);
      clearSuggestion();
    } catch (err) {
      console.error('Failed to accept AI suggestion:', err);
    }
  };

  // Edit item
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handle messaging a candidate
  const handleMessageClick = async () => {
    // 1. Check if there's an existing match
    try {
      const { data: matchData } = await supabase
        .from('matches')
        .select('message_threads(id)')
        .eq('candidate_id', targetId)
        .eq('employer_id', user.id)
        .limit(1)
        .single();
        
      if (matchData?.message_threads?.[0]?.id) {
        // We have a match + thread, go straight there
        navigate('/messaging', { state: { openThreadId: matchData.message_threads[0].id } });
      } else {
        // No match, open request sheet
        setShowRequestSheet(true);
      }
    } catch (e) {
      // On error or no data, open request sheet
      setShowRequestSheet(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex flex-col">
      {/* Top bar (Desktop Context) */}
      <header className="hidden md:block bg-white border-b border-gray-100 px-4 py-3 z-20 sticky top-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {isOwn ? 'My Portfolio' : `${targetProfile?.full_name || 'Candidate'}'s Portfolio`}
          </h2>
          {!isOwn && profile?.role === 'employer' && (
            <button
              onClick={handleMessageClick}
              className="px-4 py-1.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
            >
              Message Candidate
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
          
          {/* Top Section: Profile */}
          <div className="space-y-6">
            {/* AI Suggestion Banner — own portfolio only */}
            {isOwn && suggestion?.suggest && (
              <AISuggestionBanner
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={clearSuggestion}
              />
            )}

            {/* Profile header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PortfolioHeader
                profile={targetProfile}
                isOwn={isOwn}
                onProfileUpdate={handleProfileUpdate}
              />
              
              {/* Mobile Message Button */}
              {!isOwn && profile?.role === 'employer' && (
                <div className="md:hidden mt-4">
                  <button
                    onClick={handleMessageClick}
                    className="w-full py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-md"
                  >
                    Message Candidate
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* Bottom Section: Portfolio Items */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Experience & Work</h3>
              {isOwn && !showForm && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowForm(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand hover:bg-brand-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add item
                </button>
              )}
            </div>

            {/* Inline form */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <PortfolioItemForm
                  initialData={editingItem}
                  onSave={handleSaveItem}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                />
              </motion.div>
            )}

            {/* Items list */}
            <div className="space-y-3">
              {portfolioItems.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  {isOwn ? 'No portfolio items yet. Add your first one!' : 'No portfolio items to show.'}
                </p>
              ) : (
                portfolioItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PortfolioItemCard
                      item={item}
                      isOwn={isOwn}
                      onEdit={handleEdit}
                      onDelete={handleDeleteItem}
                    />
                  </motion.div>
                ))
              )}
            </div>

            {/* Add item button at bottom — own portfolio */}
            {isOwn && !showForm && portfolioItems.length > 0 && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
                className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-400 hover:border-brand-300 hover:text-brand transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add another item
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Message Request Sheet */}
      <MessageRequestSheet
        isOpen={showRequestSheet}
        onClose={() => setShowRequestSheet(false)}
        candidateId={targetId}
        candidateName={targetProfile?.full_name}
        employerJobId={employerJob?.id}
        employerJobTitle={employerJob?.title}
        userId={user?.id}
      />
    </div>
  );
}
