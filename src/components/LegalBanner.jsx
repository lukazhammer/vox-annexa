import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function LegalBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('annexa-legal-banner-dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('annexa-legal-banner-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-transparent border-b border-[rgba(250,247,242,0.1)] py-2 px-0 mb-4 relative">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[rgba(250,247,242,0.5)]">
          Created templates should be reviewed by legal counsel.{' '}
          <a
            href="/annexaterms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C24516] hover:underline"
          >
            Terms
          </a>
        </p>
        <button
          onClick={handleDismiss}
          className="text-[rgba(250,247,242,0.4)] hover:text-[rgba(250,247,242,0.6)] transition-colors duration-150"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
