// ImportResumeModal.jsx — Modal for uploading, parsing, and previewing a PDF resume import
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  GraduationCap, Briefcase, Award, ShieldCheck, Languages,
  Heart, User, Sparkles
} from 'lucide-react';
import { extractTextFromPDF, parseResumeWithAI } from '../../lib/resumeParser';

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

// Steps: 'upload' | 'processing' | 'preview' | 'error'
export default function ImportResumeModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setDragOver(false);
    setFileName('');
    setParsedData(null);
    setError('');
    setProgressMsg('');
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      setStep('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      setStep('error');
      return;
    }

    setFileName(file.name);
    setStep('processing');

    try {
      setProgressMsg('Extracting text from PDF…');
      const text = await extractTextFromPDF(file);

      if (!text || text.trim().length < 50) {
        throw new Error('Could not extract enough text from this PDF. The file may be image-based or empty.');
      }

      setProgressMsg('Analyzing resume with AI…');
      const result = await parseResumeWithAI(text);
      setParsedData(result);
      setStep('preview');
    } catch (err) {
      console.error('Resume import failed:', err);
      setError(err.message || 'Failed to parse resume. Please try again.');
      setStep('error');
    }
  };

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

  const handleImportAll = () => {
    if (parsedData) {
      onImport(parsedData);
      handleClose();
    }
  };

  // Count total items parsed
  const totalItems = parsedData
    ? Object.values(parsedData.sections || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0) + (parsedData.skills?.length || 0)
    : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-50">
                <Upload className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Import Resume</h2>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* ── UPLOAD STEP ── */}
            {step === 'upload' && (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-brand bg-brand-50/50'
                    : 'border-gray-200 hover:border-brand/40 hover:bg-gray-50/50'
                }`}
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
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Drop your resume PDF here
                </p>
                <p className="text-xs text-gray-400">
                  or click to browse · PDF only · max 10MB
                </p>
              </div>
            )}

            {/* ── PROCESSING STEP ── */}
            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{progressMsg}</p>
                <p className="text-xs text-gray-400">
                  Parsing <span className="font-medium text-gray-500">{fileName}</span>
                </p>
              </div>
            )}

            {/* ── ERROR STEP ── */}
            {step === 'error' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Import Failed</p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">{error}</p>
                <button
                  onClick={resetState}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* ── PREVIEW STEP ── */}
            {step === 'preview' && parsedData && (
              <div className="space-y-4">
                {/* Profile info */}
                {parsedData.profile && (parsedData.profile.full_name || parsedData.profile.headline) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Profile Info Detected</p>
                    {parsedData.profile.full_name && (
                      <p className="text-sm font-semibold text-gray-900">{parsedData.profile.full_name}</p>
                    )}
                    {parsedData.profile.headline && (
                      <p className="text-xs text-gray-500">{parsedData.profile.headline}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {parsedData.profile.phone && (
                        <span className="text-[11px] text-gray-400">📞 {parsedData.profile.phone}</span>
                      )}
                      {parsedData.profile.location && (
                        <span className="text-[11px] text-gray-400">📍 {parsedData.profile.location}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Section previews */}
                <div className="space-y-2">
                  {Object.entries(parsedData.sections || {}).map(([type, items]) => {
                    if (!items || items.length === 0) return null;
                    const Icon = SECTION_ICONS[type] || FileText;
                    return (
                      <div key={type} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
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

                  {/* Skills */}
                  {parsedData.skills?.length > 0 && (
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
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

                {/* Summary */}
                <div className="flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-gray-500">
                    Found <span className="font-semibold text-gray-700">{totalItems} items</span> ready to import
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'preview' && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportAll}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Import All
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
