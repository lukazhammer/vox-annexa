import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [bottomUrl, setBottomUrl] = useState('');

  const handleStart = async (inputUrl) => {
    const target = inputUrl || url;
    if (!target) {
      navigate('/URLCapture');
      return;
    }

    setIsValidating(true);
    try {
      const normalized = target.startsWith('http') ? target : `https://${target}`;
      new URL(normalized);
      localStorage.setItem('userWebsiteURL', normalized);
      navigate('/URLCapture', { state: { prefillUrl: normalized } });
    } catch {
      navigate('/URLCapture');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-[56px] md:text-[48px] sm:text-[36px] leading-tight mb-6 text-[#faf7f2]">
            Legal docs that help you win.
            <br />
            Not just comply.
          </h2>

          {/* Value Prop */}
          <p className="text-xl text-[rgba(250,247,242,0.7)] mb-4 max-w-3xl mx-auto">
            GDPR compliance plus competitive intelligence.
            See where you stand. Find positioning gaps. Win customers.
          </p>

          {/* Trust Line */}
          <p className="text-base text-[rgba(250,247,242,0.5)] mb-12">
            Free legal docs. $29 for competitive radar. No subscription.
          </p>

          {/* Primary CTA */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="flex gap-3 mb-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="https://your-website.com"
                className="flex-1 px-6 py-4 text-lg border-2 border-[rgba(250,247,242,0.15)] rounded-lg bg-[#09090B] text-[#faf7f2] focus:border-[var(--app-accent)] focus:outline-none transition-colors placeholder:text-[rgba(250,247,242,0.3)]"
              />
              <button
                onClick={() => handleStart()}
                disabled={isValidating}
                className="px-8 py-4 bg-[var(--app-accent)] text-white rounded-lg text-lg font-medium hover:brightness-90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isValidating ? 'Validating...' : 'Start free'}
              </button>
            </div>

            <p className="text-sm text-[rgba(250,247,242,0.4)]">
              Preview everything free. No credit card required.
            </p>
          </div>

          {/* Visual Proof: Radar Chart Teaser */}
          <div className="relative max-w-3xl mx-auto">
            <div className="relative rounded-xl overflow-hidden border-2 border-[var(--app-accent)]/20">
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-transparent z-10 pointer-events-none"></div>

              {/* Mock radar chart SVG */}
              <svg viewBox="0 0 400 300" className="w-full h-auto blur-[3px] opacity-40">
                <defs>
                  <radialGradient id="radarGrad">
                    <stop offset="0%" stopColor="#C24516" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#C24516" stopOpacity="0"/>
                  </radialGradient>
                </defs>
                <circle cx="200" cy="150" r="30" fill="none" stroke="#faf7f2" strokeOpacity="0.1"/>
                <circle cx="200" cy="150" r="60" fill="none" stroke="#faf7f2" strokeOpacity="0.1"/>
                <circle cx="200" cy="150" r="90" fill="none" stroke="#faf7f2" strokeOpacity="0.1"/>
                <circle cx="200" cy="150" r="120" fill="none" stroke="#faf7f2" strokeOpacity="0.1"/>
                <line x1="200" y1="150" x2="200" y2="30" stroke="#faf7f2" strokeOpacity="0.2"/>
                <line x1="200" y1="150" x2="304" y2="90" stroke="#faf7f2" strokeOpacity="0.2"/>
                <line x1="200" y1="150" x2="304" y2="210" stroke="#faf7f2" strokeOpacity="0.2"/>
                <line x1="200" y1="150" x2="200" y2="270" stroke="#faf7f2" strokeOpacity="0.2"/>
                <line x1="200" y1="150" x2="96" y2="210" stroke="#faf7f2" strokeOpacity="0.2"/>
                <line x1="200" y1="150" x2="96" y2="90" stroke="#faf7f2" strokeOpacity="0.2"/>
                <polygon points="200,60 270,100 280,200 200,240 120,200 130,100" fill="url(#radarGrad)" stroke="#C24516" strokeWidth="2" opacity="0.6"/>
                <polygon points="200,80 250,110 260,190 200,220 140,190 150,110" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4"/>
              </svg>

              {/* Overlay card */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-[#09090B]/95 backdrop-blur-sm border-2 border-[var(--app-accent)] rounded-xl px-8 py-6 max-w-md mx-4 shadow-2xl">
                  <h3 className="text-2xl mb-3 text-[#faf7f2]">
                    See where you stand
                  </h3>
                  <p className="text-[rgba(250,247,242,0.6)] mb-6">
                    Competitive radar shows positioning across 6-8 market dimensions.
                    You vs competitors. Real percentile scores.
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[var(--app-accent)]"></div>
                      <span className="text-[rgba(250,247,242,0.5)]">You</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-[rgba(250,247,242,0.4)]"></div>
                      <span className="text-[rgba(250,247,242,0.5)]">Competitor</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-[rgba(250,247,242,0.4)] mt-4">
              Included with Premium ($29)
            </p>
          </div>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-24 bg-[#1a1a1c]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl text-center mb-16 text-[#faf7f2]">
            What you get
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="border-2 border-[rgba(250,247,242,0.12)] rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl text-[#faf7f2]">Free</h3>
                <span className="text-2xl font-bold text-[#faf7f2]">$0</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { title: 'Privacy Policy', desc: 'GDPR + CCPA compliant' },
                  { title: 'Terms of Service', desc: 'Enforceable, jurisdiction-aware' },
                  { title: 'Cookie Policy', desc: 'Matches your actual cookies' },
                  { title: 'About Us page', desc: 'Professional, not generic' },
                  { title: 'SEO files', desc: 'robots.txt, sitemap.xml, llms.txt' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[var(--app-accent)] text-xl flex-shrink-0">&#10003;</span>
                    <div>
                      <div className="font-medium text-[#faf7f2]">{item.title}</div>
                      <div className="text-sm text-[rgba(250,247,242,0.5)]">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/URLCapture')}
                className="w-full border-2 border-[var(--app-accent)] text-[var(--app-accent)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--app-accent)]/5 transition-colors"
              >
                Start free
              </button>

              <p className="text-xs text-[rgba(250,247,242,0.4)] text-center mt-4">
                Login required to download (abuse prevention)
              </p>
            </div>

            {/* Premium Tier */}
            <div className="border-2 border-[var(--app-accent)] rounded-xl p-8 relative bg-[var(--app-accent)]/5">
              <div className="absolute -top-3 left-8 bg-[var(--app-accent)] text-white text-xs font-medium px-3 py-1 rounded">
                Most builders choose this
              </div>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl text-[#faf7f2]">Premium</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#faf7f2]">$29</div>
                  <div className="text-xs text-[rgba(250,247,242,0.5)]">one-time</div>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  { icon: '✓', title: 'Everything in Free', desc: 'All legal docs included' },
                  { icon: '★', title: 'Competitive radar chart', desc: 'Visual positioning analysis' },
                  { icon: '★', title: 'Real-time competitor crawl', desc: 'Extract positioning automatically' },
                  { icon: '★', title: 'AI-generated dimensions', desc: '6-8 market-specific axes' },
                  { icon: '★', title: 'Percentile scoring', desc: 'You vs competitor (0-100 scale)' },
                  { icon: '★', title: 'Interactive updates', desc: 'Add differentiators, watch chart update' },
                  { icon: '★', title: 'Export radar as PNG/PDF', desc: 'Share with investors, team' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[var(--app-accent)] text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <div className="font-medium text-[#faf7f2]">{item.title}</div>
                      <div className="text-sm text-[rgba(250,247,242,0.5)]">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/URLCapture', { state: { premium: true } })}
                className="w-full bg-[var(--app-accent)] text-white px-6 py-3 rounded-lg font-medium hover:brightness-90 transition-colors"
              >
                Start with Premium
              </button>

              <p className="text-xs text-center mt-4 text-[var(--app-accent)]">
                VIP access to competitive intelligence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Competitive Intelligence Works */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl text-center mb-4 text-[#faf7f2]">
            How competitive intelligence works
          </h2>
          <p className="text-center text-[rgba(250,247,242,0.6)] mb-16 max-w-2xl mx-auto">
            Premium gives you strategic positioning analysis.
            See exactly where you win and where competitors have an edge.
          </p>

          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="mono-accent text-3xl text-[rgba(250,247,242,0.3)] flex-shrink-0 w-12">01</div>
              <div className="flex-1">
                <h3 className="text-2xl mb-3 text-[#faf7f2]">Paste competitor URL</h3>
                <p className="text-[rgba(250,247,242,0.6)] mb-4">
                  We crawl their website. Extract messaging, positioning, features, pricing strategy.
                  Takes 10-20 seconds depending on site size.
                </p>
                <div className="bg-[#1a1a1c] border border-[rgba(250,247,242,0.1)] rounded-lg p-4 text-sm mono-accent">
                  <div className="flex items-center gap-2">
                    <span className="text-[rgba(250,247,242,0.4)]">$</span>
                    <span className="text-[#faf7f2]">crawl https://asana.com</span>
                  </div>
                  <div className="text-[var(--app-accent)] mt-2">&#8594; Analyzing... Extracted positioning</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="mono-accent text-3xl text-[rgba(250,247,242,0.3)] flex-shrink-0 w-12">02</div>
              <div className="flex-1">
                <h3 className="text-2xl mb-3 text-[#faf7f2]">AI generates competitive dimensions</h3>
                <p className="text-[rgba(250,247,242,0.6)] mb-4">
                  Based on industry, Gemini creates 6-8 market-specific axes.
                  Not generic. Tailored to SaaS, e-commerce, or your vertical.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    'Ease of Use',
                    'Feature Depth',
                    'Price Positioning',
                    'Customization',
                    'Onboarding Speed',
                    'Enterprise Ready',
                    'Design Quality',
                    'Performance'
                  ].map((axis, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#1a1a1c] rounded px-3 py-2">
                      <span className="text-[var(--app-accent)]">&#8594;</span>
                      <span className="text-[#faf7f2]">{axis}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="mono-accent text-3xl text-[rgba(250,247,242,0.3)] flex-shrink-0 w-12">03</div>
              <div className="flex-1">
                <h3 className="text-2xl mb-3 text-[#faf7f2]">See positioning gaps</h3>
                <p className="text-[rgba(250,247,242,0.6)] mb-4">
                  Radar chart scores both products (0-100 percentile).
                  Larger area = stronger positioning. Gaps = opportunities.
                </p>
                <div className="bg-[#1a1a1c] border border-[rgba(250,247,242,0.1)] rounded-lg p-6">
                  <div className="flex items-center justify-center gap-8 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[var(--app-accent)]"></div>
                      <span className="text-[#faf7f2]">Your Product</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-[rgba(250,247,242,0.4)]"></div>
                      <span className="text-[#faf7f2]">Competitor</span>
                    </div>
                  </div>
                  <div className="aspect-square max-w-sm mx-auto bg-[#09090B] rounded-lg flex items-center justify-center text-[rgba(250,247,242,0.3)]">
                    [Interactive chart renders here]
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="mono-accent text-3xl text-[rgba(250,247,242,0.3)] flex-shrink-0 w-12">04</div>
              <div className="flex-1">
                <h3 className="text-2xl mb-3 text-[#faf7f2]">Add differentiators, watch updates</h3>
                <p className="text-[rgba(250,247,242,0.6)] mb-4">
                  Tell us how you're different. Chart updates in real-time.
                  Export as PNG/PDF when done.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-[#1a1a1c] rounded-lg p-3 text-sm">
                    <span className="text-[var(--app-accent)]">+</span>
                    <span className="text-[#faf7f2]">10x faster onboarding than Asana</span>
                    <span className="ml-auto text-xs text-[var(--app-accent)]">Chart updated</span>
                  </div>
                  <div className="flex items-center gap-3 bg-[#1a1a1c] rounded-lg p-3 text-sm">
                    <span className="text-[var(--app-accent)]">+</span>
                    <span className="text-[#faf7f2]">Built for solo devs, not enterprises</span>
                    <span className="ml-auto text-xs text-[var(--app-accent)]">Chart updated</span>
                  </div>
                  <div className="w-full border-2 border-dashed border-[rgba(250,247,242,0.12)] rounded-lg p-3 text-sm text-[rgba(250,247,242,0.4)]">
                    + Add another differentiator
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[var(--app-accent)] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl mb-6">
            Legal docs that help you win
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Compliance plus competitive intelligence. All for $29.
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 mb-4">
              <input
                type="url"
                value={bottomUrl}
                onChange={(e) => setBottomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStart(bottomUrl);
                }}
                placeholder="https://your-website.com"
                className="flex-1 px-6 py-4 rounded-lg text-gray-900 text-lg placeholder:text-gray-400"
              />
              <button
                onClick={() => handleStart(bottomUrl)}
                className="px-8 py-4 bg-white text-[var(--app-accent)] rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Start free
              </button>
            </div>
            <p className="text-sm opacity-75">
              Preview free. Upgrade to Premium anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Cross-sell Section */}
      <section className="bg-[#1a1a1c] py-20 px-8 text-center border-t border-[rgba(250,247,242,0.12)]">
        <div className="max-w-[800px] mx-auto">
          <h3 className="text-2xl font-semibold mb-6 text-[#faf7f2]">
            Built with Annexa. Now make it distinctive.
          </h3>
          <p className="text-lg text-[rgba(250,247,242,0.7)] leading-relaxed mb-6">
            Most SaaS products look identical because AI tools use the same templates. Vox Animus structures your brand intent into enforceable prompts for Bolt, Cursor, and Lovable.
          </p>
          <a
            href="https://vox-animus.com/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[var(--app-accent)] hover:brightness-110 hover:underline transition-all duration-150"
          >
            See how it works &#8594;
          </a>
        </div>
      </section>
    </div>
  );
}