import React, { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REFINEMENT_TYPES = [
  { key: 'clarify', label: 'Clarify' },
  { key: 'expand', label: 'Expand' },
  { key: 'simplify', label: 'Simplify' },
  { key: 'align', label: 'Align with Website' },
];

export default function AIRefineButton({
  fieldName,
  currentValue,
  context,
  onSelect,
}) {
  const [isRefining, setIsRefining] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);

  const refineField = async (type) => {
    if (!currentValue?.trim()) return;

    setIsRefining(true);
    setSuggestions(null);
    setError(null);

    try {
      const result = await base44.functions.invoke('refineField', {
        fieldName,
        currentValue,
        context,
        refinementType: type,
      });

      const data = result.data || result;

      if (!data.success) {
        setError(data.error || 'Refinement failed');
        return;
      }

      setSuggestions(data);

      base44.analytics.track({
        eventName: 'ai_refine_created',
        properties: { field: fieldName, type }
      });
    } catch (err) {
      setError('Could not refine. Try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelect = (value) => {
    onSelect(value);
    setSuggestions(null);

    base44.analytics.track({
      eventName: 'ai_refine_selected',
      properties: { field: fieldName }
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Refinement Type Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {REFINEMENT_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => refineField(type.key)}
            disabled={isRefining || !currentValue?.trim()}
            className="text-xs px-2.5 py-1 border border-[#C24516]/40 text-[#C24516] rounded hover:bg-[#C24516] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3" />
            {type.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isRefining && (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C24516]" />
          <span>Refining...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Suggestions */}
      {suggestions && (
        <div className="p-3 border border-[#C24516]/20 rounded-lg bg-[#C24516]/5 space-y-2">
          <div className="text-xs text-zinc-400 mb-1">AI suggestions:</div>

          {/* Primary */}
          <button
            type="button"
            onClick={() => handleSelect(suggestions.refined)}
            className="w-full text-left p-2.5 border border-zinc-700 rounded hover:border-[#C24516] hover:bg-[#C24516]/10 transition-colors"
          >
            <div className="text-sm text-zinc-200">{suggestions.refined}</div>
            {suggestions.rationale && (
              <div className="text-xs text-zinc-500 mt-1">{suggestions.rationale}</div>
            )}
          </button>

          {/* Alternatives */}
          {suggestions.alternatives?.map((alt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(alt)}
              className="w-full text-left p-2.5 border border-zinc-700 rounded hover:border-[#C24516] hover:bg-[#C24516]/10 transition-colors"
            >
              <div className="text-sm text-zinc-300">{alt}</div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSuggestions(null)}
            className="text-xs text-zinc-500 hover:text-zinc-400"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
