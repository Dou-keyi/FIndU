import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationCard from './ApplicationCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COLUMNS = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'final', label: 'Final Stage' },
];

const FINAL_SUB_STAGES = [
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' }
];

export default function KanbanBoard({ applications, isEmployer, onStatusChange, onViewPortfolio, onMessage }) {
  // Organize applications by status
  const groupedApps = applications.reduce((acc, app) => {
    acc[app.status] = acc[app.status] || [];
    acc[app.status].push(app);
    return acc;
  }, {});

  const getColApps = (colId) => {
    if (colId === 'applied') return [...(groupedApps['applied'] || []), ...(groupedApps['viewed'] || [])];
    if (colId === 'shortlisted') return groupedApps['shortlisted'] || [];
    if (colId === 'final') {
      return [
        ...(groupedApps['pending'] || []),
        ...(groupedApps['accepted'] || []),
        ...(groupedApps['rejected'] || [])
      ];
    }
    return [];
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 pt-1 snap-x hide-scrollbar px-1">
      {COLUMNS.map(col => {
        const colApps = getColApps(col.id);
        
        return (
          <div key={col.id} className="min-w-[300px] max-w-[350px] w-full flex flex-col snap-center h-full">
            <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
              <h3 className="font-bold text-slate-800">{col.label}</h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {colApps.length}
              </span>
            </div>
            
            <div className="flex-1 bg-slate-100/60 rounded-2xl p-2.5 overflow-y-auto space-y-3 border border-slate-200/60 shadow-inner hide-scrollbar">
              {col.id === 'final' ? (
                // Final stage nested accordion
                <FinalStageColumn 
                  groupedApps={groupedApps}
                  isEmployer={isEmployer}
                  onStatusChange={onStatusChange}
                  onViewPortfolio={onViewPortfolio}
                  onMessage={onMessage}
                />
              ) : (
                <AnimatePresence mode="popLayout">
                  {colApps.map(app => (
                    <motion.div
                      key={app.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ApplicationCard 
                        app={app} 
                        isEmployer={isEmployer} 
                        onStatusChange={onStatusChange}
                        onViewPortfolio={onViewPortfolio}
                        onMessage={onMessage}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {colApps.length === 0 && col.id !== 'final' && (
                <div className="h-24 flex items-center justify-center text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FinalStageColumn({ groupedApps, isEmployer, ...props }) {
  const [openSections, setOpenSections] = useState({ pending: true, accepted: true, rejected: true });
  
  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {FINAL_SUB_STAGES.map(stage => {
        const apps = groupedApps[stage.id] || [];
        const isOpen = openSections[stage.id];
        
        return (
          <div key={stage.id} className="bg-white/40 rounded-xl p-2 border border-slate-200/50 shadow-sm backdrop-blur-sm">
            <button 
              onClick={() => toggleSection(stage.id)}
              className="w-full flex items-center justify-between p-1.5 hover:bg-slate-100/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{stage.label}</span>
                <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">{apps.length}</span>
              </div>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            
            <AnimatePresence initial={false} mode="popLayout">
              {isOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    <AnimatePresence mode="popLayout">
                      {apps.length > 0 ? apps.map(app => (
                        <motion.div
                          key={app.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ApplicationCard app={app} isEmployer={isEmployer} {...props} />
                        </motion.div>
                      )) : (
                        <div className="py-3 text-center text-[11px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg">
                          No {isEmployer ? 'applicants' : 'applications'}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
