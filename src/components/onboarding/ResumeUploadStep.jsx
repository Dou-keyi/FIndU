// ResumeUploadStep — Step 1 of candidate onboarding: upload resume PDF or choose a template
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle, X,
  GraduationCap, Briefcase, Award, ShieldCheck, Languages,
  Heart, User, Palette, Layout, Minimize2
} from 'lucide-react';
import { Button } from '../ui/button';
import { extractTextFromPDF, parseResumeWithAI, extractTemplateFromPDF } from '../../lib/resumeParser';

/* ─── Section display metadata ─── */
const SECTION_ICONS = {
  summary: User,
  education: GraduationCap,
  experience: Briefcase,
  project: FileText,
  achievement: Award,
  certification: ShieldCheck,
  language: Languages,
  hobby: Heart,
};

const SECTION_LABELS = {
  summary: 'Summary',
  education: 'Education',
  experience: 'Working Experience',
  project: 'Projects',
  achievement: 'Achievements',
  certification: 'Certifications',
  language: 'Languages',
  hobby: 'Hobbies',
};

/* ─── Resume template options ─── */
const TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean two-column layout with structured sections',
    icon: Layout,
    gradient: 'from-slate-800 to-slate-600',
    accent: '#334155',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold colours and modern typography',
    icon: Palette,
    gradient: 'from-violet-600 to-indigo-500',
    accent: '#7c3aed',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, elegant and content-focused',
    icon: Minimize2,
    gradient: 'from-gray-500 to-gray-400',
    accent: '#6b7280',
  },
];

/**
 * ResumeUploadStep
 * @param {Object}   props
 * @param {function} props.onResumeData     - Callback with parsed resume data (sections, profile, skills)
 * @param {function} props.onTemplateSelect - Callback with selected template id
 * @param {function} props.onContinue       - Called after user confirms parsed data or template
 */
export default function ResumeUploadStep({ onResumeData, onTemplateSelect, onContinue }) {
  // States: 'idle' | 'processing' | 'preview' | 'templates' | 'error'
  const [phase, setPhase] = useState('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const fileInputRef = useRef(null);

  /* ── File processing ── */
  const processFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      setPhase('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10 MB.');
      setPhase('error');
      return;
    }

    setFileName(file.name);
    setPhase('processing');

    try {
      setProgressMsg('Extracting text from PDF…');
      const text = await extractTextFromPDF(file);

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract enough text from this PDF. It may be image-based or empty.');
      }

      setProgressMsg('Analyzing resume with AI…');
      const result = await parseResumeWithAI(text);
      
      setProgressMsg('Scanning template design…');
      try {
        const templateDesign = await extractTemplateFromPDF(file);
        result.scannedTemplate = templateDesign;
      } catch (tmplErr) {
        console.warn('Failed to scan template design:', tmplErr);
      }

      setParsedData(result);
      setPhase('preview');
    } catch (err) {
      console.error('Resume processing failed:', err);
      setError(err.message || 'Failed to parse resume. Please try again.');
      setPhase('error');
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setPhase('idle');
    setDragOver(false);
    setFileName('');
    setParsedData(null);
    setError('');
    setProgressMsg('');
    setSelectedTemplate(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Confirm parsed resume ── */
  const handleConfirmResume = () => {
    if (parsedData) {
      onResumeData?.(parsedData);
      onContinue?.();
    }
  };

  /* ── Confirm template ── */
  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect?.(selectedTemplate);
      onContinue?.();
    }
  };

  /* ── Total parsed items count ── */
  const totalItems = parsedData
    ? Object.values(parsedData.sections || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0) + (parsedData.skills?.length || 0)
    : 0;

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════
            IDLE — Upload area
           ═══════════════════════════════════════ */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Drop zone */}
            <div
              className={`onboarding-dropzone ${dragOver ? 'onboarding-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="onboarding-dropzone__icon">
                <div className="onboarding-dropzone__icon-ring" />
                <Upload className="w-7 h-7 text-brand relative z-10" />
              </div>

              <h3 className="text-base font-bold text-gray-800 mt-5 mb-1">
                Upload your resume
              </h3>
              <p className="text-sm text-gray-400 mb-1">
                Drag & drop your PDF here, or click to browse
              </p>
              <p className="text-[11px] text-gray-300">
                PDF only · max 10 MB
              </p>
            </div>

            {/* No resume link */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setPhase('templates')}
                className="text-sm text-gray-400 hover:text-brand transition-colors underline underline-offset-2 decoration-dashed"
              >
                I don't have a resume
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            PROCESSING — Spinner
           ═══════════════════════════════════════ */}
        {phase === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="text-center py-12"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{progressMsg}</p>
            <p className="text-xs text-gray-400">
              Parsing <span className="font-medium text-gray-500">{fileName}</span>
            </p>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            PREVIEW — Parsed resume summary
           ═══════════════════════════════════════ */}
        {phase === 'preview' && parsedData && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-800">Resume parsed successfully</p>
                <p className="text-xs text-emerald-600 truncate">{fileName}</p>
              </div>
              <button onClick={handleReset} className="p-1 rounded-lg hover:bg-emerald-100 transition-colors">
                <X className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Profile info detected */}
            {parsedData.profile && (parsedData.profile.full_name || parsedData.profile.headline) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Profile Detected</p>
                {parsedData.profile.full_name && (
                  <p className="text-sm font-semibold text-gray-900">{parsedData.profile.full_name}</p>
                )}
                {parsedData.profile.headline && (
                  <p className="text-xs text-gray-500">{parsedData.profile.headline}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  {parsedData.profile.email && (
                    <span className="text-[11px] text-gray-400">✉️ {parsedData.profile.email}</span>
                  )}
                  {parsedData.profile.phone && (
                    <span className="text-[11px] text-gray-400">📞 {parsedData.profile.phone}</span>
                  )}
                  {parsedData.profile.location && (
                    <span className="text-[11px] text-gray-400">📍 {parsedData.profile.location}</span>
                  )}
                </div>
              </div>
            )}

            {/* Sections list */}
            <div className="space-y-1.5">
              {Object.entries(parsedData.sections || {}).map(([type, items]) => {
                if (!items || items.length === 0) return null;
                const Icon = SECTION_ICONS[type] || FileText;
                return (
                  <div key={type} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{SECTION_LABELS[type] || type}</span>
                    </div>
                    <span className="text-xs font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                );
              })}

              {parsedData.skills?.length > 0 && (
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Skills</span>
                  </div>
                  <span className="text-xs font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded-full">
                    {parsedData.skills.length} skills
                  </span>
                </div>
              )}
            </div>

            {/* Scanned template indicator */}
            {parsedData.scannedTemplate && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100">
                <div className="p-1.5 rounded-lg bg-violet-100">
                  <Palette className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-violet-800">Template design captured</p>
                  <p className="text-xs text-violet-500 truncate">
                    "{parsedData.scannedTemplate.name}" — available in your portfolio templates
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
              </div>
            )}

            {/* Total count */}
            <div className="flex items-center gap-2 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-gray-500">
                Found <span className="font-semibold text-gray-700">{totalItems} items</span> — will be imported to your portfolio
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Upload different
              </Button>
              <Button onClick={handleConfirmResume} className="flex-1">
                Use this resume
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            TEMPLATES — No-resume path
           ═══════════════════════════════════════ */}
        {phase === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-800 mb-1">Choose a resume template</h3>
              <p className="text-sm text-gray-400">
                Pick a style — you'll fill in your details on the portfolio page
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`onboarding-template-card ${isSelected ? 'onboarding-template-card--selected' : ''}`}
                  >
                    {/* Gradient header */}
                    <div className={`h-20 rounded-t-xl bg-gradient-to-br ${tpl.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/5" />
                      <Icon className="w-8 h-8 text-white/80 relative z-10" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-brand" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 text-left">
                      <p className="text-sm font-bold text-gray-800">{tpl.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{tpl.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Go back
              </Button>
              <Button onClick={handleConfirmTemplate} disabled={!selectedTemplate} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════
            ERROR — Failed parse
           ═══════════════════════════════════════ */}
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="text-center py-10"
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Upload Failed</p>
            <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">{error}</p>
            <Button onClick={handleReset}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
