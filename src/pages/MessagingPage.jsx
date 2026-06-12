// MessagingPage.jsx — real-time messaging between matched candidates and employers
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { getMyThreads, getMyRequests, getMySentRequests, respondToRequest } from '../lib/messagingData';
import { toast } from '../components/ui/use-toast';
import RequestsList from '../components/messaging/RequestsList';
import ThreadList from '../components/messaging/ThreadList';
import ChatThread from '../components/messaging/ChatThread';

export default function MessagingPage() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const role = profile?.role || 'candidate';

  const [activeTab, setActiveTab] = useState('chats'); // 'requests' | 'chats'
  const [view, setView] = useState('list'); // 'list' | 'thread'
  const [activeThreadId, setActiveThreadId] = useState(null);

  const [threads, setThreads] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load data
  const loadData = async () => {
    if (!user) return;
    
    // Load threads
    setLoadingThreads(true);
    const [threadsData, sentReqsData] = await Promise.all([
      getMyThreads(user.id),
      getMySentRequests(user.id)
    ]);

    const sentReqThreads = sentReqsData.map(req => ({
      id: `req_${req.id}`,
      isRequest: true,
      match: {
        job: req.job,
        employer: role === 'employer' ? profile : req.recipient,
        candidate: role === 'candidate' ? profile : req.recipient,
      },
      messages: [{
        id: `msg_${req.id}`,
        content: req.intro_message,
        sender_id: user.id,
        seen: true,
        sent_at: req.created_at
      }]
    }));

    const allThreads = [...threadsData, ...sentReqThreads].sort((a, b) => {
      const aTime = new Date(a.messages?.[0]?.sent_at || a.created_at || 0).getTime();
      const bTime = new Date(b.messages?.[0]?.sent_at || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    setThreads(allThreads);
    setLoadingThreads(false);

    // Load requests
    setLoadingRequests(true);
    const requestsData = await getMyRequests(user.id);
    setRequests(requestsData);
    setLoadingRequests(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Deep linking to open a thread
  useEffect(() => {
    if (location.state?.openThreadId) {
      setActiveThreadId(location.state.openThreadId);
      setView('thread');
      // Clean up state so we don't reopen on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const unreadThreadsCount = threads.filter((t) => {
    const msgs = t.messages || [];
    return msgs.some((m) => !m.seen && m.sender_id !== user.id);
  }).length;

  const pendingRequestsCount = requests.length;

  const handleSelectThread = (thread) => {
    setActiveThreadId(thread.id);
    setView('thread');
  };

  const handleBackToList = () => {
    setView('list');
    setActiveThreadId(null);
    loadData(); // Refresh threads to update unread status
  };

  const handleAcceptRequest = async (req) => {
    const matchData = {
      candidate_id: role === 'candidate' ? user.id : req.sender_id,
      job_id: req.job_id,
      employer_id: role === 'employer' ? user.id : req.sender_id,
    };
    
    const { error } = await respondToRequest(req.id, 'accepted', matchData);
    
    if (!error) {
      toast({
        title: 'Request accepted',
        description: `You can now message ${req.sender?.full_name}`,
        variant: 'success',
      });
      // Refresh to get the new thread
      await loadData();
      setActiveTab('chats');
    }
  };

  const handleDeclineRequest = async (req) => {
    const { error } = await respondToRequest(req.id, 'declined', null);
    if (!error) {
      toast({
        title: 'Request declined',
      });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    }
  };

  // Find active thread data
  const activeThread = threads.find((t) => t.id === activeThreadId);
  let otherParty = null;
  let jobContext = null;
  if (activeThread?.match) {
    otherParty = role === 'candidate' ? activeThread.match.employer : activeThread.match.candidate;
    const job = activeThread.match.job;
    jobContext = job ? `${job.title}${job.company?.name ? ` · ${job.company.name}` : ''}` : null;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white relative overflow-hidden">
      {/* List View */}
      <div className="flex-1 flex flex-col w-full h-full">
        {/* Header / Tabs */}
        <div className="bg-white border-b border-slate-200 px-4 pt-12 md:pt-6 pb-0 flex-shrink-0 z-10 sticky top-0">
          <h1 className="text-xl font-bold text-slate-900 mb-4 px-2">Messages</h1>
          <div className="flex gap-6 px-2">
            <button
              onClick={() => setActiveTab('requests')}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'requests' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Requests
              {pendingRequestsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {pendingRequestsCount}
                </span>
              )}
              {activeTab === 'requests' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                activeTab === 'chats' ? 'text-brand' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Chats
              {unreadThreadsCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-brand text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  {unreadThreadsCount}
                </span>
              )}
              {activeTab === 'chats' && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"
                />
              )}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-hidden relative bg-white">
          <AnimatePresence mode="wait">
            {activeTab === 'requests' ? (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                <RequestsList
                  requests={requests}
                  loading={loadingRequests}
                  onAccept={handleAcceptRequest}
                  onDecline={handleDeclineRequest}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chats"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col"
              >
                <ThreadList
                  threads={threads}
                  userId={user?.id}
                  userRole={role}
                  loading={loadingThreads}
                  onSelectThread={handleSelectThread}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-in Thread View (Mobile/Default behavior) */}
      <AnimatePresence>
        {view === 'thread' && activeThreadId && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute inset-0 z-50 bg-white"
          >
            <ChatThread
              threadId={activeThreadId}
              isRequest={activeThread?.isRequest}
              initialMessages={activeThread?.isRequest ? activeThread.messages : null}
              otherParty={otherParty}
              jobContext={jobContext}
              userId={user?.id}
              onBack={handleBackToList}
              onThreadUpdate={loadData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
