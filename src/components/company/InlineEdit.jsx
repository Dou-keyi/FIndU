// InlineEdit — per-field inline editing.
// EditableLine: text / textarea / select with pencil + Apply/Cancel.
// EditableTags: chips each with an × to remove; pencil adds one new line at a time.
import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

const applyBtn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-dark transition-colors';
const cancelBtn = 'flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors';
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand';

export function EditableLine({ value, onApply, canEdit, type = 'text', options = [], multiline, placeholder, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);

  if (editing) {
    return (
      <div className="space-y-2 w-full">
        {type === 'select' ? (
          <select value={draft} onChange={(e) => setDraft(e.target.value)} className={`${inputCls} bg-white`}>
            <option value="">Select…</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : multiline ? (
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className={`${inputCls} min-h-[90px] resize-y`} />
        ) : (
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className={inputCls} />
        )}
        <div className="flex gap-2">
          <button onClick={() => { onApply(draft.trim()); setEditing(false); }} className={applyBtn}><Check className="w-3.5 h-3.5" /> Apply</button>
          <button onClick={() => { setDraft(value || ''); setEditing(false); }} className={cancelBtn}><X className="w-3.5 h-3.5" /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-start gap-1.5">
      <span className={className}>{value || <span className="text-gray-400 italic">{placeholder || 'Not set'}</span>}</span>
      {canEdit && (
        <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-brand transition-colors mt-0.5 flex-shrink-0" aria-label="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

export function EditableTags({ values = [], onApply, canEdit, accent = 'brand', emptyText = 'Add items' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const chip = accent === 'brand' ? 'bg-brand-50 text-brand border border-brand-100' : 'bg-gray-100 text-gray-600';

  const removeAt = (i) => onApply(values.filter((_, idx) => idx !== i));
  const addOne = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onApply([...values, v]);
    setDraft(''); setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.length === 0 && !adding && <span className="text-sm text-gray-400 italic">{emptyText}</span>}
      {values.map((v, i) => (
        <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${chip}`}>
          {v}
          {canEdit && (
            <button onClick={() => removeAt(i)} className="hover:text-red-500 transition-colors" aria-label={`Remove ${v}`}>
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
      {canEdit && !adding && (
        <button onClick={() => setAdding(true)} className="text-gray-300 hover:text-brand transition-colors" aria-label="Add item">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {canEdit && adding && (
        <span className="inline-flex items-center gap-1">
          <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOne()}
            placeholder="Add…" className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30 w-28" />
          <button onClick={addOne} className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand text-white" aria-label="Confirm add"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setDraft(''); setAdding(false); }} className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500" aria-label="Cancel add"><X className="w-3.5 h-3.5" /></button>
        </span>
      )}
    </div>
  );
}
