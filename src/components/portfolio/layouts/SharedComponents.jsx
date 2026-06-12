// SharedComponents.jsx — Reusable sub-components shared across all resume layouts
import { useState } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, X, Sparkles,
  GraduationCap, Briefcase, Award, ShieldCheck, Languages,
  Heart, User, FileText
} from 'lucide-react';

/* ─── Section configuration ─── */
export const SECTION_META = {
  summary:       { label: 'Summary',            icon: User },
  education:     { label: 'Education',           icon: GraduationCap },
  experience:    { label: 'Working Experience',  icon: Briefcase },
  project:       { label: 'Projects',            icon: FileText },
  achievement:   { label: 'Achievements',        icon: Award },
  certification: { label: 'Certifications',      icon: ShieldCheck },
  language:      { label: 'Languages',           icon: Languages },
  hobby:         { label: 'Hobbies',             icon: Heart },
};

// Sections displayed in the dark left sidebar (Professional layout)
export const LEFT_SECTIONS  = ['language', 'certification'];
// Sections displayed in the white right content area
export const RIGHT_SECTIONS = ['summary', 'education', 'experience', 'project', 'achievement'];
// All sections in order
export const ALL_SECTIONS = ['summary', 'education', 'experience', 'project', 'achievement', 'certification', 'language', 'hobby'];

/* ─── Inline edit form (compact, for adding/editing items) ─── */
export function InlineItemForm({ type, initialData, onSave, onCancel }) {
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
export function ResumeSectionHeader({ type, isOwn, onAdd, dark = false, accentColor = null }) {
  const meta = SECTION_META[type];
  if (!meta) return null;

  return (
    <div className={`resume-section-header ${dark ? 'resume-section-header--dark' : ''}`}
      style={accentColor ? { borderBottomColor: accentColor } : undefined}>
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
export function ResumeItem({ item, isOwn, onEdit, onDelete }) {
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
export function SidebarItem({ item, isOwn, onEdit, onDelete }) {
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
