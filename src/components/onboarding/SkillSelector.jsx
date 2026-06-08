// SkillSelector — searchable skill chip selector with pre-populated suggestions and custom entry
import { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/input';

const DEFAULT_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'UI/UX Design', 'Product Management',
  'Data Analysis', 'TypeScript', 'Go', 'Java', 'DevOps', 'Marketing',
  'Sales', 'Finance',
];

export default function SkillSelector({
  selected = [],
  onChange,
  suggestions = DEFAULT_SUGGESTIONS,
  minRequired = 2,
  error,
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !selected.includes(s) &&
      s.toLowerCase().includes(query.toLowerCase())
  );

  function addSkill(skill) {
    const trimmed = skill.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setQuery('');
    inputRef.current?.focus();
  }

  function removeSkill(skill) {
    onChange(selected.filter((s) => s !== skill));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        addSkill(query);
      }
    }
    // Backspace on empty input removes last selected skill
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeSkill(selected[selected.length - 1]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or add skills…"
          className={error ? 'border-red-500' : ''}
        />
        {query && (
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to add &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Selected skills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <span
              key={skill}
              className="skill-chip skill-chip--selected inline-flex items-center gap-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestion chips */}
      {filteredSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="skill-chip skill-chip--unselected"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Count indicator */}
      <p className="text-xs text-muted-foreground">
        {selected.length} selected{minRequired > 0 ? ` (min ${minRequired})` : ''}
      </p>
    </div>
  );
}
