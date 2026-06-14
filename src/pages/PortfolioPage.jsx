// PortfolioPage.jsx — Resume-style portfolio with multiple layout templates and PDF export
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, Trash2, Download, Upload, Palette, Sparkles, CheckCircle2,
  X, Check, MessageSquare, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioSuggestion } from '../context/PortfolioSuggestionContext';
import { supabase } from '../lib/supabase';
import { getInitials, getAvatarColor } from '../lib/avatarUtils';
import AISuggestionBanner from '../components/portfolio/AISuggestionBanner';
import ImportResumeModal from '../components/portfolio/ImportResumeModal';
import MessageRequestSheet from '../components/messaging/MessageRequestSheet';
import ProfessionalLayout from '../components/portfolio/layouts/ProfessionalLayout';
import CreativeLayout from '../components/portfolio/layouts/CreativeLayout';
import MinimalLayout from '../components/portfolio/layouts/MinimalLayout';
import { ALL_SECTIONS } from '../components/portfolio/layouts/SharedComponents';


/* ═══════════════════════════════════════════════════════
   Main PortfolioPage Component
   ═══════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { suggestion, clearSuggestion } = usePortfolioSuggestion();

  const [targetProfile, setTargetProfile] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionOrder, setSectionOrder] = useState(ALL_SECTIONS);

  // Template Switcher state
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
  const [changingTemplate, setChangingTemplate] = useState(false);

  // Accent Color state
  const CURATED_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f97316', '#64748b'];
  const [savingAccent, setSavingAccent] = useState(false);
  const [customHex, setCustomHex] = useState('');

  // Header Color state
  const CURATED_GRADIENTS = [
    'linear-gradient(135deg, #1e293b, #0f172a)', // Slate
    'linear-gradient(135deg, #4c1d95, #7c3aed)', // Purple
    'linear-gradient(135deg, #166534, #10b981)', // Green
    'linear-gradient(135deg, #9f1239, #f43f5e)', // Rose
    'linear-gradient(135deg, #ea580c, #f97316)', // Orange
    'linear-gradient(135deg, #0ea5e9, #3b82f6)', // Ocean
    'linear-gradient(135deg, #171717, #404040)', // Neutral
  ];
  const [savingHeaderColor, setSavingHeaderColor] = useState(false);
  const [customHeaderColor1, setCustomHeaderColor1] = useState('');
  const [customHeaderColor2, setCustomHeaderColor2] = useState('');

  // Inline editing state
  const [addingType, setAddingType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Profile inline editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Skills inline editing
  const [editingSkills, setEditingSkills] = useState(false);
  const [editSkillsInput, setEditSkillsInput] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  // Avatar upload
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Import resume state
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Message request state
  const [employerJob, setEmployerJob] = useState(null);
  const [showRequestSheet, setShowRequestSheet] = useState(false);

  const isOwn = !candidateId || candidateId === user?.id;
  const targetId = isOwn ? user?.id : candidateId;

  // Employer redirect
  useEffect(() => {
    if (!loading && profile?.role === 'employer' && isOwn) {
      supabase.from('companies').select('id').eq('owner_id', user.id).limit(1)
        .then(({ data }) => { if (data?.[0]?.id) navigate(`/company/${data[0].id}`, { replace: true }); });
    }
  }, [profile, isOwn, loading, user, navigate]);

  // Load data
  const loadData = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const { data: profData, error: profErr } = await supabase
        .from('profiles').select('*').eq('id', targetId).single();
      if (profErr) throw profErr;
      setTargetProfile(profData);

      const { data: items, error: itemsErr } = await supabase
        .from('portfolio_items').select('*').eq('candidate_id', targetId)
        .order('created_at', { ascending: true });
      if (itemsErr) throw itemsErr;
      setPortfolioItems(items || []);

      const { data: tmplData } = await supabase
        .from('resume_templates')
        .select('*')
        .or(`candidate_id.is.null,candidate_id.eq.${targetId}`);
      setTemplates(tmplData || []);

      if (!isOwn && profile?.role === 'employer') {
        const { data: jobData } = await supabase
          .from('jobs').select('id, title').eq('posted_by', user.id)
          .eq('status', 'open').order('created_at', { ascending: false }).limit(1).single();
        if (jobData) setEmployerJob(jobData);
      }
    } catch (err) { console.error('Failed to load portfolio:', err); }
    finally { setLoading(false); }
  }, [targetId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Sync edit fields when profile loads
  useEffect(() => {
    if (targetProfile) {
      setEditName(targetProfile.full_name || '');
      setEditHeadline(targetProfile.headline || '');
      setEditPhone(targetProfile.phone || '');
      setEditLocation(targetProfile.location || '');
      setEditSkillsInput(''); // Clear input when profile loads
      setCustomHex(targetProfile.resume_accent_color || '');
      
      const headerColor = targetProfile.resume_header_color || '';
      if (headerColor.includes('linear-gradient')) {
        const matches = headerColor.match(/#([0-9a-fA-F]{6})/g);
        if (matches && matches.length >= 2) {
          setCustomHeaderColor1(matches[0]);
          setCustomHeaderColor2(matches[1]);
        }
      } else {
        setCustomHeaderColor1(headerColor);
        setCustomHeaderColor2('');
      }

      if (targetProfile.resume_section_order && Array.isArray(targetProfile.resume_section_order)) {
        // Only use valid sections from ALL_SECTIONS
        const validOrder = targetProfile.resume_section_order.filter(s => ALL_SECTIONS.includes(s));
        // Add any missing sections
        const missing = ALL_SECTIONS.filter(s => !validOrder.includes(s));
        setSectionOrder([...validOrder, ...missing]);
      } else {
        setSectionOrder(ALL_SECTIONS);
      }
    }
  }, [targetProfile]);

  /* ─── CRUD handlers ─── */
  const handleSaveItem = async (itemData) => {
    if (!user) return;
    try {
      if (itemData.id) {
        const { error } = await supabase.from('portfolio_items')
          .update({ item_type: itemData.item_type, title: itemData.title, description: itemData.description, tags: itemData.tags })
          .eq('id', itemData.id);
        if (error) throw error;
        setPortfolioItems((prev) => prev.map((i) => (i.id === itemData.id ? { ...i, ...itemData } : i)));
      } else {
        const { data, error } = await supabase.from('portfolio_items')
          .insert({ candidate_id: user.id, item_type: itemData.item_type, title: itemData.title, description: itemData.description, tags: itemData.tags, source: 'manual' })
          .select().single();
        if (error) throw error;
        setPortfolioItems((prev) => [...prev, data]);
      }
      setAddingType(null);
      setEditingItem(null);
    } catch (err) { console.error('Save failed:', err); }
  };

  const handleDeleteItem = async (item) => {
    try {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', item.id);
      if (error) throw error;
      setPortfolioItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleAcceptSuggestion = async (sugg) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('portfolio_items')
        .insert({ candidate_id: user.id, item_type: sugg.item_type, title: sugg.title, description: sugg.description, tags: sugg.tags || [], source: 'ai_suggestion' })
        .select().single();
      if (error) throw error;
      setPortfolioItems((prev) => [...prev, data]);
      clearSuggestion();
    } catch (err) { console.error('Accept suggestion failed:', err); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { error } = await supabase.from('profiles')
        .update({ full_name: editName.trim(), headline: editHeadline.trim(), phone: editPhone.trim(), location: editLocation.trim() })
        .eq('id', targetProfile.id);
      if (!error) {
        setTargetProfile((p) => ({ ...p, full_name: editName.trim(), headline: editHeadline.trim(), phone: editPhone.trim(), location: editLocation.trim() }));
        setEditingProfile(false);
      }
    } catch (err) { console.error('Profile update failed:', err); }
    finally { setSavingProfile(false); }
  };

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const newSkills = editSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const existingSkills = targetProfile.skills || [];
      const mergedSkills = [...new Set([...existingSkills, ...newSkills])];

      const { error } = await supabase.from('profiles')
        .update({ skills: mergedSkills })
        .eq('id', targetProfile.id);
      if (!error) {
        setTargetProfile((p) => ({ ...p, skills: mergedSkills }));
        setEditingSkills(false);
        setEditSkillsInput('');
      }
    } catch (err) { console.error('Skills update failed:', err); }
    finally { setSavingSkills(false); }
  };

  const handleDeleteSkill = async (skillToRemove) => {
    try {
      const newSkills = (targetProfile.skills || []).filter(s => s !== skillToRemove);
      const { error } = await supabase.from('profiles')
        .update({ skills: newSkills })
        .eq('id', targetProfile.id);
      if (!error) {
        setTargetProfile((p) => ({ ...p, skills: newSkills }));
      }
    } catch (err) { console.error('Delete skill failed:', err); }
  };

  // Message handler
  const handleMessageClick = async () => {
    try {
      const { data: matchData } = await supabase
        .from('matches').select('message_threads(id)')
        .eq('candidate_id', targetId).eq('employer_id', user.id).limit(1).single();
      if (matchData?.message_threads?.[0]?.id) {
        navigate('/messaging', { state: { openThreadId: matchData.message_threads[0].id } });
      } else { setShowRequestSheet(true); }
    } catch { setShowRequestSheet(true); }
  };

  const saveSectionOrderTimeout = useRef(null);
  const handleSaveSectionOrder = (newOrder) => {
    if (!isOwn) return;
    if (saveSectionOrderTimeout.current) clearTimeout(saveSectionOrderTimeout.current);
    saveSectionOrderTimeout.current = setTimeout(async () => {
      try {
        await supabase.from('profiles').update({ resume_section_order: newOrder }).eq('id', user.id);
      } catch (err) {
        console.error('Failed to save section order:', err);
      }
    }, 500);
  };

  /* ─── Resume import handler ─── */
  const handleResumeImport = async (parsedData) => {
    if (!user) return;
    try {
      // Bulk insert all parsed section items
      const itemsToInsert = [];
      for (const [type, items] of Object.entries(parsedData.sections || {})) {
        for (const item of items || []) {
          if (!item.title) continue;
          itemsToInsert.push({
            candidate_id: user.id,
            item_type: type,
            title: item.title,
            description: item.description || null,
            tags: item.tags || [],
            source: 'import',
          });
        }
      }

      if (itemsToInsert.length > 0) {
        const { data: inserted, error } = await supabase
          .from('portfolio_items')
          .insert(itemsToInsert)
          .select();
        if (error) throw error;
        setPortfolioItems((prev) => [...prev, ...(inserted || [])]);
      }

      // Update profile fields if detected
      const profileUpdates = {};
      if (parsedData.profile?.full_name && !targetProfile?.full_name) {
        profileUpdates.full_name = parsedData.profile.full_name;
      }
      if (parsedData.profile?.headline && !targetProfile?.headline) {
        profileUpdates.headline = parsedData.profile.headline;
      }
      if (parsedData.profile?.phone && !targetProfile?.phone) {
        profileUpdates.phone = parsedData.profile.phone;
      }
      if (parsedData.profile?.location && !targetProfile?.location) {
        profileUpdates.location = parsedData.profile.location;
      }

      // Merge skills (union of existing + imported)
      if (parsedData.skills?.length > 0) {
        const existingSkills = targetProfile?.skills || [];
        const merged = [...new Set([...existingSkills, ...parsedData.skills])];
        profileUpdates.skills = merged;
      }

      // Save scanned template if detected
      if (parsedData.scannedTemplate) {
        const t = parsedData.scannedTemplate;
        const { error: tmplError } = await supabase
          .from('resume_templates')
          .insert({
            id: t.id,
            name: t.name || 'Scanned Template',
            description: t.description || 'Custom template from upload',
            gradient: t.gradient || 'from-gray-800 to-gray-600',
            accent: t.accent || '#4b5563',
            custom_css: t.custom_css || null,
            icon: t.icon || 'Layout',
            candidate_id: user.id
          });

        if (!tmplError) {
          // Set this template as active and add it to local state
          profileUpdates.resume_template = t.id;
          setTemplates(prev => [...prev, {
            id: t.id,
            name: t.name || 'Scanned Template',
            description: t.description || 'Custom template from upload',
            gradient: t.gradient || 'from-gray-800 to-gray-600',
            accent: t.accent || '#4b5563',
            custom_css: t.custom_css || null,
            icon: t.icon || 'Layout',
            candidate_id: user.id
          }]);
        } else {
          console.warn('Failed to save scanned template:', tmplError);
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profErr } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
        if (!profErr) {
          setTargetProfile((p) => ({ ...p, ...profileUpdates }));
        }
      }
    } catch (err) {
      console.error('Resume import failed:', err);
    }
  };

  /* ─── Helpers ─── */
  const itemsByType = (type) => portfolioItems.filter((i) => i.item_type === type);
  const initials = getInitials(targetProfile?.full_name);
  const avatarColor = getAvatarColor(targetProfile?.full_name);

  const handleExportPDF = () => { window.print(); };

  const handleChangeTemplate = async (templateId) => {
    setChangingTemplate(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ resume_template: templateId })
        .eq('id', user.id);
      if (error) throw error;
      setTargetProfile(p => ({ ...p, resume_template: templateId }));
    } catch (err) {
      console.error('Template change failed:', err);
    } finally {
      setChangingTemplate(false);
    }
  };

  const handleSaveAccentColor = async (color) => {
    setSavingAccent(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ resume_accent_color: color })
        .eq('id', user.id);
      if (error) throw error;
      setTargetProfile(p => ({ ...p, resume_accent_color: color }));
    } catch (err) {
      console.error('Accent color update failed:', err);
    } finally {
      setSavingAccent(false);
    }
  };

  const handleSaveHeaderColor = async (color) => {
    setSavingHeaderColor(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ resume_header_color: color })
        .eq('id', user.id);
      if (error) throw error;
      setTargetProfile(p => ({ ...p, resume_header_color: color }));
    } catch (err) {
      console.error('Header color update failed:', err);
    } finally {
      setSavingHeaderColor(false);
    }
  };

  /* ─── Delete all portfolio data ─── */
  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear ALL your portfolio information?\n\nThis will delete all resume sections, profile details (name, headline, phone, location), skills, and your avatar. This action cannot be undone.'
    );
    if (!confirmed || !user) return;

    setDeletingAll(true);
    try {
      // Delete all portfolio items
      const { error: itemsErr } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('candidate_id', user.id);
      if (itemsErr) throw itemsErr;

      // Reset profile fields
      const resetFields = {
        full_name: null,
        headline: null,
        phone: null,
        location: null,
        skills: [],
        avatar_url: null,
      };
      const { error: profErr } = await supabase
        .from('profiles')
        .update(resetFields)
        .eq('id', user.id);
      if (profErr) throw profErr;

      // Update local state
      setPortfolioItems([]);
      setTargetProfile((p) => ({ ...p, ...resetFields }));
      setEditName('');
      setEditHeadline('');
      setEditPhone('');
      setEditLocation('');
      setEditSkillsInput('');
      setEditingProfile(false);
      setEditingSkills(false);
      setAddingType(null);
      setEditingItem(null);
    } catch (err) {
      console.error('Delete all failed:', err);
    } finally {
      setDeletingAll(false);
    }
  };

  /* ─── Avatar upload handler ─── */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      console.error('Image too large — max 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // Update profile
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (profErr) throw profErr;

      setTargetProfile((p) => ({ ...p, avatar_url: publicUrl }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploadingAvatar(false);
      // Reset input so same file can be re-uploaded
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };


  /* ─── Loading state ─── */
  if (loading || (profile?.role === 'employer' && isOwn)) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  const activeTemplate = templates.find(t => t.id === targetProfile?.resume_template) || templates.find(t => t.id === 'professional') || {
    gradient: 'from-slate-800 to-slate-600',
    accent: '#3b82f6'
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-100 flex flex-col">
      {activeTemplate.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: activeTemplate.custom_css }} />
      )}
      {/* ── Action bar (hidden in print) ── */}
      <div className="resume-actions sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 no-print">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 px-2">
              {isOwn ? 'My Portfolio' : `${targetProfile?.full_name || 'Candidate'}'s Portfolio`}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isOwn && (
              <button onClick={handleDeleteAll} disabled={deletingAll}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Clear All
              </button>
            )}
            {isOwn && (
              <button onClick={() => setShowTemplateSwitcher(!showTemplateSwitcher)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${showTemplateSwitcher ? 'bg-brand-50 border-brand-200 text-brand' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                <Palette className="w-3.5 h-3.5" />
                Customize
              </button>
            )}
            {isOwn && (
              <button onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Import Resume
              </button>
            )}
            {!isOwn && profile?.role === 'employer' && (
              <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                <button
                  onClick={() => navigate('/globe')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Shortlist
                </button>
                <button
                  onClick={() => navigate('/globe')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Not a fit
                </button>
                <button onClick={handleMessageClick}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors shadow-sm shadow-brand/20">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Message
                </button>
              </div>
            )}
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Suggestion Banner ── */}
      {isOwn && suggestion?.suggest && (
        <div className="resume-page px-4 mt-4 no-print">
          <AISuggestionBanner suggestion={suggestion} onAccept={handleAcceptSuggestion} onDismiss={clearSuggestion} />
        </div>
      )}

      {/* ══ Resume Document — Layout Selector ══ */}
      <main className="flex-1 px-4 py-6 md:py-8 transition-all duration-300 flex justify-center">
        <div className="flex flex-col xl:flex-row items-center xl:items-start gap-6 w-full max-w-[1250px] justify-center relative">
          <div className="resume-page w-full min-w-0">
            {(() => {
              // Scanned/custom templates always use Professional layout
              // System templates use their specific layout
              const templateId = activeTemplate.id;
              const isScanned = !!activeTemplate.candidate_id;
              const activeAccent = targetProfile?.resume_accent_color || activeTemplate.accent;
              const activeHeaderColor = targetProfile?.resume_header_color || null;

              const layoutProps = {
                targetProfile, user, isOwn, activeTemplate, activeAccent, activeHeaderColor,
                portfolioItems, itemsByType,
                addingType, setAddingType,
                editingItem, setEditingItem,
                editingProfile, setEditingProfile,
                editingSkills, setEditingSkills,
                editSkillsInput, setEditSkillsInput,
                savingSkills, handleSaveSkills, handleDeleteSkill,
                editName, setEditName, editHeadline, setEditHeadline,
                editPhone, setEditPhone, editLocation, setEditLocation,
                savingProfile, handleSaveProfile,
                avatarInputRef, uploadingAvatar, handleAvatarUpload,
                handleSaveItem, handleDeleteItem,
                initials, avatarColor, navigate,
                sectionOrder, setSectionOrder, handleSaveSectionOrder
              };

              if (isScanned || templateId === 'professional' || !templateId) {
                return <ProfessionalLayout {...layoutProps} />;
              } else if (templateId === 'creative') {
                return <CreativeLayout {...layoutProps} />;
              } else if (templateId === 'minimal') {
                return <MinimalLayout {...layoutProps} />;
              } else {
                // Fallback: professional
                return <ProfessionalLayout {...layoutProps} />;
              }
            })()}
          </div>

          {/* ── Theme Settings Side Panel ── */}
          {isOwn && showTemplateSwitcher && (
            <aside className="fixed xl:sticky top-24 right-4 md:right-8 xl:right-auto w-80 shrink-0 bg-white shadow-2xl rounded-2xl border border-gray-200 z-50 flex flex-col max-h-[calc(100vh-8rem)] no-print animate-slide-in">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand" /> Theme Settings
            </h2>
            <button onClick={() => setShowTemplateSwitcher(false)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto hide-scrollbar space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Choose Template</h3>
              <div className="space-y-2">
                {templates.map(t => {
                  const isScanned = !!t.candidate_id;
                  const isActive = (targetProfile?.resume_template === t.id) || (!targetProfile?.resume_template && t.id === 'professional');
                  return (
                    <button key={t.id} onClick={() => handleChangeTemplate(t.id)} disabled={changingTemplate}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        isActive ? 'bg-brand-50 border-brand-200 ring-1 ring-brand/20' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center shrink-0 shadow-inner`}>
                          {isScanned && <Sparkles className="w-4 h-4 text-white/90" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-brand' : 'text-gray-900'}`}>
                              {t.name}
                            </p>
                            {isScanned && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-100 text-violet-600">
                                Scanned
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Theme Color */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Theme Color</h3>
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                {CURATED_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleSaveAccentColor(color)}
                    disabled={savingAccent}
                    className={`w-7 h-7 rounded-full shrink-0 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${
                      targetProfile?.resume_accent_color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">#</span>
                  <input
                    type="text"
                    placeholder="Hex color"
                    value={customHex.replace('#', '')}
                    onChange={(e) => setCustomHex('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && customHex.length === 7) handleSaveAccentColor(customHex); }}
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
                  />
                </div>
                <button
                  onClick={() => handleSaveAccentColor(customHex)}
                  disabled={savingAccent || customHex.length !== 7}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-900"
                >
                  {savingAccent ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {targetProfile?.resume_accent_color && (
                <button
                  onClick={() => { setCustomHex(''); handleSaveAccentColor(null); }}
                  className="mt-2 text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
                >
                  Reset to template default
                </button>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Header Color / Gradient */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Header Background</h3>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {CURATED_GRADIENTS.map(gradient => (
                  <button
                    key={gradient}
                    onClick={() => handleSaveHeaderColor(gradient)}
                    disabled={savingHeaderColor}
                    className={`w-7 h-7 rounded-full shrink-0 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 ${
                      targetProfile?.resume_header_color === gradient ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : ''
                    }`}
                    style={{ background: gradient }}
                    aria-label={`Select gradient`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">#</span>
                    <input
                      type="text"
                      placeholder="Color 1"
                      value={customHeaderColor1.replace('#', '')}
                      onChange={(e) => setCustomHeaderColor1('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                      className="w-full pl-6 pr-2 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">#</span>
                    <input
                      type="text"
                      placeholder="Color 2 (Opt)"
                      value={customHeaderColor2.replace('#', '')}
                      onChange={(e) => setCustomHeaderColor2('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6))}
                      className="w-full pl-6 pr-2 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {targetProfile?.resume_header_color ? (
                    <button
                      onClick={() => { setCustomHeaderColor1(''); setCustomHeaderColor2(''); handleSaveHeaderColor(null); }}
                      className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
                    >
                      Reset to template default
                    </button>
                  ) : <span />}
                  <button
                    onClick={() => {
                      const val = customHeaderColor2?.length === 7 
                        ? `linear-gradient(135deg, ${customHeaderColor1}, ${customHeaderColor2})`
                        : customHeaderColor1;
                      handleSaveHeaderColor(val);
                    }}
                    disabled={savingHeaderColor || customHeaderColor1.length !== 7}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-900"
                  >
                    {savingHeaderColor ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
        </div>
      </main>

      {/* Import Resume Modal */}
      <ImportResumeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleResumeImport}
      />

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
