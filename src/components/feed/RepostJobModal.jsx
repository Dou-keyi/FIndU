import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Briefcase } from 'lucide-react';
import { createPost } from '../../lib/feedData';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../ui/use-toast';
import { Button } from '../ui/button';

export default function RepostJobModal({ isOpen, onClose, onDone, job }) {
  const { user, profile } = useAuth();
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  if (!isOpen || !job) return null;

  const handleShare = async () => {
    setIsPosting(true);
    try {
      // createPost signature: (userId, content, hashtags, postType, companyId, jobId)
      // Note: we will need to update feedData.js createPost to accept jobId
      await createPost(user.id, caption.trim() || 'We are hiring! Check out our new open role.', [], 'company', job.company_id, job.id);
      
      toast({
        title: 'Job shared to feed!',
        description: 'Candidates will now see it in their timeline.',
        variant: 'success'
      });
      onDone();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Failed to share',
        description: 'We could not share the job to the feed right now.',
        variant: 'destructive'
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Announce your new role</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <img 
                src={job.company?.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company?.name || 'C')}&background=random`} 
                alt="Company logo" 
                className="w-10 h-10 rounded-lg object-cover border border-gray-100"
              />
              <div className="flex-1">
                <textarea
                  autoFocus
                  placeholder="Share a message about this role (optional)..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full text-base bg-transparent border-none focus:ring-0 p-0 resize-none min-h-[80px] placeholder:text-gray-400 text-gray-900"
                />
              </div>
            </div>

            {/* Job Preview Card */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 line-clamp-1">{job.title}</h4>
                <p className="text-sm text-gray-500 mt-0.5">{job.company?.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600">
                    {job.work_type}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-600">
                    {job.experience_level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isPosting}>
              Skip for now
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={isPosting}
              className="bg-brand text-white hover:bg-brand/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {isPosting ? 'Sharing...' : 'Share to Feed'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
