// MinimalLayout.jsx — Clean typographic single-column resume with thin rules and max whitespace
import React from 'react';
import {
  Loader2, Pencil, Trash2, Check, X, Camera, Plus, Sparkles
} from 'lucide-react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { SECTION_META, InlineItemForm, ALL_SECTIONS } from './SharedComponents';

const DraggableSection = ({ type, renderContent }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item 
      value={type} 
      id={type} 
      dragListener={false} 
      dragControls={dragControls} 
      className="relative z-0 list-none rounded-xl bg-white"
      initial={{ scale: 1, boxShadow: '0 0px 0px 0px rgba(0,0,0,0)', zIndex: 0, opacity: 1 }}
      animate={{ scale: 1, boxShadow: '0 0px 0px 0px rgba(0,0,0,0)', zIndex: 0, opacity: 1 }}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', 
        zIndex: 50, 
        opacity: 0.95,
        cursor: 'grabbing'
      }}
      transition={{ 
        layout: { type: "spring", stiffness: 40, damping: 12 },
        default: { type: "spring", stiffness: 200, damping: 20 }
      }}
    >
      {renderContent(type, dragControls)}
    </Reorder.Item>
  );
};

export default function MinimalLayout({
  targetProfile, user, isOwn, activeTemplate, activeAccent,
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
}) {
  const sections = ALL_SECTIONS;

  const handleReorder = (newOrder) => {
    const indices = sectionOrder.map((s, i) => sections.includes(s) ? i : -1).filter(i => i !== -1);
    const updatedOrder = [...sectionOrder];
    indices.forEach((index, i) => {
      updatedOrder[index] = newOrder[i];
    });
    setSectionOrder(updatedOrder);
    handleSaveSectionOrder(updatedOrder);
  };

  const orderedSections = sections.slice().sort((a, b) => {
    const idxA = sectionOrder.indexOf(a);
    const idxB = sectionOrder.indexOf(b);
    return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
  });



  const renderSection = (type, dragControls) => {
    if (type === 'skills') {
      if (!isOwn && (targetProfile?.skills || []).length === 0) return null;
      return (
        <div key="skills" className="minimal-section resume-section group">
          <div className="minimal-rule" style={activeAccent ? { backgroundColor: activeAccent } : undefined} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isOwn && dragControls && (
                <div
                  onPointerDown={(e) => dragControls.start(e)}
                  style={{ touchAction: 'none' }}
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-50 text-gray-300 transition-colors no-print"
                  title="Hold and drag to reorder"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
              )}
              <h3 className="minimal-section-label">Skills</h3>
            </div>
            {isOwn && (
              <button onClick={() => { setEditingSkills(true); setEditSkillsInput(''); }}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 no-print">
                <Plus className="w-3.5 h-3.5 text-gray-300" />
              </button>
            )}
          </div>
          
          {editingSkills ? (
             <div className="space-y-2 no-print">
               <input className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
                 value={editSkillsInput} onChange={(e) => setEditSkillsInput(e.target.value)} placeholder="e.g. React, Node.js, Python (comma separated)" autoFocus onKeyDown={(e) => { if(e.key === 'Enter') handleSaveSkills(); }} />
               <div className="flex gap-2 pt-1">
                 <button onClick={handleSaveSkills} disabled={savingSkills}
                   className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand text-white text-xs font-semibold hover:bg-brand-dark disabled:opacity-50">
                   <Check className="w-3 h-3" /> Save
                 </button>
                 <button onClick={() => { setEditingSkills(false); setEditSkillsInput(''); }}
                   className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
                   <X className="w-3 h-3" /> Cancel
                 </button>
               </div>
             </div>
          ) : (
            <>
              {(targetProfile?.skills || []).length > 0 ? (
                <div className="flex flex-wrap gap-x-1">
                  {(targetProfile?.skills || []).map((skill, i) => (
                    <span key={skill} className="group/skill inline-flex items-center text-xs text-gray-500">
                      {skill}{i < (targetProfile?.skills || []).length - 1 ? ',\u00A0' : ''}
                      {isOwn && (
                        <span className="inline-flex gap-0.5 opacity-0 group-hover/skill:opacity-100 transition-opacity no-print ml-0.5">
                          <button onClick={() => handleDeleteSkill(skill)} className="p-0.5 rounded hover:bg-red-50">
                            <Trash2 className="w-2 h-2 text-red-300" />
                          </button>
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-gray-300">No skills added yet.</p>
              )}
            </>
          )}
        </div>
      );
    }

    if (type === 'hobby') {
      const hobbies = itemsByType('hobby');
      const isAddingHobby = addingType === 'hobby';
      if (!isOwn && hobbies.length === 0 && !isAddingHobby) return null;

      return (
        <div key="hobby" className="minimal-section resume-section">
          <div className="minimal-rule" style={activeAccent ? { backgroundColor: activeAccent } : undefined} />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isOwn && dragControls && (
                <div
                  onPointerDown={(e) => dragControls.start(e)}
                  style={{ touchAction: 'none' }}
                  className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-50 text-gray-300 transition-colors no-print"
                  title="Hold and drag to reorder"
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>
              )}
              <h3 className="minimal-section-label">Hobbies</h3>
            </div>
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
    }

    const items = itemsByType(type);
    const isAdding = addingType === type;
    const meta = SECTION_META[type];
    if (!meta) return null;
    if (!isOwn && items.length === 0) return null;

    return (
      <div key={type} className="minimal-section resume-section">
        {/* Thin rule */}
        <div className="minimal-rule" style={activeAccent ? { backgroundColor: activeAccent } : undefined} />

        {/* Section label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isOwn && dragControls && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{ touchAction: 'none' }}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-50 text-gray-300 transition-colors no-print"
                title="Hold and drag to reorder"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
            )}
            <h3 className="minimal-section-label">{meta.label}</h3>
          </div>
          {isOwn && (
            <button onClick={() => { setAddingType(type); setEditingItem(null); }}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors no-print">
              <Plus className="w-3.5 h-3.5 text-gray-300" />
            </button>
          )}
        </div>

        {/* Items — timeline style for experience/education */}
        {type === 'reference' ? (
          <div className="flex flex-row flex-wrap gap-x-8 gap-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex-none w-auto max-w-full">
                {editingItem?.id === item.id ? (
                  <InlineItemForm type={type} initialData={item}
                    onSave={handleSaveItem} onCancel={() => setEditingItem(null)} />
                ) : (
                  <div className="group mb-4 resume-section">
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
                )}
              </div>
            ))}
          </div>
        ) : (
          items.map((item) => (
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
          ))
        )}

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
        <Reorder.Group axis="y" values={orderedSections} onReorder={handleReorder} className="m-0 p-0 flex flex-col">
          {orderedSections.map((type) => (
            <DraggableSection key={type} type={type} renderContent={renderSection} />
          ))}
        </Reorder.Group>

      </div>
    </motion.div>
  );
}
