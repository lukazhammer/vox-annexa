import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const [jurisdiction, setJurisdiction] = useState(null);

  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const response = await base44.functions.invoke('detectLocation', {});
        if (response.data.jurisdiction) {
          setJurisdiction(response.data.jurisdiction);
        }
      } catch (err) {
        console.error('Failed to detect location:', err);
      }
    };
    detectUserLocation();
  }, []);

  // Home page has its own nav/footer - render without layout wrapper
  if (currentPageName === 'Home') {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Caudex:wght@400;700&family=Poppins:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

          :root {
            --background: #faf7f2;
            --surface: #f5f0ea;
            --card: #ffffff;
            --accent: #A03814;
            --text: #1a1a1a;
            --text-muted: rgba(26, 26, 26, 0.7);
            --border: rgba(26, 26, 26, 0.12);
            --border-strong: rgba(26, 26, 26, 0.2);
            --success: #5a8952;
            --font-headline: 'Caudex', serif;
            --font-body: 'Poppins', sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
          }

          body {
            font-family: 'Poppins', sans-serif;
            background-color: #faf7f2;
            color: #1a1a1a;
          }

          .font-headline {
            font-family: 'Caudex', serif;
          }

          .font-body {
            font-family: 'Poppins', sans-serif;
          }

          .font-mono {
            font-family: 'JetBrains Mono', monospace;
          }
        `}</style>
        {children}
      </>
    );
  }

  // Other pages use the dark mode layout with header/footer
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caudex:wght@400;700&family=Poppins:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --app-accent: #C24516;
        }

        body {
          font-family: 'Poppins', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Caudex', serif;
        }

        .mono-accent {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
      `}</style>
      
      <header className="border-b border-[rgba(250,247,242,0.12)]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col">
            <h1 className="text-[40px] font-bold text-[#faf7f2] tracking-[0.08em] leading-none">
              ANNEXA
              <span className="text-[var(--app-accent)] text-[48px] leading-none align-baseline">.</span>
            </h1>
            <p className="text-lg text-[rgba(250,247,242,0.7)] mt-1">Legal boilerplate for builders</p>
            <p className="mono-accent text-[11px] text-[rgba(250,247,242,0.4)] mt-3">
              Free tool by{' '}
              <a 
                href="https://vox-animus.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[rgba(250,247,242,0.5)] hover:text-[var(--app-accent)] transition-colors duration-150"
              >
                Vox Animus
              </a>
            </p>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>

      <footer className="border-t border-[rgba(250,247,242,0.12)]">
        <div className="max-w-6xl mx-auto px-6 py-[60px] text-center text-[rgba(250,247,242,0.5)] text-[13px]">
          <p className="mb-2">© 2026 <a href="https://vox-animus.com" target="_blank" rel="noopener noreferrer" className="text-[#C24516] hover:brightness-110 transition-all duration-150">Vox Animus OÜ</a>. Annexa is a Vox Animus product.</p>
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/annexaprivacy" className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150">Privacy Policy</a>
            <span>•</span>
            <a href="/annexaterms" className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150">Terms of Use</a>
            <span>•</span>
            <a href="/annexacookies" className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150">Cookie Policy</a>
            <span>•</span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openCookieSettings'))}
              className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150"
            >
              Cookie Settings
            </button>
            {jurisdiction === 'eu' && (
              <>
                <span>•</span>
                <a href="/annexaprivacy#gdpr" className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150">Your GDPR Rights</a>
              </>
            )}
            {jurisdiction === 'california' && (
              <>
                <span>•</span>
                <a href="/annexaprivacy#ccpa" className="text-[rgba(250,247,242,0.5)] hover:text-[#C24516] transition-colors duration-150">Your Privacy Choices</a>
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}