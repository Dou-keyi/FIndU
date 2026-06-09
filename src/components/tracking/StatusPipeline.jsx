// StatusPipeline.jsx — visual pipeline of application statuses with clickable filtering
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const STAGES = ['applied', 'viewed', 'shortlisted', 'rejected'];

const STAGE_LABELS = {
  applied: 'Applied',
  viewed: 'Viewed',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
};

export default function StatusPipeline({ counts, activeStatus, onSelectStatus }) {
  return (
    <div className="flex items-center justify-between w-full overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      {STAGES.map((stage, i) => {
        const isActive = activeStatus === stage;
        const count = counts[stage] || 0;
        const isSelectedOrAll = !activeStatus || isActive;

        return (
          <React.Fragment key={stage}>
            <button
              onClick={() => onSelectStatus(isActive ? null : stage)}
              className={`relative flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] py-2 px-1 rounded-xl border-2 transition-all duration-200 flex-shrink-0
                ${
                  isActive
                    ? 'bg-brand-50 border-brand-400 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }
                ${!isSelectedOrAll ? 'opacity-60' : 'opacity-100'}
              `}
            >
              <span
                className={`text-xl font-bold mb-0.5 ${
                  isActive ? 'text-brand' : count > 0 ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                {count}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-medium uppercase tracking-wide ${
                  isActive ? 'text-brand-700' : 'text-slate-500'
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="pipeline-active"
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-brand rounded-full border-2 border-white shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>

            {/* Arrow between stages */}
            {i < STAGES.length - 1 && (
              <div className="flex-shrink-0 px-1 sm:px-2 flex items-center justify-center opacity-40">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
