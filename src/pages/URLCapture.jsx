import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, Check, Globe, FileText, Mail, Shield, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CRAWL_STEPS = [
  { key: 'fetching', label: 'Fetching your website' },
  { key: 'extracting', label: 'Extracting business information' },
  { key: 'detecting', label: 'Detecting data collection practices' },
  { key: 'analyzing', label: 'Analyzing legal compliance' },
];

function isValidURL(input) {
  try {
    let urlString = input.trim();
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      urlString = 'https://' + urlString;
    }
    const url = new URL(urlString);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
}

export default function URLCapture() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [crawlStatus, setCrawlStatus] = useState('idle');
  const [crawlStep, setCrawlStep] = useState(0);
  const [error, setError] = useState(null);
  const [crawlResults, setCrawlResults] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter your website URL.');
      return;
    }

    if (!isValidURL(trimmedUrl)) {
      setError('Please enter a valid website URL (e.g., yoursite.com).');
      return;
    }

    setError(null);
    setCrawlStatus('crawling');
    setCrawlStep(0);

    try {
      // Progress simulation for UX
      const stepTimer1 = setTimeout(() => setCrawlStep(1), 1200);
      const stepTimer2 = setTimeout(() => setCrawlStep(2), 2800);
      const stepTimer3 = setTimeout(() => setCrawlStep(3), 4200);

      const response = await base44.functions.invoke('scanWebsite', { url: trimmedUrl });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      const data = response.data || response;

      // Store crawled data for Form.jsx to use
      localStorage.setItem('crawledWebsiteData', JSON.stringify(data));
      localStorage.setItem('userWebsiteURL', trimmedUrl);

      setCrawlResults(data);
      setCrawlStatus('complete');

      // Brief pause to show completion state, then navigate
      setTimeout(() => {
        navigate('/Form', {
          state: {
            scanResults: data,
            websiteUrl: trimmedUrl,
            crawledData: data,
          },
        });
      }, 800);
    } catch (err) {
      setCrawlStatus('error');
      setError('Could not reach that website. Check the URL and try again.');
    }
  };

  const handleSkipToManual = () => {
    localStorage.removeItem('crawledWebsiteData');
    localStorage.removeItem('userWebsiteURL');
    navigate('/Form', { state: { manualEntry: true } });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="py-20">
      <div className="max-w-[640px] mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-[40px] md:text-[36px] sm:text-[28px] font-bold mb-4 text-[#faf7f2] leading-tight">
            Start with your website
          </h2>
          <p className="text-lg text-[rgba(250,247,242,0.7)] leading-relaxed">
            We analyze your site to pre-fill your legal documents. The more we detect, the less you type.
          </p>
        </div>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(250,247,242,0.4)]" />
              <Input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="yourwebsite.com"
                className="bg-[#242426] border-[rgba(250,247,242,0.12)] text-[#faf7f2] h-14 text-lg pl-11 focus:ring-2 focus:ring-[#C24516] focus:border-[#C24516] transition-all"
                disabled={crawlStatus === 'crawling'}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={!url.trim() || crawlStatus === 'crawling'}
            className="w-full bg-[#C24516] hover:bg-[#a33912] hover:scale-[1.02] active:scale-[0.98] text-white h-14 text-lg transition-all duration-150"
          >
            {crawlStatus === 'crawling' ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </span>
            ) : crawlStatus === 'complete' ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Done. Redirecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Analyze My Website <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </form>

        {/* Crawl Progress */}
        {crawlStatus === 'crawling' && (
          <div className="bg-[#242426] border border-[rgba(250,247,242,0.12)] rounded-lg p-6 mb-8 space-y-3">
            {CRAWL_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                {i < crawlStep ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : i === crawlStep ? (
                  <Loader2 className="w-4 h-4 text-[#C24516] animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-[rgba(250,247,242,0.2)] flex-shrink-0" />
                )}
                <span className={`text-sm ${i <= crawlStep ? 'text-[#faf7f2]' : 'text-[rgba(250,247,242,0.4)]'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Crawl Complete Summary */}
        {crawlStatus === 'complete' && crawlResults && (
          <div className="bg-[#242426] border border-green-800/30 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 text-green-500 mb-4">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Analysis complete</span>
            </div>
            <div className="space-y-2 text-sm">
              {crawlResults.prefilled?.company_name && (
                <div className="flex items-center gap-2 text-[rgba(250,247,242,0.7)]">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Detected: {crawlResults.prefilled.company_name}</span>
                </div>
              )}
              {crawlResults.prefilled?.contact_email && (
                <div className="flex items-center gap-2 text-[rgba(250,247,242,0.7)]">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Found contact email</span>
                </div>
              )}
              {crawlResults.found?.length > 0 && (
                <div className="flex items-center gap-2 text-[rgba(250,247,242,0.7)]">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Found {crawlResults.found.length} existing file{crawlResults.found.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {crawlResults.prefilled?.thirdPartyServices?.length > 0 && (
                <div className="flex items-center gap-2 text-[rgba(250,247,242,0.7)]">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Detected {crawlResults.prefilled.thirdPartyServices.length} third-party service{crawlResults.prefilled.thirdPartyServices.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        {crawlStatus === 'idle' && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(250,247,242,0.12)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#09090B] text-[rgba(250,247,242,0.5)]">or</span>
              </div>
            </div>

            <Button
              onClick={handleSkipToManual}
              variant="outline"
              className="w-full border-[rgba(250,247,242,0.12)] text-[rgba(250,247,242,0.7)] hover:bg-[rgba(250,247,242,0.05)] hover:text-[#faf7f2] h-12 text-base transition-all duration-150"
            >
              Start from scratch instead
            </Button>

            {/* What We Analyze */}
            <div className="bg-[#242426] rounded-lg p-6 mt-10">
              <h3 className="text-base font-semibold text-[#faf7f2] mb-5">What we analyze</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-[#C24516] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#faf7f2]">Business name</p>
                    <p className="text-xs text-[rgba(250,247,242,0.5)]">From title and meta tags</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C24516] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#faf7f2]">Contact info</p>
                    <p className="text-xs text-[rgba(250,247,242,0.5)]">Email addresses found</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#C24516] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#faf7f2]">Legal pages</p>
                    <p className="text-xs text-[rgba(250,247,242,0.5)]">Privacy, terms, cookies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-[#C24516] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#faf7f2]">Third-party scripts</p>
                    <p className="text-xs text-[rgba(250,247,242,0.5)]">Analytics, tracking, payments</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-[rgba(250,247,242,0.4)] mt-5">
                Everything we detect gets pre-filled. You can edit or override any field.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
