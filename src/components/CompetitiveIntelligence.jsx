import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Lock, Check, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CompetitiveRadarChart } from './competitive/CompetitiveRadarChart';

// Tier utilities - inline to avoid import issues
const getUserTier = () => {
  if (typeof window === 'undefined') return 'free';
  return localStorage.getItem('annexa_tier') || 'free';
};

const upgradeToPremium = (sessionId) => {
  localStorage.setItem('annexa_tier', 'premium');
  if (sessionId) {
    localStorage.setItem('annexa_stripe_session', sessionId);
  }
};

export default function CompetitiveIntelligence({
  formData,
  tier: tierProp, // Keep prop for backward compatibility
  onComplete,
  onSkip,
  onUpgrade,
  crawledWebsiteData, // New: data from URLCapture crawl
  highlightAnalyze = false, // New: highlight the analyze button after returning from checkout
}) {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [competitor, setCompetitor] = useState(null);
  const [differentiation, setDifferentiation] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Use persistent tier from localStorage, fallback to prop
  const tier = getUserTier() || tierProp || 'free';
  const isPremium = tier === 'premium';

  // Restore competitor URL from URL params (after returning from Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedCompetitorUrl = urlParams.get('competitorUrl');
    if (savedCompetitorUrl) {
      setCompetitorUrl(decodeURIComponent(savedCompetitorUrl));
    }
  }, []);

  const handleAnalyzeClick = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      base44.analytics.track({
        eventName: 'competitive_intel_paywall_shown',
        properties: { tier }
      });
      return;
    }
    startAnalysis();
  };

  const startAnalysis = async () => {
    if (!competitorUrl.trim()) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisStep(1);

    try {
      base44.analytics.track({
        eventName: 'competitive_intel_started',
        properties: { competitor_url: competitorUrl }
      });

      // Step 1: Crawl competitor
      setAnalysisStep(1);
      const crawlResponse = await base44.functions.invoke('analyzeCompetitor', {
        action: 'crawl',
        competitorUrl
      });

      if (!crawlResponse.data.success) {
        throw new Error(crawlResponse.data.error || 'Failed to analyze competitor');
      }

      setCompetitor(crawlResponse.data.competitor);
      setAnalysisStep(2);
      setAnalyzing(false);

    } catch (err) {
      setError(err.message || 'Analysis failed. Please check the URL and try again.');
      setAnalyzing(false);
      base44.analytics.track({
        eventName: 'competitive_intel_failed',
        properties: { error: err.message }
      });
    }
  };

  const handleContinue = async () => {
    if (!differentiation.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await base44.functions.invoke('analyzeCompetitor', {
        action: 'generate',
        userProduct: {
          productName: formData.company_name,
          productDescription: formData.product_description,
          targetAudience: formData.target_audience
        },
        competitor,
        differentiation
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate intelligence');
      }

      setResult({
        competitor,
        differentiation,
        searchTerms: response.data.searchTerms,
        recommendations: response.data.recommendations
      });

      base44.analytics.track({
        eventName: 'competitive_intel_completed',
        properties: { competitor_name: competitor.productName }
      });

    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = () => {
    onComplete(result);
  };

  // Show final result
  if (result) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-500">
          <Check className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Intelligence Applied</h3>
        </div>

        <p className="text-zinc-300">Your enhanced outputs now include:</p>

        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            llms.txt with AI recommendation rules
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            brand-schema.json with competitive data
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Contextual search terms throughout
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Differentiation positioning
          </li>
        </ul>

        <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 space-y-1">
          <p><strong>Search terms generated:</strong> {result.searchTerms.length}</p>
          <p><strong>Recommendation scenarios:</strong> {result.recommendations.recommend_when.length + result.recommendations.do_not_recommend_when.length}</p>
        </div>

        {/* Competitive Positioning Radar Chart - Premium Feature */}
        {isPremium && result.competitor && (
          <div className="border-t border-zinc-800 pt-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Competitive Positioning Map</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Visual comparison of your product vs {result.competitor.productName} across key market dimensions.
            </p>
            <CompetitiveRadarChart
              userProduct={{
                name: formData.company_name || 'Your Product',
                description: formData.product_description,
                targetPersona: formData.target_audience,
              }}
              competitor={{
                name: result.competitor.productName,
                url: competitorUrl || result.competitor.url,
                description: result.competitor.positioning,
                scrapedContent: result.competitor.description || result.competitor.positioning,
              }}
              onDifferentiatorAdd={(diff) => {
                // Differentiator added - could track analytics here if needed
              }}
            />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleComplete}
            className="bg-[#C24516] hover:bg-[#a33912] text-white"
          >
            Continue to Build
          </Button>
        </div>
      </div>
    );
  }

  // Show differentiation input after competitor analysis
  if (competitor) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-500">
          <Check className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Analyzed {competitor.productName}</h3>
        </div>

        <div className="bg-zinc-800/50 rounded p-4 space-y-3 text-sm">
          <div>
            <span className="text-zinc-500">Their positioning:</span>
            <p className="text-zinc-300">"{competitor.positioning}"</p>
          </div>
          <div>
            <span className="text-zinc-500">Their audience:</span>
            <p className="text-zinc-300">{competitor.targetAudience}</p>
          </div>
          <div>
            <span className="text-zinc-500">Their focus:</span>
            <p className="text-zinc-300">{competitor.keyFeatures.slice(0, 3).join(', ')}</p>
          </div>
          <div>
            <span className="text-zinc-500">Their keywords:</span>
            <p className="text-zinc-300">"{competitor.seoKeywords.slice(0, 3).join('", "')}"</p>
          </div>
        </div>

        {/* Competitive Positioning Radar Chart - Premium Feature */}
        {isPremium ? (
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Competitive Positioning Map</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Visual comparison of your product vs {competitor.productName} across key market dimensions.
            </p>
            <CompetitiveRadarChart
              userProduct={{
                name: formData.company_name || 'Your Product',
                description: formData.product_description,
                targetPersona: formData.target_audience,
              }}
              competitor={{
                name: competitor.productName,
                url: competitorUrl,
                description: competitor.positioning,
                scrapedContent: competitor.description || competitor.positioning,
              }}
              onDifferentiatorAdd={(diff) => {
                // Pre-fill differentiation with added differentiators
                if (!differentiation.includes(diff)) {
                  setDifferentiation(prev => prev ? `${prev}\n${diff}` : diff);
                }
              }}
            />
          </div>
        ) : (
          <div className="border-t border-zinc-800 pt-6">
            <div className="border-2 border-zinc-700 border-dashed rounded-lg p-6 text-center bg-zinc-900/50">
              <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
              <h4 className="font-serif text-lg mb-1">Competitive Positioning Map</h4>
              <p className="text-zinc-400 text-sm mb-4">
                Access visual comparison across AI-generated market dimensions.
              </p>
              <Button
                onClick={onUpgrade}
                className="bg-[#C24516] hover:bg-[#A03814] text-white"
              >
                Upgrade to Premium ($29)
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <label className="block text-sm text-zinc-300 mb-2">
            How is {formData.company_name} different from {competitor.productName}?
          </label>
          <Textarea
            value={differentiation}
            onChange={(e) => setDifferentiation(e.target.value)}
            placeholder={`Simpler, async-first design. No complex gantt charts. Built specifically for remote teams under 50 people.`}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <Button
          onClick={handleContinue}
          disabled={!differentiation.trim() || generating}
          className="bg-[#C24516] hover:bg-[#a33912] text-white"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating strategy...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    );
  }

  // Show analyzing state
  if (analyzing) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-zinc-300">
          <Search className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Analyzing competitor...</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {analysisStep >= 1 ? (
              <Loader2 className="w-4 h-4 text-[#C24516] animate-spin" />
            ) : (
              <div className="w-4 h-4" />
            )}
            <span className={analysisStep >= 1 ? 'text-zinc-300' : 'text-zinc-600'}>
              Crawling {competitorUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {analysisStep >= 2 ? (
              <Loader2 className="w-4 h-4 text-[#C24516] animate-spin" />
            ) : (
              <div className="w-4 h-4" />
            )}
            <span className={analysisStep >= 2 ? 'text-zinc-300' : 'text-zinc-600'}>
              Extracting positioning & keywords
            </span>
          </div>
          <div className="flex items-center gap-2">
            {analysisStep >= 3 ? (
              <Loader2 className="w-4 h-4 text-[#C24516] animate-spin" />
            ) : (
              <div className="w-4 h-4" />
            )}
            <span className={analysisStep >= 3 ? 'text-zinc-300' : 'text-zinc-600'}>
              Generating differentiation strategy
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-500">This takes ~15 seconds</p>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    );
  }

  // Initial state - show feature teaser
  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-white">Competitive Intelligence</h3>
          {!isPremium && <Lock className="w-4 h-4 text-zinc-500" />}
        </div>

        <p className="text-zinc-400 text-sm">
          {crawledWebsiteData
            ? 'We already analyzed your website. Now add a competitor to compare against.'
            : 'Paste a competitor URL and we\'ll analyze them.'
          }
        </p>
        <ul className="text-sm text-zinc-400 space-y-1 ml-1">
          <li>• Crawl their site in real-time</li>
          <li>• Extract their positioning & keywords</li>
          <li>• Generate differentiation strategy</li>
          <li>• Create smarter SEO/AEO for your product</li>
        </ul>

        <div className="flex gap-2">
          <Input
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            placeholder="https://competitor.com"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <Button
            onClick={handleAnalyzeClick}
            disabled={!competitorUrl.trim()}
            variant="outline"
            className={`border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white bg-transparent whitespace-nowrap ${
              highlightAnalyze && isPremium ? 'ring-2 ring-[#C24516] ring-offset-2 ring-offset-zinc-900 animate-pulse' : ''
            }`}
          >
            Analyze {!isPremium && <Lock className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {!isPremium && (
          <div className="border-t border-zinc-800 pt-4 mt-4">
            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
              <Lock className="w-4 h-4" />
              <span>Premium Feature</span>
            </div>
            <p className="text-zinc-500 text-sm mb-3">
              Access competitive intelligence + all premium outputs for $29 one-time.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  // Check if running in iframe
                  if (window.self !== window.top) {
                    alert('Checkout works only from the published app. Please open this page directly.');
                    return;
                  }
                  
                  setCheckingOut(true);
                  try {
                    const response = await base44.functions.invoke('createCheckoutSession', {
                      returnUrl: window.location.origin,
                      competitorUrl: competitorUrl,
                    });
                    
                    if (response.data.success && response.data.checkoutUrl) {
                      window.location.href = response.data.checkoutUrl;
                    } else {
                      throw new Error(response.data.error || 'Failed to create checkout');
                    }
                  } catch (err) {
                    console.error('Checkout error:', err);
                    setError('Failed to start checkout. Please try again.');
                    setCheckingOut(false);
                  }
                }}
                disabled={checkingOut}
                className="bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Upgrade to Premium'
                )}
              </Button>
              <Button
                onClick={onSkip}
                variant="ghost"
                className="text-zinc-500 hover:text-zinc-400"
              >
                Skip this step
              </Button>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-zinc-500 hover:text-zinc-400"
            >
              Skip this step
            </Button>
          </div>
        )}
      </div>

      {/* Upgrade Modal for Free Users */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#C24516]" />
              Competitive Intelligence
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-zinc-300">
              This feature analyzes your competitor and generates:
            </p>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Real-time competitor positioning
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Differentiation strategy
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Contextual search terms
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                AI recommendation scenarios
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Enhanced llms.txt
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Rich brand-schema.json
              </li>
            </ul>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3 text-sm">
              <p className="text-zinc-400 mb-2">Example output for similar product:</p>
              <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-300 space-y-2 font-mono">
                <p><strong>Analyzed:</strong> Asana</p>
                <p><strong>Their positioning:</strong> "Work management for enterprise teams"</p>
                <p><strong>Suggested differentiation:</strong><br />"Simpler, async-first, built for remote teams under 50"</p>
                <p><strong>Generated search terms:</strong></p>
                <ul className="ml-2">
                  <li>• "asana alternative for small teams"</li>
                  <li>• "simple remote project management"</li>
                </ul>
                <p className="text-zinc-500">[+ 6 more contextual terms]</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={async () => {
                  // Check if running in iframe
                  if (window.self !== window.top) {
                    alert('Checkout works only from the published app. Please open this page directly.');
                    return;
                  }
                  
                  setCheckingOut(true);
                  try {
                    const response = await base44.functions.invoke('createCheckoutSession', {
                      returnUrl: window.location.origin,
                      competitorUrl: competitorUrl,
                    });
                    
                    if (response.data.success && response.data.checkoutUrl) {
                      window.location.href = response.data.checkoutUrl;
                    } else {
                      throw new Error(response.data.error || 'Failed to create checkout');
                    }
                  } catch (err) {
                    console.error('Checkout error:', err);
                    setError('Failed to start checkout. Please try again.');
                    setCheckingOut(false);
                  }
                }}
                disabled={checkingOut}
                className="flex-1 bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading checkout...
                  </>
                ) : (
                  'Upgrade to Premium - $29'
                )}
              </Button>
              <Button
                onClick={() => setShowUpgradeModal(false)}
                variant="ghost"
                className="text-zinc-500 hover:text-zinc-400"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}