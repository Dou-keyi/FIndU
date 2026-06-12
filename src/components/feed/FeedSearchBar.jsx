import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';

const DEFAULT_HASHTAGS = ['hiring', 'design', 'software', 'portfolio', 'marketing', 'product', 'freelance'];

export default function FeedSearchBar() {
  const searchQuery = useFeedStore((s) => s.searchQuery);
  const setSearchQuery = useFeedStore((s) => s.setSearchQuery);
  const searchTags = useFeedStore((s) => s.searchTags);
  const addSearchTag = useFeedStore((s) => s.addSearchTag);
  const removeSearchTag = useFeedStore((s) => s.removeSearchTag);
  const posts = useFeedStore((s) => s.posts);

  const [isFocused, setIsFocused] = useState(false);
  const [hashtagPrefix, setHashtagPrefix] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Extract dynamic hashtags from current feed
  const availableHashtags = useMemo(() => {
    const tags = new Set(DEFAULT_HASHTAGS);
    posts.forEach((p) => {
      p.hashtags?.forEach((t) => tags.add(t.replace(/^#/, '').toLowerCase()));
    });
    // Remove tags already selected
    searchTags.forEach(t => tags.delete(t.toLowerCase()));
    return Array.from(tags);
  }, [posts, searchTags]);

  // Filter hashtags based on what user typed after '#'
  const suggestedHashtags = useMemo(() => {
    if (hashtagPrefix === null) return [];
    const prefix = hashtagPrefix.toLowerCase();
    return availableHashtags
      .filter((tag) => tag.startsWith(prefix))
      .slice(0, 5); // show top 5
  }, [hashtagPrefix, availableHashtags]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setHashtagPrefix(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update hashtag detection when query changes
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Detect if we are currently typing a hashtag at the end of the input
    const match = val.match(/#(\w*)$/);
    if (match) {
      setHashtagPrefix(match[1]);
      setHighlightedIndex(0);
    } else {
      setHashtagPrefix(null);
    }
  };

  const handleKeyDown = (e) => {
    // Backspace on empty input removes last tag
    if (e.key === 'Backspace' && searchQuery === '' && searchTags.length > 0) {
      e.preventDefault();
      removeSearchTag(searchTags[searchTags.length - 1]);
    }

    // Dropdown navigation
    if (hashtagPrefix !== null && suggestedHashtags.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestedHashtags.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + suggestedHashtags.length) % suggestedHashtags.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectHashtag(suggestedHashtags[highlightedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setHashtagPrefix(null);
      }
    } else if (e.key === 'Enter') {
      // Regular enter (could trigger manual fetch or blur, but Zustand automatically reacts)
      inputRef.current?.blur();
    }
  };

  const selectHashtag = (tag) => {
    addSearchTag(tag);
    // Remove the `#...` part from the search query
    const newQuery = searchQuery.replace(/#\w*$/, '').trim();
    setSearchQuery(newQuery);
    setHashtagPrefix(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full lg:px-0">
      <div 
        className={`flex items-center gap-2 px-3 py-2 bg-white border rounded-xl transition-all ${
          isFocused ? 'border-brand ring-2 ring-brand/20 shadow-sm' : 'border-gray-200'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        
        {/* Selected Hashtag Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {searchTags.map((tag) => (
            <span 
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded-md border border-brand-100"
            >
              #{tag}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeSearchTag(tag);
                }}
                className="hover:bg-brand-100 p-0.5 rounded-full transition-colors"
                aria-label={`Remove #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={searchTags.length === 0 ? "Search posts or type # for tags..." : "Add text or tags..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Hashtag Suggestion Dropdown */}
      {hashtagPrefix !== null && suggestedHashtags.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50 py-1"
        >
          {suggestedHashtags.map((tag, idx) => (
            <button
              key={tag}
              onClick={() => selectHashtag(tag)}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors ${
                idx === highlightedIndex ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-400 font-light">#</span>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
