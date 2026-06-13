// CreativeLayout.jsx — Magazine-style resume with full-width header band and card-based sections
import React from 'react';
import {
  Loader2, Pencil, Trash2, Check, X, Camera, Plus, Sparkles,
  Mail, Phone, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  SECTION_META, ALL_SECTIONS,
  InlineItemForm, ResumeSectionHeader, ResumeItem
} from './SharedComponents';

export default function CreativeLayout({
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
  const accent = activeTemplate.accent || '#7c3aed';
  const sections = ['summary', 'education', 'experience', 'project', 'achievement', 'certification', 'language'];

  const renderSection = (type) => {
    const items = itemsByType(type);
    const isAdding = addingType === type;
    const meta = SECTION_META[type];
    if (!meta) return null;
    if (!isOwn && items.length === 0) return null;

    const Icon = meta.icon;

    return (
      <div key={type} className="creative-card resume-section" style={{ borderLeftColor: accent }}>
        {/* Card header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + '18' }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">{meta.label}</h3>
          </div>
          {isOwn && (
            <button onClick={() => { setAddingType(type); setEditingItem(null); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors no-print">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Items */}
        {type === 'language' ? (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              editingItem?.id === item.id ? (
                <InlineItemForm key={item.id} type={type} initialData={item}
                  onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
              ) : (
                <div key={item.id} className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-sm font-medium text-gray-800">{item.title}</span>
                  {item.description && (
                    <span className="text-xs text-gray-400">— {item.description}</span>
                  )}
                  {isOwn && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      <button onClick={() => { setEditingItem(item); setAddingType(null); }} className="p-0.5 rounded hover:bg-gray-200">
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
        ) : (
          items.map((item) => (
            editingItem?.id === item.id ? (
              <InlineItemForm key={item.id} type={type} initialData={item}
                onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
            ) : (
              <ResumeItem key={item.id} item={item} isOwn={isOwn}
                onEdit={(it) => { setEditingItem(it); setAddingType(null); }}
                onDelete={handleDeleteItem} />
            )
          ))
        )}

        {isOwn && items.length === 0 && !isAdding && (
          <p className="text-xs italic text-gray-300">No {meta.label.toLowerCase()} added yet.</p>
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
      className="creative-resume rounded-2xl overflow-hidden shadow-2xl bg-white"
    >
      {/* ════════════════════════════════
          HEADER BAND (Full-width, colored)
         ════════════════════════════════ */}
      <div className={`creative-header bg-gradient-to-r ${activeTemplate.gradient} px-8 py-8 md:py-10`}>
        <div className="flex items-center gap-6 md:gap-8">
          {/* Avatar — rounded square */}
          <div className="relative group shrink-0">
            {targetProfile?.avatar_url ? (
              <img
                src={targetProfile.avatar_url}
                alt={targetProfile.full_name || 'Profile'}
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
              />
            ) : (
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl font-bold ring-4 ring-white/20 shadow-lg"
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
                  className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 no-print cursor-pointer"
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

          {/* Name, headline, contact */}
          <div className="flex-1 min-w-0">
            {editingProfile ? (
              <div className="space-y-2 no-print">
                <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" autoFocus />
                <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} placeholder="Job title / Headline" />
                <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone number" />
                <input className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-1.5 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Address / Location" />
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSaveProfile} disabled={savingProfile}
                    className="flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 text-white text-xs font-semibold hover:bg-white/30 disabled:opacity-50">
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => { setEditingProfile(false); setEditName(targetProfile?.full_name || ''); setEditHeadline(targetProfile?.headline || ''); setEditPhone(targetProfile?.phone || ''); setEditLocation(targetProfile?.location || ''); }}
                    className="flex items-center gap-1 px-3 py-1 rounded-md border border-white/20 text-xs text-white/60 hover:bg-white/10">
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                  {targetProfile?.full_name || 'Unknown'}
                </h1>
                <p className="text-base text-white/60 mt-1 font-medium">
                  {targetProfile?.headline || 'Candidate'}
                </p>

                {/* Contact info inline */}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {((user?.email && isOwn) || (!isOwn && targetProfile?.email)) && (
                    <span className="flex items-center gap-1.5 text-xs text-white/50">
                      <Mail className="w-3 h-3" /> {isOwn ? user?.email : targetProfile?.email}
                    </span>
                  )}
                  {targetProfile?.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-white/50">
                      <Phone className="w-3 h-3" /> {targetProfile.phone}
                    </span>
                  )}
                  {targetProfile?.location && (
                    <span className="flex items-center gap-1.5 text-xs text-white/50">
                      <MapPin className="w-3 h-3" /> {targetProfile.location}
                    </span>
                  )}
                </div>

                {/* Work type tags */}
                {(targetProfile?.work_type || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {targetProfile.work_type.map((wt) => (
                      <span key={wt} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white/70 border border-white/10">
                        {wt.charAt(0).toUpperCase() + wt.slice(1)}
                      </span>
                    ))}
                  </div>
                )}

                {isOwn && (
                  <button onClick={() => setEditingProfile(true)}
                    className="absolute top-0 -right-2 p-1 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                    <Pencil className="w-3.5 h-3.5 text-white/40" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accent stripe */}
      <div className="h-1.5" style={{ backgroundColor: accent }} />

      {/* ════════════════════════════════
          BODY — Card-based sections
         ════════════════════════════════ */}
      <div className="p-6 md:p-8 space-y-4">

        {/* Sections as cards */}
        {sections.map((type) => renderSection(type))}

        {/* Skills as colored pills */}
        {(targetProfile?.skills || []).length > 0 && (
          <div className="creative-card resume-section" style={{ borderLeftColor: accent }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + '18' }}>
                <Sparkles className="w-4 h-4" style={{ color: accent }} />
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {targetProfile.skills.map((skill) => (
                <span key={skill} className="creative-skill-pill" style={{
                  backgroundColor: accent + '12',
                  color: accent,
                  borderColor: accent + '30'
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hobbies */}
        {(() => {
          const hobbies = itemsByType('hobby');
          const isAddingHobby = addingType === 'hobby';
          if (!isOwn && hobbies.length === 0) return null;

          return (
            <div className="creative-card resume-section" style={{ borderLeftColor: accent }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent + '18' }}>
                    {React.createElement(SECTION_META.hobby.icon, { className: 'w-4 h-4', style: { color: accent } })}
                  </div>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">Hobbies</h3>
                </div>
                {isOwn && (
                  <button onClick={() => { setAddingType('hobby'); setEditingItem(null); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors no-print">
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {hobbies.map((item) => (
                  editingItem?.id === item.id ? (
                    <InlineItemForm key={item.id} type="hobby" initialData={item}
                      onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                  ) : (
                    <div key={item.id} className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs text-gray-600">
                      {item.title}
                      {isOwn && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                          <button onClick={() => { setEditingItem(item); setAddingType(null); }} className="p-0.5 rounded hover:bg-gray-200">
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
