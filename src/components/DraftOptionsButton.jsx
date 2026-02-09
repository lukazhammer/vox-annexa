import React, { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DraftOptionsButton({
  fieldKey,
  fieldLabel,
  currentValue,
  tier = 'free',
  formContext = {},
  onSelect,
  disabled = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');

  const loadDraftOptions = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('draftFieldOptions', {
        fieldKey,
        fieldLabel,
        currentValue: currentValue || '',
        formContext,
        tier,
      });

      const data = response?.data || response;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create draft options.');
      }

      const nextOptions = Array.isArray(data.options) ? data.options : [];
      setOptions(nextOptions);
      setIsOpen(true);
      base44.analytics.track({
        eventName: 'draft_options_created',
        properties: { field: fieldKey, tier },
      });
    } catch (err) {
      setError(err?.message || 'Failed to create draft options.');
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const applyOption = (option) => {
    onSelect(option);
    base44.analytics.track({
      eventName: 'draft_option_applied',
      properties: { field: fieldKey },
    });
  };

  return (
    <div className="mt-2 space-y-2">
      <button
        type="button"
        onClick={loadDraftOptions}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 text-xs text-[#C24516] hover:text-[#a33912] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
        <span>{isLoading ? 'Preparing options...' : 'Draft options'}</span>
      </button>

      {isOpen && (
        <div className="border border-zinc-700 rounded-lg bg-zinc-900/70 p-2 space-y-2">
          {error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : options.length > 0 ? (
            <>
              {options.map((option, index) => (
                <button
                  key={`${fieldKey}-option-${index}`}
                  type="button"
                  onClick={() => applyOption(option)}
                  className="w-full text-left text-sm text-zinc-200 px-2.5 py-2 border border-zinc-700 rounded hover:border-[#C24516] hover:bg-[#C24516]/10 transition-colors"
                >
                  {option}
                </button>
              ))}
            </>
          ) : (
            <p className="text-xs text-zinc-500">No options available right now.</p>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
