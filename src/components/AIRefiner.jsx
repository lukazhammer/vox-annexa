import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIRefiner({ value, onSelect, fieldName }) {
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refinements, setRefinements] = useState(null);
  const [lastProcessed, setLastProcessed] = useState('');

  // Detect sentence completion
  useEffect(() => {
    if (!value || value.length < 20) {
      setShowOptions(false);
      return;
    }

    const trimmedValue = value.trim();
    
    // Check if sentence is complete (ends with period, or is a meaningful phrase)
    const hasPeriod = trimmedValue.endsWith('.');
    const wordCount = trimmedValue.split(/\s+/).length;
    const isSentenceComplete = hasPeriod || wordCount >= 8;

    if (isSentenceComplete && trimmedValue !== lastProcessed) {
      setShowOptions(true);
      setRefinements(null);
    } else if (!isSentenceComplete) {
      setShowOptions(false);
      setRefinements(null);
    }
  }, [value, lastProcessed]);

  const generateRefinements = async () => {
    if (loading || !value) return;
    
    setLoading(true);
    try {
      const prompt = `You are a business writing expert. The user wrote: "${value}"

Create three distinct improvements of this text:
1. CONCISE: Make it shorter and punchier (1 sentence max)
2. PROFESSIONAL: Make it more formal and polished
3. STRATEGIC: Make it more compelling and value-focused

CRITICAL RULES:
- DO NOT invent new features or functions
- DO NOT add details that weren't in the original
- ONLY refine what the user already wrote
- Keep the core meaning intact
- Each version must be a single sentence

Return ONLY valid JSON with this exact structure:
{
  "concise": "...",
  "professional": "...",
  "strategic": "..."
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            concise: { type: "string" },
            professional: { type: "string" },
            strategic: { type: "string" }
          },
          required: ["concise", "professional", "strategic"]
        }
      });

      setRefinements(response);
      setLastProcessed(value.trim());
      
      base44.analytics.track({
        eventName: 'ai_refinement_created',
        properties: { field: fieldName }
      });
    } catch (error) {
      console.error('Failed to create refinements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (refinement) => {
    onSelect(refinement);
    setShowOptions(false);
    setRefinements(null);
    
    base44.analytics.track({
      eventName: 'ai_refinement_selected',
      properties: { field: fieldName }
    });
  };

  if (!showOptions) return null;

  return (
    <div className="mt-2">
      {!refinements ? (
        <button
          type="button"
          onClick={generateRefinements}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-[#C24516] hover:text-[#a33912] transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing refinements...</span>
            </>
          ) : (
           <>
             <Lightbulb className="w-4 h-4" />
             <span>Refine Draft</span>
           </>
          )}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-zinc-400 mb-2">Choose a refinement:</div>
          
          <button
            type="button"
            onClick={() => handleSelect(refinements.concise)}
            className="w-full text-left p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-[#C24516] transition-colors group"
          >
            <div className="text-xs text-[#C24516] font-semibold mb-1">Concise</div>
            <div className="text-sm text-zinc-300 group-hover:text-white">{refinements.concise}</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(refinements.professional)}
            className="w-full text-left p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-[#C24516] transition-colors group"
          >
            <div className="text-xs text-[#C24516] font-semibold mb-1">Professional</div>
            <div className="text-sm text-zinc-300 group-hover:text-white">{refinements.professional}</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect(refinements.strategic)}
            className="w-full text-left p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-[#C24516] transition-colors group"
          >
            <div className="text-xs text-[#C24516] font-semibold mb-1">Strategic</div>
            <div className="text-sm text-zinc-300 group-hover:text-white">{refinements.strategic}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowOptions(false);
              setRefinements(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-400"
          >
            Keep original
          </button>
        </div>
      )}
    </div>
  );
}
