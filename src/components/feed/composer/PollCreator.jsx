// PollCreator.jsx — poll question + options + expiry selector
import React from 'react';
import { Plus, X, BarChart3 } from 'lucide-react';
import { POLL_EXPIRY_OPTIONS } from '../../../lib/feedConstants';

export default function PollCreator({
  question,
  options,
  expiry,
  onQuestionChange,
  onOptionChange,
  onAddOption,
  onRemoveOption,
  onExpiryChange,
  onRemovePoll,
}) {
  return (
    <div className="border border-violet-200 rounded-xl p-4 bg-violet-50/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 uppercase tracking-wider">
          <BarChart3 className="w-3.5 h-3.5" />
          Poll
        </div>
        <button
          onClick={onRemovePoll}
          className="p-1 rounded-full hover:bg-violet-100 text-violet-400 hover:text-violet-600 transition-colors"
          aria-label="Remove poll"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Question */}
      <input
        type="text"
        placeholder="Ask a question…"
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
        className="w-full text-sm font-medium border border-violet-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white placeholder-gray-400"
      />

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-violet-400 font-bold w-5 text-center">{i + 1}</span>
            <input
              type="text"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => onOptionChange(i, e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white placeholder-gray-400"
            />
            {options.length > 2 && (
              <button
                onClick={() => onRemoveOption(i)}
                className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove option ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add option */}
      {options.length < 4 && (
        <button
          onClick={onAddOption}
          className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Option
        </button>
      )}

      {/* Expiry */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Expires in:</span>
        <div className="flex gap-1.5">
          {POLL_EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onExpiryChange(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                expiry === opt.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
