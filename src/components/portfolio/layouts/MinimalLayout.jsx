// MinimalLayout.jsx — Clean typographic single-column resume with thin rules and max whitespace
import React from 'react';
import {
  Loader2, Pencil, Trash2, Check, X, Camera, Plus, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SECTION_META, InlineItemForm } from './SharedComponents';

export default function MinimalLayout({
  targetProfile, user, isOwn, activeTemplate,
  portfolioItems, itemsByType,
  addingType, setAddingType,
  editingItem, setEditingItem,
  editingProfile, setEditingProfile,
  editName, setEditName, editHeadline, setEditHeadline,
  editPhone, setEditPhone, editLocation, setEditLocation,
  savingProfile, handleSaveProfile,
  avatarInputRef, uploadingAvatar, handleAvatarUpload,
  handleSaveItem, handleDeleteItem,
  initials, avatarColor, navigate
}) {
  const sections = ['summary', 'education', 'experience', 'project', 'achievement', 'certification', 'language'];

  const renderSection = (type) => {
    const items = itemsByType(type);
    const isAdding = addingType === type;
    const meta = SECTION_META[type];
    if (!meta) return null;
    if (!isOwn && items.length === 0) return null;

    return (
      <div key={type} className="minimal-section resume-section">
        {/* Thin rule */}
        <div className="minimal-rule" />

        {/* Section label */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="minimal-section-label">{meta.label}</h3>
          {isOwn && (
            <button onClick={() => { setAddingType(type); setEditingItem(null); }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors no-print">
              <Plus className="w-3.5 h-3.5 text-gray-300" />
            </button>
          )}
        </div>

        {/* Items — timeline style for experience/education */}
        {items.map((item) => (
          editingItem?.id === item.id ? (
            <InlineItemForm key={item.id} type={type} initialData={item}
              onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
          ) : (
            <div key={item.id} className="group mb-4 resume-section">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-semibold text-gray-900 leading-snug">{item.title}</h4>
                    {item.source === 'ai_suggestion' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] italic text-gray-400">
                        <Sparkles className="w-3 h-3 text-amber-400" /> AI
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                      {item.description.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
                {/* Date/tags pinned right */}
                {item.tags && item.tags.length > 0 && (
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap shrink-0 mt-0.5">
                    {item.tags.join(' · ')}
                  </span>
                )}
                {isOwn && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 no-print">
                    <button onClick={() => { setEditingItem(item); setAddingType(null); }} className="p-1 rounded-full hover:bg-gray-100">
                      <Pencil className="w-3 h-3 text-gray-300" />
                    </button>
                    <button onClick={() => handleDeleteItem(item)} className="p-1 rounded-full hover:bg-red-50">
                      <Trash2 className="w-3 h-3 text-red-300" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        ))}

        {isOwn && items.length === 0 && !isAdding && (
          <p className="text-xs italic text-gray-300 mb-2">No {meta.label.toLowerCase()} added yet.</p>
        )}

        {isAdding && (
          <InlineItemForm type={type} onSave={handleSaveItem} onCancel={() => setAddingType(null)} />
        )}
      </div>
    );
  };

  // Build contact pieces
  const contactPieces = [];
  if ((user?.email && isOwn) || (!isOwn && targetProfile?.email)) {
    contactPieces.push(isOwn ? user?.email : targetProfile?.email);
  }
  if (targetProfile?.phone) contactPieces.push(targetProfile.phone);
  if (targetProfile?.location) contactPieces.push(targetProfile.location);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="minimal-resume rounded-2xl overflow-hidden shadow-2xl bg-white"
    >
      <div className="px-8 md:px-12 py-8 md:py-10">

        {/* ════════════════════════════════
            HEADER — Centered name + contact
           ════════════════════════════════ */}
        <div className="text-center mb-2">
          {/* Avatar — small, centered, subtle */}
          <div className="flex justify-center mb-5">
            <div className="relative group">
              {targetProfile?.avatar_url ? (
                <img
                  src={targetProfile.avatar_url}
                  alt={targetProfile.full_name || 'Profile'}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ring-2 ring-gray-100"
                  style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                >
                  {initials}
                </div>
              )}
              {isOwn && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 no-print cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {editingProfile ? (
            <div className="max-w-sm mx-auto space-y-2 no-print">
              <input className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-lg text-center font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" autoFocus />
              <input className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-center text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} placeholder="Job title / Headline" />
              <input className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-center text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
              <input className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-center text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Address / Location" />
              <div className="flex gap-2 justify-center pt-1">
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand-dark disabled:opacity-50">
                  <Check className="w-3 h-3" /> Save
                </button>
                <button onClick={() => { setEditingProfile(false); setEditName(targetProfile?.full_name || ''); setEditHeadline(targetProfile?.headline || ''); setEditPhone(targetProfile?.phone || ''); setEditLocation(targetProfile?.location || ''); }}
                  className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group inline-block">
              <h1 className="text-2xl md:text-3xl font-light text-gray-900 tracking-wide">
                {targetProfile?.full_name || 'Unknown'}
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-normal tracking-wider uppercase">
                {targetProfile?.headline || 'Candidate'}
              </p>
              {isOwn && (
                <button onClick={() => setEditingProfile(true)}
                  className="absolute -top-1 -right-7 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                  <Pencil className="w-3 h-3 text-gray-300" />
                </button>
              )}
            </div>
          )}

          {/* Contact — single centered line */}
          {contactPieces.length > 0 && (
            <p className="minimal-contact mt-3">
              {contactPieces.join('  ·  ')}
            </p>
          )}

          {/* Work type */}
          {(targetProfile?.work_type || []).length > 0 && (
            <p className="text-[11px] text-gray-300 mt-2 tracking-wider">
              {targetProfile.work_type.map(wt => wt.charAt(0).toUpperCase() + wt.slice(1)).join('  ·  ')}
            </p>
          )}
        </div>

        {/* ════════════════════════════════
            BODY — Sections with thin rules
           ════════════════════════════════ */}


        {/* Sections */}
        {sections.map((type) => renderSection(type))}

        {/* Skills — comma-separated inline */}
        {(targetProfile?.skills || []).length > 0 && (
          <div className="minimal-section resume-section">
            <div className="minimal-rule" />
            <h3 className="minimal-section-label mb-3">Skills</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {targetProfile.skills.join(',  ')}
            </p>
          </div>
        )}

        {/* Hobbies — comma-separated inline */}
        {(() => {
          const hobbies = itemsByType('hobby');
          const isAddingHobby = addingType === 'hobby';
          if (!isOwn && hobbies.length === 0 && !isAddingHobby) return null;

          return (
            <div className="minimal-section resume-section">
              <div className="minimal-rule" />
              <div className="flex items-center justify-between mb-3">
                <h3 className="minimal-section-label">Hobbies</h3>
                {isOwn && (
                  <button onClick={() => { setAddingType('hobby'); setEditingItem(null); }}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors no-print">
                    <Plus className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                )}
              </div>
              {hobbies.length > 0 && (
                <div className="flex flex-wrap gap-x-1">
                  {hobbies.map((item, i) => (
                    editingItem?.id === item.id ? (
                      <InlineItemForm key={item.id} type="hobby" initialData={item}
                        onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                    ) : (
                      <span key={item.id} className="group inline-flex items-center text-xs text-gray-500">
                        {item.title}{i < hobbies.length - 1 ? ',\u00A0' : ''}
                        {isOwn && (
                          <span className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print ml-0.5">
                            <button onClick={() => { setEditingItem(item); setAddingType(null); }} className="p-0.5 rounded hover:bg-gray-100">
                              <Pencil className="w-2 h-2 text-gray-300" />
                            </button>
                            <button onClick={() => handleDeleteItem(item)} className="p-0.5 rounded hover:bg-red-50">
                              <Trash2 className="w-2 h-2 text-red-300" />
                            </button>
                          </span>
                        )}
                      </span>
                    )
                  ))}
                </div>
              )}
              {isOwn && hobbies.length === 0 && !isAddingHobby && (
                <p className="text-xs italic text-gray-300">No hobbies added yet.</p>
              )}
              {isAddingHobby && (
                <InlineItemForm type="hobby" onSave={handleSaveItem} onCancel={() => setAddingType(null)} />
              )}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}
