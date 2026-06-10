// PostContent.jsx — renders post text with @mentions, #hashtags, and see more/less
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Loader2 } from 'lucide-react';
import { translateText } from '../../../lib/translation';
import toast from 'react-hot-toast';

const COLLAPSED_LINES = 4;

/**
 * Parse post content into segments: text, @mention, #hashtag
 */
function parseContent(text) {
  if (!text) return [];
  const regex = /(@\[([^\]]+)\]\(([^)]+)\))|(@[\w]+)|(#[\w]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // @[Name](userId) format
      segments.push({ type: 'mention', name: match[2], userId: match[3] });
    } else if (match[4]) {
      // @username format
      segments.push({ type: 'mention', name: match[4].slice(1), userId: null });
    } else if (match[5]) {
      // #hashtag
      segments.push({ type: 'hashtag', tag: match[5].slice(1) });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}

export default function PostContent({ content }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef(null);

  // Translation state
  const [translatedData, setTranslatedData] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight) || 20;
      const maxHeight = lineHeight * COLLAPSED_LINES;
      setNeedsTruncation(contentRef.current.scrollHeight > maxHeight + 2);
    }
  }, [content, showTranslation]); // Recalculate truncation if translation changes

  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translatedData) {
      setShowTranslation(true);
      return;
    }

    setIsTranslating(true);
    try {
      const targetLang = navigator.language.split('-')[0] || 'en';
      const result = await translateText(content, targetLang);
      setTranslatedData({
        translated: result.translated,
        detectedLang: result.detectedLang
      });
      setShowTranslation(true);
    } catch (err) {
      toast.error('Failed to translate post.');
    } finally {
      setIsTranslating(false);
    }
  };

  const displayContent = showTranslation && translatedData ? translatedData.translated : content;
  const segments = parseContent(displayContent);

  return (
    <div className="mb-3">
      <div
        ref={contentRef}
        className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap text-pretty transition-all duration-200 ${
          !expanded && needsTruncation ? 'line-clamp-4' : ''
        }`}
      >
        {segments.map((seg, i) => {
          if (seg.type === 'mention') {
            return (
              <button
                key={i}
                onClick={() => seg.userId && navigate(`/portfolio/${seg.userId}`)}
                className="text-violet-600 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 rounded"
              >
                @{seg.name}
              </button>
            );
          }
          if (seg.type === 'hashtag') {
            return (
              <button
                key={i}
                onClick={() => navigate(`/feed?hashtag=${encodeURIComponent(seg.tag)}`)}
                className="text-violet-600 font-semibold hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 rounded"
              >
                #{seg.tag}
              </button>
            );
          }
          return <span key={i}>{seg.value}</span>;
        })}
      </div>

      {needsTruncation && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-violet-600 hover:text-violet-800 mt-1 mr-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}

      {/* Translate Action */}
      {content && content.length > 5 && (
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mt-2 transition-colors focus-visible:outline-none rounded disabled:opacity-50"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : showTranslation ? (
            <>
              <Globe2 className="w-3.5 h-3.5" />
              <span>See original (translated from {translatedData.detectedLang.toUpperCase()})</span>
            </>
          ) : (
            <>
              <Globe2 className="w-3.5 h-3.5" />
              <span>Translate</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
