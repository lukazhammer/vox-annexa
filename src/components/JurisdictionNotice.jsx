import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function JurisdictionNotice({ jurisdiction, country }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!jurisdiction || jurisdiction === 'rest') {
    return null;
  }

  if (jurisdiction === 'eu') {
    return (
      <div className="border-b border-[rgba(250,247,242,0.1)] py-2 px-0 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-xs text-[rgba(250,247,242,0.5)]">Your GDPR rights</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-2 text-xs text-[rgba(250,247,242,0.6)] space-y-1">
            <p>Under GDPR you can access, delete, export, or object to processing.</p>
            <a href="mailto:privacy@vox-animus.com" className="text-[#C24516] hover:underline block">
              Email privacy@vox-animus.com
            </a>
          </div>
        )}
      </div>
    );
  }

  if (jurisdiction === 'california') {
    return (
      <div className="border-b border-[rgba(250,247,242,0.1)] py-2 px-0 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-xs text-[rgba(250,247,242,0.5)]">Your CCPA rights</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-2 text-xs text-[rgba(250,247,242,0.6)] space-y-1">
            <p>Under CCPA you can know, delete, and opt out of data sales.</p>
            <a href="mailto:privacy@vox-animus.com" className="text-[#C24516] hover:underline block">
              Email privacy@vox-animus.com
            </a>
          </div>
        )}
      </div>
    );
  }

  if (jurisdiction === 'brazil') {
    return (
      <div className="border-b border-[rgba(250,247,242,0.1)] py-2 px-0 mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-xs text-[rgba(250,247,242,0.5)]">Seus direitos LGPD</span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[rgba(250,247,242,0.4)]" />
          )}
        </button>
        {isExpanded && (
          <div className="mt-2 text-xs text-[rgba(250,247,242,0.6)] space-y-1">
            <p>Sob LGPD você pode confirmar, acessar, corrigir ou deletar seus dados.</p>
            <a href="mailto:privacy@vox-animus.com" className="text-[#C24516] hover:underline block">
              Email privacy@vox-animus.com
            </a>
          </div>
        )}
      </div>
    );
  }

  return null;
}
