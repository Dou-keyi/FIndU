// PortfolioItemForm.jsx — inline form for adding/editing portfolio items
import React, { useState, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

const ITEM_TYPES = ['project', 'achievement', 'experience', 'certification', 'reference'];

export default function PortfolioItemForm({ initialData, onSave, onCancel }) {
  const [itemType, setItemType] = useState(initialData?.item_type || 'project');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setItemType(initialData.item_type || 'project');
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setTags(initialData.tags || []);
    }
  }, [initialData]);

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave?.({
        item_type: itemType,
        title: title.trim(),
        description: description.trim() || null,
        tags,
        ...(initialData?.id ? { id: initialData.id } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Item type */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setItemType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                itemType === type
                  ? 'bg-brand text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          placeholder="e.g. React Dashboard Project"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          placeholder="Brief description of what you did…"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand border border-brand-200"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500" aria-label={`Remove ${tag}`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          placeholder="Type and press Enter to add tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || saving}
          className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {initialData?.id ? 'Update' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
