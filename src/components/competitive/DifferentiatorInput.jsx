import { useState } from 'react';

export function DifferentiatorInput({ onAdd, isLoading = false }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 10x faster onboarding than competitors"
          className="flex-1 px-4 py-3 border-2 border-zinc-700 rounded-lg bg-[#09090B] text-[#faf7f2] focus:border-[#C24516] focus:outline-none placeholder:text-zinc-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="px-6 py-3 bg-[#C24516] text-white rounded-lg hover:bg-[#A03814] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
        >
          {isLoading ? 'Updating...' : '+ Add'}
        </button>
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        Add how you're different. Chart updates in real-time.
      </p>
    </form>
  );
}

export function DifferentiatorList({ differentiators, onRemove }) {
  if (!differentiators || differentiators.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No differentiators added yet.</p>
        <p className="text-sm mt-2">Add one above to see the chart update.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {differentiators.map((diff, index) => (
        <div
          key={index}
          className="flex items-start justify-between gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800"
        >
          <div className="flex-1">
            <p className="text-sm text-[#faf7f2]">{diff.text}</p>
            {diff.changedAxes && diff.changedAxes.length > 0 && (
              <p className="text-xs text-[#C24516] mt-1">
                Updated: {diff.changedAxes.join(', ')}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemove(index)}
            className="text-zinc-500 hover:text-[#faf7f2] transition-colors"
            aria-label="Remove differentiator"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default DifferentiatorInput;
