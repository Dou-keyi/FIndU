// ProfessionalLayout.jsx — Two-column sidebar resume layout (the original/default)
import React from 'react';
import { Loader2, Pencil, Check, X, Camera, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  SECTION_META, LEFT_SECTIONS, RIGHT_SECTIONS,
  InlineItemForm, ResumeSectionHeader, ResumeItem, SidebarItem
} from './SharedComponents';

export default function ProfessionalLayout({
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="resume-grid grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-2xl overflow-hidden shadow-2xl bg-white"
    >
      {/* ════════════════════════════════
          LEFT SIDEBAR (Dark/Gradient)
         ════════════════════════════════ */}
      <div className={`resume-sidebar bg-gradient-to-br ${activeTemplate.gradient} text-white p-6 md:p-8 flex flex-col`}>
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
  );
}
