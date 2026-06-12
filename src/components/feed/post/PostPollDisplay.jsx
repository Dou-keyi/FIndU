// PostPollDisplay.jsx — poll voting UI with live results
import React, { useState, useMemo } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

export default function PostPollDisplay({ poll, options = [], votes = [], userVote }) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState(userVote?.option_id || null);
  const [localVotes, setLocalVotes] = useState(votes);
  const [voting, setVoting] = useState(false);

  const hasVoted = !!selectedOption;
  const isExpired = poll?.expires_at ? new Date(poll.expires_at) < new Date() : false;
  const showResults = hasVoted || isExpired;

  const totalVotes = localVotes.length;

  const optionVoteCounts = useMemo(() => {
    const counts = {};
    options.forEach((o) => { counts[o.id] = 0; });
    localVotes.forEach((v) => {
      if (counts[v.option_id] !== undefined) counts[v.option_id]++;
    });
    return counts;
  }, [options, localVotes]);

  // Time remaining
  const timeRemaining = useMemo(() => {
    if (!poll?.expires_at) return null;
    const diff = new Date(poll.expires_at) - new Date();
    if (diff <= 0) return 'Ended';
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  }, [poll?.expires_at]);

  const handleVote = async (optionId) => {
    if (hasVoted || isExpired || voting || !user) return;
    setVoting(true);

    try {
      const { error } = await supabase.from('poll_votes').insert({
        poll_id: poll.id,
        option_id: optionId,
        user_id: user.id,
      });

      if (error && error.code !== '23505') throw error;

      setSelectedOption(optionId);
      setLocalVotes((prev) => [...prev, { option_id: optionId, user_id: user.id }]);
    } catch (err) {
      console.error('Failed to vote:', err);
    } finally {
      setVoting(false);
    }
  };

  const [translatedData, setTranslatedData] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async (e) => {
    e.stopPropagation();
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
      // Import translateText dynamically or at top of file
      const { translateText } = await import('../../../lib/translation');
      const targetLang = navigator.language.split('-')[0] || 'en';
      const qRes = poll.question ? await translateText(poll.question, targetLang) : null;
      
      const optPromises = options.map(async (opt) => {
        const oRes = await translateText(opt.text, targetLang);
        return { id: opt.id, text: oRes.translated };
      });
      const translatedOptions = await Promise.all(optPromises);

      setTranslatedData({
        question: qRes ? qRes.translated : null,
        options: translatedOptions,
        detectedLang: qRes ? qRes.detectedLang : 'unknown'
      });
      setShowTranslation(true);
    } catch (err) {
      console.error('Failed to translate poll:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="mb-3 space-y-2">
      {/* Question */}
      {poll?.question && (
        <p className="text-sm font-semibold text-gray-800 mb-2">
          {showTranslation && translatedData?.question ? translatedData.question : poll.question}
        </p>
      )}

      {/* Options */}
      {options.map((option) => {
        const count = optionVoteCounts[option.id] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = selectedOption === option.id;

        const displayText = showTranslation && translatedData
          ? translatedData.options.find((o) => o.id === option.id)?.text || option.text
          : option.text;

        return (
          <button
            key={option.id}
            onClick={() => handleVote(option.id)}
            disabled={showResults || voting}
            className={`relative w-full text-left px-4 py-2.5 rounded-xl border transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              isSelected
                ? 'border-violet-300 bg-violet-50'
                : showResults
                  ? 'border-gray-100 bg-gray-50/50'
                  : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/30 cursor-pointer'
            }`}
          >
            {/* Fill bar (visible after voting or expired) */}
            {showResults && (
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-xl ${
                  isSelected ? 'bg-violet-100' : 'bg-gray-100'
                }`}
                style={{ width: `${pct}%` }}
              />
            )}

            <div className="relative flex items-center justify-between">
              <span className={`text-sm font-medium ${isSelected ? 'text-violet-800' : 'text-gray-700'}`}>
                {isSelected && <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-violet-600" />}
                {displayText}
              </span>
              {showResults && (
                <span className={`text-sm font-bold ${isSelected ? 'text-violet-700' : 'text-gray-500'}`}>
                  {pct}%
                </span>
              )}
            </div>
          </button>
        );
      })}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {timeRemaining && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeRemaining}
            </span>
          )}
        </div>
        
        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          {isTranslating ? (
            'Translating...'
          ) : showTranslation ? (
            `See original (${translatedData.detectedLang.toUpperCase()})`
          ) : (
            'Translate poll'
          )}
        </button>
      </div>
    </div>
  );
}
