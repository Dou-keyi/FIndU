// EditCompanyModal — owner/admin edit form for the company profile.
// Frontend-first: onSave returns the edited draft; CompanyPage holds it in local
// state. Real persistence (companies columns + Storage) comes in the DB step.
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Logistics', 'Consulting', 'Education', 'Other'];
const HEADCOUNTS = ['1–10', '11–50', '51–200', '201–1000', '1000+'];

export default function EditCompanyModal({ open, onClose, initial, onSave }) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => { if (open) setDraft(initial); }, [open, initial]);

  if (!draft) return null;

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = () => {
    onSave({
      ...draft,
      specialties: (draft.specialtiesText ?? (draft.specialties || []).join(', '))
        .split(',').map((s) => s.trim()).filter(Boolean),
      markets: (draft.marketsText ?? (draft.markets || []).join(', '))
        .split(',').map((s) => s.trim()).filter(Boolean),
    });
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed left-1/2 top-1/2 z-[65] w-[94%] max-w-lg max-h-[88vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          >
            <div className="relative rounded-2xl bg-white shadow-xl p-6">
              <button onClick={onClose} className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100" aria-label="Close">
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <h2 className="text-lg font-semibold mb-4">Edit company profile</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-tagline">Tagline</Label>
                  <Input id="c-tagline" value={draft.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. Driving Southeast Asia forward." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="c-location">Location / HQ</Label>
                    <Input id="c-location" value={draft.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="Kuala Lumpur, Malaysia" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-website">Website</Label>
                    <Input id="c-website" value={draft.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="c-industry">Industry</Label>
                    <Select id="c-industry" value={draft.industry || ''} onChange={(e) => set('industry', e.target.value)}>
                      <option value="">Select…</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-headcount">Company size</Label>
                    <Select id="c-headcount" value={draft.headcount_range || ''} onChange={(e) => set('headcount_range', e.target.value)}>
                      <option value="">Select…</option>
                      {HEADCOUNTS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-about">About</Label>
                  <Textarea id="c-about" value={draft.about || ''} onChange={(e) => set('about', e.target.value)} className="min-h-[100px]" placeholder="What does your company do?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-culture">Culture</Label>
                  <Textarea id="c-culture" value={draft.culture || ''} onChange={(e) => set('culture', e.target.value)} className="min-h-[70px]" placeholder="What's it like to work here?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-specialties">Specialties (comma separated)</Label>
                  <Input id="c-specialties"
                    value={draft.specialtiesText ?? (draft.specialties || []).join(', ')}
                    onChange={(e) => set('specialtiesText', e.target.value)}
                    placeholder="Fintech, Logistics, Deliveries" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-markets">Markets served (comma separated)</Label>
                  <Input id="c-markets"
                    value={draft.marketsText ?? (draft.markets || []).join(', ')}
                    onChange={(e) => set('marketsText', e.target.value)}
                    placeholder="Southeast Asia, Consumer, Enterprise" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSave} className="flex-1">Save changes</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
