import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Loader2, Briefcase } from 'lucide-react';
import { searchJobs } from '../../lib/feedData';
import FeedJobCard from '../feed/FeedJobCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobsListSection({ profile, onJobClick, onJobApply }) {
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    minSalary: '',
    workType: 'all',
  });
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle searching
  useEffect(() => {
    let cancelled = false;
    const fetchSearch = async () => {
      setLoading(true);
      const results = await searchJobs(profile, filters);
      if (!cancelled) {
        setJobs(results);
        setLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters, profile]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyClick = async (job) => {
    if (onJobApply) {
      await onJobApply(job);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, has_applied: true } : j));
    }
  };

  const workTypes = [
    { id: 'all', label: 'All Types' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'On-site' },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-12 md:py-24 relative z-20 mt-10">
      <div className="flex flex-col items-center mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Explore Opportunities
        </h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Discover your next role anywhere on Earth. Filter by your preferences to find the perfect match.
        </p>
      </div>

      {/* Search & Filters Container */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 mb-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Job Title */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="text"
              name="title"
              value={filters.title}
              onChange={handleFilterChange}
              placeholder="Job title or keyword"
              className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
            />
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
              onChange={handleFilterChange}
              placeholder="City, state, or country"
              className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Min Salary */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-white/40" />
            </div>
            <input
              type="number"
              name="minSalary"
              value={filters.minSalary}
              onChange={handleFilterChange}
              placeholder="Min salary (e.g. 5000)"
              className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {/* Work Types */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-white/60 text-sm font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Work Type:
          </span>
          {workTypes.map((wt) => (
            <button
              key={wt.id}
              onClick={() => setFilters(prev => ({ ...prev, workType: wt.id }))}
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
            {loading ? 'Searching...' : `${jobs.length} Results`}
          </h3>
          {loading && <Loader2 className="w-5 h-5 text-brand animate-spin" />}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {!loading && jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md"
              >
                <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No jobs found matching your criteria.</p>
                <button 
                  onClick={() => setFilters({ title: '', location: '', minSalary: '', workType: 'all' })}
                  className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FeedJobCard
                    job={job}
                    onViewDetail={onJobClick}
                    onApply={handleApplyClick}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
