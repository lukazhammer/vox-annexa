import { useNavigate } from 'react-router-dom';

export function PremiumUpgradeModal({ isOpen, onClose, trigger = 'competitive_intel' }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const benefits = {
    competitive_intel: {
      title: 'Access competitive intelligence',
      description: 'See where you stand vs competitors with interactive radar charts',
      features: [
        'Real-time competitor website crawling',
        'AI-generated market dimensions (6-8 axes)',
        'Percentile scoring (0-100 scale)',
        'Interactive chart updates',
        'Export as PNG/PDF',
      ],
    },
    export: {
      title: 'Access clean exports',
      description: 'Download professional documents without watermarks',
      features: [
        'All legal docs (Privacy, Terms, Cookies, About)',
        'SEO files (robots.txt, llms.txt, sitemap.xml)',
        'Export as .docx, .pdf, .md',
        'No watermarks',
        'Lifetime access',
      ],
    },
  };

  const content = benefits[trigger] || benefits.competitive_intel;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#09090B] border-2 border-[#C24516] rounded-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-[#faf7f2] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 bg-[#C24516]/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#C24516]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl mb-2 text-[#faf7f2]">{content.title}</h3>
          <p className="text-zinc-400">{content.description}</p>
        </div>

        <ul className="space-y-3 mb-8">
          {content.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-[#C24516] text-xl flex-shrink-0">&#10003;</span>
              <span className="text-sm text-[#faf7f2]">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <button
            onClick={() => {
              navigate('/Form?upgrade=true');
              onClose();
            }}
            className="w-full bg-[#C24516] text-white px-6 py-4 rounded-lg font-medium hover:bg-[#A03814] transition-colors"
          >
            Upgrade to Premium -- $29
          </button>

          <button
            onClick={onClose}
            className="w-full border border-zinc-700 text-zinc-400 px-6 py-3 rounded-lg hover:bg-zinc-900 transition-colors text-sm"
          >
            Maybe later
          </button>
        </div>

        <p className="text-xs text-center text-zinc-500 mt-4">
          One-time payment. No subscription. Lifetime access.
        </p>
      </div>
    </div>
  );
}

export default PremiumUpgradeModal;
