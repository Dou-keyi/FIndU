import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationCard from './ApplicationCard';
import StatusPipeline from './StatusPipeline';
import { Inbox } from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', statuses: ['applied'], dropStatus: 'applied' },
  { id: 'viewed', label: 'Viewed', statuses: ['viewed'], dropStatus: 'viewed' },
  { id: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted'], dropStatus: 'shortlisted' },
  { id: 'final', label: 'Final Stage', statuses: ['pending', 'accepted', 'rejected'], dropStatus: 'pending' },
];

export default function EmployerPipelineView({ applications, onStatusChange, onViewPortfolio, onMessage }) {
  const [activeStage, setActiveStage] = useState('applied');
  const [draggedAppId, setDraggedAppId] = useState(null);

  // Filter apps by stage
  const activeStageObj = PIPELINE_STAGES.find(s => s.id === activeStage);
  const currentApps = applications.filter(app => activeStageObj?.statuses.includes(app.status));

  // Get the next logic stage
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === activeStage);
  const nextStage = currentIndex < PIPELINE_STAGES.length - 1 && activeStage !== 'final' 
    ? PIPELINE_STAGES[currentIndex + 1] 
    : null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Pipeline Navigation */}
      <div className="mb-6">
        <StatusPipeline 
          counts={PIPELINE_STAGES.reduce((acc, stage) => {
            acc[stage.id] = applications.filter(a => stage.statuses.includes(a.status)).length;
            return acc;
          }, {})}
          activeStatus={activeStage}
          onSelectStatus={(status) => setActiveStage(status || activeStage)}
          stages={PIPELINE_STAGES.map(s => s.id)}
          stageLabels={PIPELINE_STAGES.reduce((acc, s) => { acc[s.id] = s.label; return acc; }, {})}
        />
      </div>

      {/* 2-Column Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        <AnimatePresence mode="popLayout">
          {currentApps.map(app => (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('applicationId', app.id);
                setDraggedAppId(app.id);
              }}
              onDragEnd={() => setDraggedAppId(null)}
            >
              <ApplicationCard 
                app={app} 
                isEmployer={true} 
                onStatusChange={onStatusChange}
                onViewPortfolio={onViewPortfolio}
                onMessage={onMessage}
              />
            </motion.div>
          ))}
          {currentApps.length === 0 && (
            <div className="col-span-1 md:col-span-2 py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Inbox className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No candidates in {PIPELINE_STAGES.find(s => s.id === activeStage)?.label}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Right-Side Dropzone (Next Phase) */}
      <AnimatePresence>
        {draggedAppId && nextStage && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-24 right-4 bottom-24 w-48 md:w-64 z-50 pointer-events-auto"
          >
            <div 
              className="w-full h-full bg-brand/10 border-2 border-dashed border-brand rounded-2xl backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center transition-colors hover:bg-brand/20 shadow-2xl"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-brand/30', 'scale-105');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-brand/30', 'scale-105');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-brand/30', 'scale-105');
                const appId = e.dataTransfer.getData('applicationId');
                if (appId && nextStage) {
                  onStatusChange(appId, nextStage.dropStatus);
                }
                setDraggedAppId(null);
              }}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="text-2xl text-brand">➡️</span>
              </div>
              <h3 className="font-bold text-brand text-lg mb-1">Move to</h3>
              <p className="font-black text-brand text-xl uppercase tracking-widest">{nextStage.label}</p>
              <p className="text-xs text-brand/70 mt-4 font-medium">Drop candidate here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Bottom Dropzone (Reject) */}
      <AnimatePresence>
        {draggedAppId && activeStage !== 'final' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-64 md:w-96 z-50 pointer-events-auto"
          >
            <div 
              className="w-full bg-red-50/90 border-2 border-dashed border-red-400 rounded-xl backdrop-blur-sm flex items-center justify-center p-4 text-center transition-all hover:bg-red-100 shadow-xl"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-red-200', 'scale-105');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-red-200', 'scale-105');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-red-200', 'scale-105');
                const appId = e.dataTransfer.getData('applicationId');
                if (appId) {
                  onStatusChange(appId, 'rejected');
                }
                setDraggedAppId(null);
              }}
            >
              <span className="text-red-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">❌</span> Reject Candidate
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
