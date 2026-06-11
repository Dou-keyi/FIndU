// PortfolioPage.jsx — Resume-style portfolio with two-column layout and PDF export
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Loader2, Pencil, Trash2, Check, X, Download, Upload, Camera,
  MapPin, Phone, Mail, Sparkles,
  GraduationCap, Briefcase, Award, ShieldCheck, Languages,
  Heart, User, FileText, ChevronLeft, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePortfolioSuggestion } from '../context/PortfolioSuggestionContext';
import { supabase } from '../lib/supabase';
import { getInitials, getAvatarColor } from '../lib/avatarUtils';
import AISuggestionBanner from '../components/portfolio/AISuggestionBanner';
import ImportResumeModal from '../components/portfolio/ImportResumeModal';
import MessageRequestSheet from '../components/messaging/MessageRequestSheet';

/* ─── Section configuration ─── */
const SECTION_META = {
  summary:       { label: 'Summary',            icon: User },
  education:     { label: 'Education',           icon: GraduationCap },
  experience:    { label: 'Working Experience',  icon: Briefcase },
  project:       { label: 'Projects',            icon: FileText },
  achievement:   { label: 'Achievements',        icon: Award },
  certification: { label: 'Certifications',      icon: ShieldCheck },
  language:      { label: 'Languages',           icon: Languages },
  hobby:         { label: 'Hobbies',             icon: Heart },
};

// Sections displayed in the dark left sidebar
const LEFT_SECTIONS  = ['language', 'certification'];
// Sections displayed in the white right content area
const RIGHT_SECTIONS = ['summary', 'education', 'experience', 'project', 'achievement'];

/* ─── Inline edit form (compact, for adding/editing items) ─── */
function InlineItemForm({ type, initialData, onSave, onCancel }) {
  const [title, setTitle]       = useState(initialData?.title || '');
  const [description, setDesc]  = useState(initialData?.description || '');
  const [tags, setTags]         = useState(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving]     = useState(false);

  const labels = {
    summary:       { title: 'Summary heading',  desc: 'Write your professional summary…',          showTags: false },
    education:     { title: 'Degree / Program',  desc: 'Institution, coursework, details…',         showTags: true, tagHint: 'e.g. Aug 2020 – Jul 2024' },
    experience:    { title: 'Company / Role',    desc: 'Responsibilities and achievements…',        showTags: true, tagHint: 'e.g. Jan 2023 – Present' },
    project:       { title: 'Project name',      desc: 'What the project is about…',                showTags: true, tagHint: 'e.g. React, Node.js' },
    achievement:   { title: 'Achievement',       desc: 'Details…',                                  showTags: false },
    certification: { title: 'Certification name', desc: 'Issuing organisation / details…',          showTags: true, tagHint: 'e.g. 2024' },
    language:      { title: 'Language',          desc: 'Proficiency level (e.g. Fluent, Native)…',  showTags: false },
    hobby:         { title: 'Hobby / Interest',  desc: '',                                          showTags: false },
  };
  const l = labels[type] || labels.project;

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const v = tagInput.trim();
      if (v && !tags.includes(v)) setTags([...tags, v]);
      setTagInput('');
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave?.({
        item_type: type,
        title: title.trim(),
        description: description.trim() || null,
        tags,
        ...(initialData?.id ? { id: initialData.id } : {}),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-2 mt-2 no-print">
      <input
        className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        placeholder={l.title}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      {l.desc && (
        <textarea
          className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          placeholder={l.desc}
          rows={2}
          value={description}
          onChange={(e) => setDesc(e.target.value)}
        />
      )}
      {l.showTags && (
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand border border-brand-200">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
          <input
            className="w-full px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            placeholder={l.tagHint || 'Press Enter to add tags'}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
          />
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button onClick={handleSubmit} disabled={!title.trim() || saving}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {initialData?.id ? 'Update' : 'Save'}
        </button>
        <button onClick={onCancel}
          className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Section Header with accent underline ─── */
function ResumeSectionHeader({ type, isOwn, onAdd, dark = false }) {
  const meta = SECTION_META[type];
  if (!meta) return null;

  return (
    <div className={`resume-section-header ${dark ? 'resume-section-header--dark' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-extrabold uppercase tracking-widest ${dark ? 'text-white' : 'text-gray-900'}`}>
          {meta.label}
        </h3>
        {isOwn && (
          <button onClick={onAdd} className={`p-1 rounded-full transition-colors no-print ${dark ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-brand'}`}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Right-column resume item (education, experience, etc.) ─── */
function ResumeItem({ item, isOwn, onEdit, onDelete }) {
  const isAI = item.source === 'ai_suggestion';
  return (
    <div className="group relative mb-4 resume-section">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
            {isAI && (
              <span className="inline-flex items-center gap-0.5 text-[10px] italic text-gray-400">
                <Sparkles className="w-3 h-3 text-amber-400" /> AI
              </span>
            )}
          </div>
          {item.tags && item.tags.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{item.tags.join(' · ')}</p>
          )}
          {item.description && (
            <ul className="resume-content-list mt-1.5">
              {item.description.split('\n').filter(Boolean).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        {isOwn && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 no-print">
            <button onClick={() => onEdit?.(item)} className="p-1 rounded-full hover:bg-gray-100"><Pencil className="w-3 h-3 text-gray-400" /></button>
            <button onClick={() => onDelete?.(item)} className="p-1 rounded-full hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-400" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sidebar item (left column — languages, certifications) ─── */
function SidebarItem({ item, isOwn, onEdit, onDelete }) {
  return (
    <div className="group flex items-start justify-between mb-2 resume-section">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{item.title}</p>
        {item.description && (
          <p className="text-xs text-white/50 mt-0.5">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <p className="text-[10px] text-white/40 mt-0.5">{item.tags.join(' · ')}</p>
        )}
      </div>
      {isOwn && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 no-print">
          <button onClick={() => onEdit?.(item)} className="p-1 rounded-full hover:bg-white/10"><Pencil className="w-3 h-3 text-white/50" /></button>
          <button onClick={() => onDelete?.(item)} className="p-1 rounded-full hover:bg-white/10"><Trash2 className="w-3 h-3 text-red-300" /></button>
        </div>
      )}
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);

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
      setEditingProfile(false);
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

  /* ─── Render a right-side section (white bg) ─── */
  const renderRightSection = (type) => {
    const items = itemsByType(type);
    const isAdding = addingType === type;

    if (!isOwn && items.length === 0) return null;

    return (
      <div key={type} className="mb-6 resume-section">
        <ResumeSectionHeader type={type} isOwn={isOwn}
          onAdd={() => { setAddingType(type); setEditingItem(null); }} />

        {items.map((item) => (
          editingItem?.id === item.id ? (
            <InlineItemForm key={item.id} type={type} initialData={item}
              onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
          ) : (
            <ResumeItem key={item.id} item={item} isOwn={isOwn}
              onEdit={(it) => { setEditingItem(it); setAddingType(null); }}
              onDelete={handleDeleteItem} />
          )
        ))}

        {isOwn && items.length === 0 && !isAdding && (
          <p className="text-xs italic text-gray-300 mb-2">
            No {SECTION_META[type]?.label.toLowerCase()} added yet.
          </p>
        )}

        {isAdding && (
          <InlineItemForm type={type} onSave={handleSaveItem} onCancel={() => setAddingType(null)} />
        )}
      </div>
    );
  };

  /* ─── Render a left-side section (dark bg) ─── */
  const renderLeftSection = (type) => {
    const items = itemsByType(type);
    const isAdding = addingType === type;

    if (!isOwn && items.length === 0) return null;

    return (
      <div key={type} className="mb-5 resume-section">
        <ResumeSectionHeader type={type} isOwn={isOwn} dark
          onAdd={() => { setAddingType(type); setEditingItem(null); }} />

        {items.map((item) => (
          editingItem?.id === item.id ? (
            <InlineItemForm key={item.id} type={type} initialData={item}
              onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
          ) : (
            <SidebarItem key={item.id} item={item} isOwn={isOwn}
              onEdit={(it) => { setEditingItem(it); setAddingType(null); }}
              onDelete={handleDeleteItem} />
          )
        ))}

        {isOwn && items.length === 0 && !isAdding && (
          <p className="text-xs italic text-white/25 mb-2">
            No {SECTION_META[type]?.label.toLowerCase()} added yet.
          </p>
        )}

        {isAdding && (
          <InlineItemForm type={type} onSave={handleSaveItem} onCancel={() => setAddingType(null)} />
        )}
      </div>
    );
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* ── Action bar (hidden in print) ── */}
      <div className="resume-actions sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 no-print">
        <div className="resume-page flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-sm font-semibold text-gray-800">
              {isOwn ? 'My Resume' : `${targetProfile?.full_name || 'Candidate'}'s Resume`}
            </h2>
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
              <button onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Import Resume
              </button>
            )}
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
            {!isOwn && profile?.role === 'employer' && (
              <button onClick={handleMessageClick}
                className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-dark transition-colors shadow-sm">
                Message
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Suggestion Banner ── */}
      {isOwn && suggestion?.suggest && (
        <div className="resume-page px-4 mt-4 no-print">
          <AISuggestionBanner suggestion={suggestion} onAccept={handleAcceptSuggestion} onDismiss={clearSuggestion} />
        </div>
      )}

      {/* ══ Resume Document ══ */}
      <main className="flex-1 px-4 py-6 md:py-8">
        <div className="resume-page">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="resume-grid grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-2xl overflow-hidden shadow-2xl bg-white"
          >
            {/* ════════════════════════════════
                LEFT SIDEBAR (Dark)
               ════════════════════════════════ */}
            <div className="resume-sidebar bg-[#0b0f19] text-white p-6 md:p-8 flex flex-col">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group mb-5">
                  {targetProfile?.avatar_url ? (
                    <img
                      src={targetProfile.avatar_url}
                      alt={targetProfile.full_name || 'Profile'}
                      className="w-32 h-32 rounded-full object-cover ring-4 ring-white/20 shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold ring-4 ring-white/20 shadow-lg"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials}
                    </div>
                  )}
                  {/* Upload overlay (owner only) */}
                  {isOwn && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 no-print cursor-pointer"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Name + Headline */}
                {editingProfile ? (
                  <div className="w-full space-y-2 no-print">
                    <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-brand/50"
                      value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" autoFocus />
                    <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white/70 text-center focus:outline-none focus:ring-2 focus:ring-brand/50"
                      value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} placeholder="Job title / Headline" />
                    <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white/70 text-center focus:outline-none focus:ring-2 focus:ring-brand/50"
                      value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
                    <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-xs text-white/70 text-center focus:outline-none focus:ring-2 focus:ring-brand/50"
                      value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Address / Location" />
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={handleSaveProfile} disabled={savingProfile}
                        className="flex items-center gap-1 px-3 py-1 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand-dark disabled:opacity-50">
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => { setEditingProfile(false); setEditName(targetProfile?.full_name || ''); setEditHeadline(targetProfile?.headline || ''); setEditPhone(targetProfile?.phone || ''); setEditLocation(targetProfile?.location || ''); }}
                        className="flex items-center gap-1 px-3 py-1 rounded-md border border-white/20 text-xs text-white/60 hover:bg-white/10">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative group">
                    <h1 className="text-xl font-bold text-white leading-tight">{targetProfile?.full_name || 'Unknown'}</h1>
                    <p className="text-sm text-white/50 mt-1 font-medium">{targetProfile?.headline || 'Candidate'}</p>
                    {isOwn && (
                      <button onClick={() => setEditingProfile(true)}
                        className="absolute -top-1 -right-6 p-1 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                        <Pencil className="w-3 h-3 text-white/40" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Contact ── */}
              <div className="mb-6">
                <div className="resume-section-header resume-section-header--dark">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-white">Contact</h3>
                </div>
                <div className="space-y-3">
                  {(user?.email && isOwn) || (!isOwn && targetProfile?.email) ? (
                    <div>
                      <p className="resume-contact-label">Email</p>
                      <p className="resume-contact-value">{isOwn ? user?.email : targetProfile?.email}</p>
                    </div>
                  ) : null}
                  {targetProfile?.phone && (
                    <div>
                      <p className="resume-contact-label">Phone</p>
                      <p className="resume-contact-value">{targetProfile.phone}</p>
                    </div>
                  )}
                  {targetProfile?.location && (
                    <div>
                      <p className="resume-contact-label">Address</p>
                      <p className="resume-contact-value">{targetProfile.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Work Type Tags ── */}
              {(targetProfile?.work_type || []).length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-1.5">
                    {targetProfile.work_type.map((wt) => (
                      <span key={wt} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60 border border-white/10">
                        {wt.charAt(0).toUpperCase() + wt.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Left-side sections: Languages, Certifications ── */}
              {LEFT_SECTIONS.map((type) => renderLeftSection(type))}

              {/* ── Skills (from profile) ── */}
              {(targetProfile?.skills || []).length > 0 && (
                <div className="mt-auto pt-4">
                  <div className="resume-section-header resume-section-header--dark">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-white">Skills</h3>
                  </div>
                  <div className="resume-grid-items">
                    {targetProfile.skills.map((skill) => (
                      <span key={skill} className="text-xs text-white/80 py-0.5">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════
                RIGHT CONTENT (White)
               ════════════════════════════════ */}
            <div className="p-6 md:p-8">
              {/* Employer read-only actions */}
              {!isOwn && (
                <div className="flex items-center gap-2 mb-6 no-print">
                  <button onClick={() => navigate('/globe')}
                    className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors">
                    Shortlist
                  </button>
                  <button onClick={() => navigate('/globe')}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                    Not a fit
                  </button>
                  <button onClick={() => navigate('/messaging')}
                    className="px-4 py-2 rounded-lg border border-brand-200 text-xs font-semibold text-brand hover:bg-brand-50 transition-colors">
                    Message
                  </button>
                </div>
              )}

              {/* Right-side sections */}
              {RIGHT_SECTIONS.map((type) => renderRightSection(type))}

              {/* ── Hobbies as multi-column grid ── */}
              {(() => {
                const hobbies = itemsByType('hobby');
                const isAddingHobby = addingType === 'hobby';

                if (!isOwn && hobbies.length === 0) return null;

                return (
                  <div className="mb-6 resume-section">
                    <ResumeSectionHeader type="hobby" isOwn={isOwn}
                      onAdd={() => { setAddingType('hobby'); setEditingItem(null); }} />

                    {hobbies.length > 0 && (
                      <div className="resume-grid-items">
                        {hobbies.map((item) => (
                          editingItem?.id === item.id ? (
                            <InlineItemForm key={item.id} type="hobby" initialData={item}
                              onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                          ) : (
                            <div key={item.id} className="group flex items-center justify-between py-0.5">
                              <span className="text-xs text-gray-600">{item.title}</span>
                              {isOwn && (
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                  <button onClick={() => { setEditingItem(item); setAddingType(null); }} className="p-0.5 rounded hover:bg-gray-100">
                                    <Pencil className="w-2.5 h-2.5 text-gray-400" />
                                  </button>
                                  <button onClick={() => handleDeleteItem(item)} className="p-0.5 rounded hover:bg-red-50">
                                    <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {isOwn && hobbies.length === 0 && !isAddingHobby && (
                      <p className="text-xs italic text-gray-300 mb-2">No hobbies added yet.</p>
                    )}

                    {isAddingHobby && (
                      <InlineItemForm type="hobby" onSave={handleSaveItem} onCancel={() => setAddingType(null)} />
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
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
