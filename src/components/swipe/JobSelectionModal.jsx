// JobSelectionModal.jsx — modal to choose which job to shortlist candidate for
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, X, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function JobSelectionModal({ isOpen, onClose, jobs, candidateName, onSelectJob }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop with strong blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] border border-white/50 ring-1 ring-slate-900/5"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-br from-emerald-100/80 via-teal-50/40 to-transparent pointer-events-none" />

            {/* Header Area */}
            <div className="relative pt-7 px-7 pb-3 flex items-start justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5 border border-white/20">
                  <Briefcase className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Select Role
                </h3>
                <p className="text-[14px] text-slate-500 mt-2 font-medium leading-relaxed max-w-[90%]">
                  Which position are you shortlisting <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">{candidateName}</span> for?
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Body */}
            <div className="relative px-7 pb-7 pt-2 overflow-y-auto">
              <div className="space-y-3">
                {jobs?.map((job, index) => (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    className="w-full relative group text-left p-4 rounded-[20px] border border-slate-200/70 bg-white hover:border-emerald-300 hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.25)] hover:bg-emerald-50/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 overflow-hidden block"
                  >
                    {/* Hover effect background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-[14px] bg-slate-50 border border-slate-100 flex flex-shrink-0 items-center justify-center group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow-sm transition-all duration-300">
                          <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[15px] text-slate-900 group-hover:text-emerald-800 transition-colors truncate tracking-tight">{job.title}</h4>
                          <p className="text-[13px] font-medium text-slate-500 mt-0.5 truncate group-hover:text-emerald-600/70 transition-colors">{job.company?.name}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-emerald-100 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0">
                        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
