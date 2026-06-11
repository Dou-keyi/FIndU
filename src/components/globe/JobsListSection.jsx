import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Loader2, Briefcase, Users, FileText } from 'lucide-react';
import { searchJobs, searchCandidates } from '../../lib/feedData';
import FeedJobCard from '../feed/FeedJobCard';
import FeedCandidateCard from '../feed/FeedCandidateCard';
import { motion, AnimatePresence } from 'framer-motion';

function SearchTabContent({
  mode,
  results,
  loading,
  filters,
  onFilterChange,
  onJobClick,
  onJobApply,
  onCandidateClick,
  profile,
  workTypes
}) {
  return (
    <div className="w-full">
      {/* Search & Filters Container */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-10 shadow-2xl">
        <div className={`grid grid-cols-1 ${mode === 'jobs' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 mb-6`}>
          {/* Keyword / Title */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            {mode === 'jobs' ? (
              <input
                type="text"
                name="title"
                value={filters.title}
                onChange={onFilterChange}
                placeholder="Job title or keyword"
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              />
            ) : (
              <input
                type="text"
                name="keyword"
                value={filters.keyword}
                onChange={onFilterChange}
                placeholder="Candidate name, skills, or headline"
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              />
            )}
          </div>

          {/* Location */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={onFilterChange}
              placeholder="City, state, or country"
              className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Min Salary (Only for Jobs) */}
          {mode === 'jobs' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-white/40" />
              </div>
              <input
                type="number"
                name="minSalary"
                value={filters.minSalary}
                onChange={onFilterChange}
                placeholder="Min salary (e.g. 5000)"
                className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              />
            </div>
          )}
        </div>

        {/* Work Types */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white/60 text-sm font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Work Type:
          </span>
          {workTypes.map((wt) => (
            <button
              key={wt.id}
              onClick={() => onFilterChange({ target: { name: 'workType', value: wt.id } })}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filters.workType === wt.id
                  ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {loading ? 'Searching...' : `${results.length} Results`}
          </h3>
          {loading && <Loader2 className="w-5 h-5 text-brand animate-spin" />}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {!loading && results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md"
              >
                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">
                  {mode === 'jobs' 
                    ? 'No jobs found matching your criteria.'
                    : 'No candidates found matching your criteria.'}
                </p>
                <button 
                  onClick={() => {
                    onFilterChange({ target: { name: 'title', value: '' } });
                    onFilterChange({ target: { name: 'keyword', value: '' } });
                    onFilterChange({ target: { name: 'location', value: '' } });
                    onFilterChange({ target: { name: 'minSalary', value: '' } });
                    onFilterChange({ target: { name: 'workType', value: 'all' } });
                  }}
                  className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              results.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {mode === 'candidates' || item.role === 'candidate' ? (
                    <FeedCandidateCard
                      candidate={item}
                      onViewDetail={onCandidateClick}
                    />
                  ) : (
                    <FeedJobCard
                      job={item}
                      onViewDetail={onJobClick}
                      onApply={onJobApply}
                      isEmployerForCompany={profile?.id && profile.id === item.company?.owner_id}
                      onEdit={(id) => { window.location.href = `/edit-job/${id}`; }}
                      onDelete={async (id) => {
                        if (!window.confirm("Are you sure you want to delete this job?")) return;
                        try {
                          const { deleteJob } = await import('../../lib/jobPostingData');
                          await deleteJob(id);
                          // Deletion requires state update in parent, we leave it to reload or just refresh page for simplicity, but a proper callback is better.
                          window.location.reload();
                        } catch(e) {
                          console.error("Failed to delete job:", e);
                        }
                      }}
                    />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function JobsListSection({ profile, onJobClick, onJobApply, onCandidateClick }) {
  const isEmployer = profile?.role === 'employer';
  
  const [searchMode, setSearchMode] = useState(isEmployer ? 'candidates' : 'jobs');
  const [direction, setDirection] = useState(0);

  const [filters, setFilters] = useState({
    title: '',
    keyword: '',
    location: '',
    minSalary: '',
    workType: 'all',
  });
  
  // Separate states for separate tabs
  const [jobsResults, setJobsResults] = useState([]);
  const [candidateResults, setCandidateResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleTabSwitch = (newMode) => {
    if (newMode === searchMode) return;
    setDirection(newMode === 'jobs' ? 1 : -1);
    setSearchMode(newMode);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchSearch = async () => {
      setLoading(true);
      
      if (searchMode === 'jobs') {
        const data = await searchJobs(profile, {
          title: filters.title,
          location: filters.location,
          minSalary: filters.minSalary,
          workType: filters.workType,
        });
        if (!cancelled) {
          setJobsResults(data);
          setLoading(false);
        }
      } else {
        const data = await searchCandidates({
          keyword: filters.keyword,
          location: filters.location,
          workType: filters.workType,
        });
        if (!cancelled) {
          setCandidateResults(data);
          setLoading(false);
        }
      }
    };
    
    const timer = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, profile, searchMode]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const workTypes = [
    { id: 'all', label: 'All Types' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'On-site' },
  ];

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0
    })
  };

  const activeResults = searchMode === 'jobs' ? jobsResults : candidateResults;

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-24 relative z-20 mt-10">
      <div className="flex flex-col items-center mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          {searchMode === 'jobs' ? 'Explore Opportunities' : 'Discover Talent'}
        </h2>
        <p className="text-white/60 text-lg max-w-2xl">
          {searchMode === 'jobs' 
            ? 'Discover your next role anywhere on Earth. Filter by your preferences to find the perfect match.'
            : 'Find the perfect candidates for your open roles. Filter by skills, location, and work type.'}
        </p>
      </div>

      {isEmployer && (
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex backdrop-blur-md">
            <button
              onClick={() => handleTabSwitch('candidates')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                searchMode === 'candidates'
                  ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              Candidates
            </button>
            <button
              onClick={() => handleTabSwitch('jobs')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                searchMode === 'jobs'
                  ? 'bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Jobs
            </button>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={searchMode}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <SearchTabContent
              mode={searchMode}
              results={activeResults}
              loading={loading}
              filters={filters}
              onFilterChange={handleFilterChange}
              onJobClick={onJobClick}
              onJobApply={onJobApply}
              onCandidateClick={onCandidateClick}
              profile={profile}
              workTypes={workTypes}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
