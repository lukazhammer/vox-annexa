import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Lock, Check, Loader2, Sparkles, Plus, X, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CompetitiveRadarChart } from './competitive/CompetitiveRadarChart';
import { MultiCompetitorRadar } from './competitive/MultiCompetitorRadar';

// Tier utilities - inline to avoid import issues
const getUserTier = () => {
  if (typeof window === 'undefined') return 'free';
  return localStorage.getItem('annexa_tier') || 'free';
};

export default function CompetitiveIntelligence({
  formData,
  tier: tierProp,
  onComplete,
  onSkip,
  onUpgrade: _onUpgrade,
  crawledWebsiteData,
  highlightAnalyze = false,
}) {
  // Multi-competitor state (up to 3 slots)
  const [competitors, setCompetitors] = useState([
    { id: 1, url: '', data: null, isAnalyzing: false, error: null }
  ]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [differentiation, setDifferentiation] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);

  // Multi-competitor radar state
  const [radarData, setRadarData] = useState(null);
  const [isGeneratingRadar, setIsGeneratingRadar] = useState(false);
  const [differentiatorSuggestions, setDifferentiatorSuggestions] = useState([]);

  // Use persistent tier from localStorage, fallback to prop
  const tier = getUserTier() || tierProp || 'free';
  const isPremium = tier === 'edge' || tier === 'premium';

  const canAddMore = competitors.length < 3;
  const hasAnalyzedCompetitors = competitors.some(c => c.data);
  const analyzedCount = competitors.filter(c => c.data).length;

  // Restore competitor URL from URL params (after returning from Stripe)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const savedCompetitorUrl = urlParams.get('competitorUrl');
    if (savedCompetitorUrl) {
      setCompetitors([
        { id: 1, url: decodeURIComponent(savedCompetitorUrl), data: null, isAnalyzing: false, error: null }
      ]);
    }
  }, []);

  const addCompetitorSlot = () => {
    if (canAddMore) {
      setCompetitors([
        ...competitors,
        {
          id: competitors.length + 1,
          url: '',
          data: null,
          isAnalyzing: false,
          error: null,
        }
      ]);
    }
  };

  const removeCompetitor = (id) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter(c => c.id !== id));
    }
  };

  const updateCompetitorUrl = (id, url) => {
    setCompetitors(competitors.map(c =>
      c.id === id ? { ...c, url } : c
    ));
  };

  const handleAnalyzeClick = (competitorId) => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      base44.analytics.track({
        eventName: 'competitive_intel_paywall_shown',
        properties: { tier }
      });
      return;
    }
    analyzeCompetitor(competitorId);
  };

  const analyzeCompetitor = async (competitorId) => {
    const competitor = competitors.find(c => c.id === competitorId);
    if (!competitor || !competitor.url.trim()) return;

    // Set analyzing state
    setCompetitors(prev => prev.map(c =>
      c.id === competitorId
        ? { ...c, isAnalyzing: true, error: null }
        : c
    ));
    setError(null);

    try {
      base44.analytics.track({
        eventName: 'competitive_intel_started',
        properties: { competitor_url: competitor.url, competitor_number: competitorId }
      });

      const crawlResponse = await base44.functions.invoke('analyzeCompetitor', {
        action: 'crawl',
        competitorUrl: competitor.url
      });

      if (!crawlResponse.data.success) {
        throw new Error(crawlResponse.data.error || 'Failed to analyze competitor');
      }

      // Update with analysis results
      setCompetitors(prev => prev.map(c =>
        c.id === competitorId
          ? { ...c, data: crawlResponse.data.competitor, isAnalyzing: false }
          : c
      ));

      // Auto-generate differentiator suggestions when we have at least one analyzed
      const allAnalyzed = [
        ...competitors.filter(c => c.id !== competitorId && c.data),
        { data: crawlResponse.data.competitor }
      ];
      if (allAnalyzed.length > 0) {
        generateDifferentiatorSuggestions(allAnalyzed.map(c => c.data));
      }

      base44.analytics.track({
        eventName: 'competitive_intel_competitor_analyzed',
        properties: {
          competitor_name: crawlResponse.data.competitor.productName,
          total_analyzed: allAnalyzed.length,
        }
      });

    } catch (err) {
      setCompetitors(prev => prev.map(c =>
        c.id === competitorId
          ? { ...c, error: err.message || 'Analysis failed', isAnalyzing: false }
          : c
      ));
      base44.analytics.track({
        eventName: 'competitive_intel_failed',
        properties: { error: err.message }
      });
    }
  };

  const generateMultiCompetitorRadar = async () => {
    setIsGeneratingRadar(true);

    try {
      const analyzedCompetitors = competitors.filter(c => c.data);

      const response = await base44.functions.invoke('generateMultiCompetitorRadar', {
        userBusiness: {
          name: formData.company_name || 'Your Product',
          description: formData.product_description || '',
          industry: formData.industry || 'SaaS',
        },
        competitors: analyzedCompetitors.map(c => ({
          name: c.data.productName || c.data.name,
          url: c.url,
          positioning: c.data.positioning,
          audience: c.data.targetAudience || c.data.audience,
          focus: (c.data.keyFeatures || []).slice(0, 3).join(', '),
          keywords: (c.data.seoKeywords || []).slice(0, 5).join(', '),
        })),
        userDifferentiators: differentiation ? differentiation.split('\n').filter(Boolean) : [],
      });

      if (response.data.success) {
        setRadarData(response.data.data);
      }

      base44.analytics.track({
        eventName: 'competitive_radar_generated',
        properties: { competitor_count: analyzedCompetitors.length }
      });

    } catch (err) {
      console.error('Failed to generate radar:', err);
      setError('Failed to generate competitive map. Please try again.');
    } finally {
      setIsGeneratingRadar(false);
    }
  };

  const generateDifferentiatorSuggestions = async (competitorDataArray) => {
    try {
      const response = await base44.functions.invoke('generateDifferentiatorSuggestions', {
        userBusiness: {
          name: formData.company_name,
          description: formData.product_description,
          industry: formData.industry || 'SaaS',
        },
        competitors: competitorDataArray.map(c => ({
          name: c.productName || c.name,
          positioning: c.positioning,
          audience: c.targetAudience || c.audience,
          focus: (c.keyFeatures || []).slice(0, 3).join(', '),
        })),
        existingDifferentiators: differentiation ? differentiation.split('\n').filter(Boolean) : [],
      });

      if (response.data.success) {
        setDifferentiatorSuggestions(response.data.suggestions);
      }
    } catch (err) {
      console.error('Failed to generate suggestions:', err);
    }
  };

  const handleAddSuggestion = (suggestion) => {
    setDifferentiation(prev => prev ? `${prev}\n${suggestion}` : suggestion);
    // Remove the used suggestion
    setDifferentiatorSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const handleContinue = async () => {
    if (!differentiation.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      // Use the first analyzed competitor for the generate step
      const firstAnalyzed = competitors.find(c => c.data);
      if (!firstAnalyzed) return;

      const response = await base44.functions.invoke('analyzeCompetitor', {
        action: 'generate',
        userProduct: {
          productName: formData.company_name,
          productDescription: formData.product_description,
          targetAudience: formData.target_audience
        },
        competitor: firstAnalyzed.data,
        differentiation
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to generate intelligence');
      }

      setResult({
        competitors: competitors.filter(c => c.data).map(c => c.data),
        differentiation,
        searchTerms: response.data.searchTerms,
        recommendations: response.data.recommendations,
        radarData,
      });

      base44.analytics.track({
        eventName: 'competitive_intel_completed',
        properties: {
          competitor_count: analyzedCount,
          competitor_names: competitors.filter(c => c.data).map(c => c.data.productName).join(', '),
        }
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

  const handleCheckout = async () => {
    // Check if running in iframe
    if (window.self !== window.top) {
      alert('Checkout works only from the published app. Please open this page directly.');
      return;
    }

    // Store form data in localStorage for PremiumDashboard
    try {
      if (formData) {
        localStorage.setItem('annexa_premium_form_data', JSON.stringify(formData));
      }
    } catch (e) {
      console.warn('Failed to cache form data:', e);
    }

    setCheckingOut(true);
    try {
      const competitorUrl = competitors[0]?.url || '';
      const response = await base44.functions.invoke('createCheckoutSession', {
        returnUrl: window.location.origin,
        competitorUrl,
        userWebsiteURL: crawledWebsiteData?.url || formData.company_website || '',
        businessName: formData.company_name || '',
        productDescription: formData.product_description || '',
        industry: formData.industry || '',
        email: formData.email || '',
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
  };

  // ─── RENDER: Final result ─────────────────────────────────────────────
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
            Differentiation positioning ({analyzedCount} competitor{analyzedCount > 1 ? 's' : ''} analyzed)
          </li>
        </ul>

        <div className="bg-zinc-800/50 rounded p-3 text-xs text-zinc-400 space-y-1">
          <p><strong>Search terms generated:</strong> {result.searchTerms?.length || 0}</p>
          <p><strong>Recommendation scenarios:</strong> {(result.recommendations?.recommend_when?.length || 0) + (result.recommendations?.do_not_recommend_when?.length || 0)}</p>
          <p><strong>Competitors analyzed:</strong> {result.competitors?.length || 0}</p>
        </div>

        {/* Multi-Competitor Radar Chart - if data available */}
        {isPremium && radarData && (
          <div className="border-t border-zinc-800 pt-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Competitive Positioning Map</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Visual comparison across {radarData.axes?.length || 6} market dimensions.
            </p>
            <div className="bg-zinc-950 rounded-lg p-6 border border-zinc-800">
              <MultiCompetitorRadar
                axes={radarData.axes}
                userScores={radarData.userScores}
                competitorScores={radarData.competitorScores}
                competitorNames={radarData.competitorNames}
                userName={formData.company_name || 'Your Product'}
              />
            </div>

            {/* Insights */}
            {radarData.insights && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {radarData.insights.strengths?.length > 0 && (
                  <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Strengths</p>
                    <ul className="space-y-1">
                      {radarData.insights.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-green-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {radarData.insights.opportunities?.length > 0 && (
                  <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Opportunities</p>
                    <ul className="space-y-1">
                      {radarData.insights.opportunities.map((s, i) => (
                        <li key={i} className="text-xs text-amber-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {radarData.insights.threats?.length > 0 && (
                  <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Threats</p>
                    <ul className="space-y-1">
                      {radarData.insights.threats.map((s, i) => (
                        <li key={i} className="text-xs text-red-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fallback: single competitor radar for backward compat */}
        {isPremium && !radarData && result.competitors?.[0] && (
          <div className="border-t border-zinc-800 pt-6 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Competitive Positioning Map</h4>
            </div>
            <CompetitiveRadarChart
              userProduct={{
                name: formData.company_name || 'Your Product',
                description: formData.product_description,
                targetPersona: formData.target_audience,
              }}
              competitor={{
                name: result.competitors[0].productName,
                url: competitors[0]?.url,
                description: result.competitors[0].positioning,
                scrapedContent: result.competitors[0].description || result.competitors[0].positioning,
              }}
              onDifferentiatorAdd={() => {}}
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

  // ─── RENDER: Differentiation + analysis results ───────────────────────
  if (hasAnalyzedCompetitors) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-5">
        {/* Analyzed competitors summary */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#C24516]" />
            <h3 className="text-lg font-semibold text-white">Competitive Intelligence</h3>
            <span className="text-xs bg-[#C24516]/20 text-[#C24516] px-2 py-0.5 rounded-full ml-auto">
              {analyzedCount} analyzed
            </span>
          </div>

          {/* Competitor slots */}
          <div className="space-y-3">
            {competitors.map((competitor, index) => (
              <div
                key={competitor.id}
                className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-zinc-500">
                    Competitor {index + 1}
                  </span>
                  {competitor.data && (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  )}
                  {competitors.length > 1 && !competitor.isAnalyzing && (
                    <button
                      onClick={() => removeCompetitor(competitor.id)}
                      className="ml-auto p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* URL input + analyze button */}
                {!competitor.data && (
                  <div className="flex gap-2">
                    <Input
                      value={competitor.url}
                      onChange={(e) => updateCompetitorUrl(competitor.id, e.target.value)}
                      placeholder="https://competitor.com"
                      className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                    <Button
                      onClick={() => handleAnalyzeClick(competitor.id)}
                      disabled={competitor.isAnalyzing || !competitor.url.trim()}
                      className="bg-[#C24516] hover:bg-[#a33912] text-white whitespace-nowrap"
                    >
                      {competitor.isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze'
                      )}
                    </Button>
                  </div>
                )}

                {/* Analysis results */}
                {competitor.data && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-green-400">
                        {competitor.data.productName}
                      </span>
                    </div>
                    <div className="text-zinc-400 space-y-1">
                      <p><span className="text-zinc-500">Positioning:</span> {competitor.data.positioning}</p>
                      <p><span className="text-zinc-500">Target:</span> {competitor.data.targetAudience}</p>
                      <p><span className="text-zinc-500">Focus:</span> {(competitor.data.keyFeatures || []).slice(0, 3).join(', ')}</p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {competitor.error && (
                  <p className="text-red-400 text-sm mt-2">{competitor.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Add more competitor button */}
          {canAddMore && isPremium && (
            <button
              onClick={addCompetitorSlot}
              className="w-full mt-3 py-2.5 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-[#C24516] hover:text-[#C24516] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add another competitor ({competitors.length}/3)
            </button>
          )}
        </div>

        {/* Generate Multi-Competitor Radar Button */}
        {isPremium && analyzedCount > 0 && (
          <div>
            <Button
              onClick={generateMultiCompetitorRadar}
              disabled={isGeneratingRadar}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            >
              {isGeneratingRadar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating positioning map...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Competitive Map ({analyzedCount} competitor{analyzedCount > 1 ? 's' : ''})
                </>
              )}
            </Button>
          </div>
        )}

        {/* Multi-Competitor Radar Chart */}
        {isPremium && radarData && (
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Your Competitive Position</h4>
            </div>
            <div className="bg-zinc-950 rounded-lg p-6 border border-zinc-800">
              <MultiCompetitorRadar
                axes={radarData.axes}
                userScores={radarData.userScores}
                competitorScores={radarData.competitorScores}
                competitorNames={radarData.competitorNames}
                userName={formData.company_name || 'Your Product'}
              />
            </div>

            {/* Insights */}
            {radarData.insights && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {radarData.insights.strengths?.length > 0 && (
                  <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wide">Strengths</p>
                    <ul className="space-y-1">
                      {radarData.insights.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-green-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {radarData.insights.opportunities?.length > 0 && (
                  <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Opportunities</p>
                    <ul className="space-y-1">
                      {radarData.insights.opportunities.map((s, i) => (
                        <li key={i} className="text-xs text-amber-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {radarData.insights.threats?.length > 0 && (
                  <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Threats</p>
                    <ul className="space-y-1">
                      {radarData.insights.threats.map((s, i) => (
                        <li key={i} className="text-xs text-red-100/80">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Single-competitor radar fallback for premium users with 1 competitor */}
        {isPremium && !radarData && analyzedCount === 1 && (
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C24516]" />
              <h4 className="font-serif text-lg">Competitive Positioning Map</h4>
            </div>
            <CompetitiveRadarChart
              userProduct={{
                name: formData.company_name || 'Your Product',
                description: formData.product_description,
                targetPersona: formData.target_audience,
              }}
              competitor={{
                name: competitors.find(c => c.data)?.data?.productName,
                url: competitors.find(c => c.data)?.url,
                description: competitors.find(c => c.data)?.data?.positioning,
                scrapedContent: competitors.find(c => c.data)?.data?.description || competitors.find(c => c.data)?.data?.positioning,
              }}
              onDifferentiatorAdd={(diff) => {
                if (!differentiation.includes(diff)) {
                  setDifferentiation(prev => prev ? `${prev}\n${diff}` : diff);
                }
              }}
            />
          </div>
        )}

        {/* Radar locked for free users */}
        {!isPremium && (
          <div className="border-t border-zinc-800 pt-4">
            <div className="border-2 border-zinc-700 border-dashed rounded-lg p-6 text-center bg-zinc-900/50">
              <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
              <h4 className="font-serif text-lg mb-1">Competitive Positioning Map</h4>
              <p className="text-zinc-400 text-sm mb-4">
                Access visual comparison across AI-generated market dimensions.
              </p>
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="bg-[#C24516] hover:bg-[#A03814] text-white"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Upgrade to Premium ($29)'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* AI-Powered Differentiator Suggestions */}
        {differentiatorSuggestions.length > 0 && (
          <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-400 mb-2">
              Suggested Differentiators
            </h4>
            <p className="text-xs text-amber-100/60 mb-3">
              Based on competitor analysis, here are ways you could stand out:
            </p>
            <div className="space-y-1.5">
              {differentiatorSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleAddSuggestion(suggestion)}
                  className="w-full text-left p-2.5 bg-amber-900/20 border border-amber-800/40 rounded-lg hover:bg-amber-900/30 hover:border-amber-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-amber-100">{suggestion}</span>
                    <Plus className="w-4 h-4 text-amber-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Differentiation input */}
        <div className="border-t border-zinc-800 pt-4">
          <label className="block text-sm text-zinc-300 mb-2">
            How is {formData.company_name || 'your product'} different?
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

  // ─── RENDER: Analyzing state ──────────────────────────────────────────
  const isAnyAnalyzing = competitors.some(c => c.isAnalyzing);
  if (isAnyAnalyzing) {
    const analyzingComp = competitors.find(c => c.isAnalyzing);
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-zinc-300">
          <Search className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Analyzing competitor...</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#C24516] animate-spin" />
            <span className="text-zinc-300">
              Crawling {analyzingComp?.url}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" />
            <span className="text-zinc-600">
              Extracting positioning & keywords
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" />
            <span className="text-zinc-600">
              Generating differentiation strategy
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-500">This takes ~15 seconds</p>
      </div>
    );
  }

  // ─── RENDER: Initial state - multi-competitor input ───────────────────
  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#C24516]" />
          <h3 className="text-lg font-semibold text-white">Competitive Intelligence</h3>
          {!isPremium && <Lock className="w-4 h-4 text-zinc-500" />}
        </div>

        <p className="text-zinc-400 text-sm">
          {crawledWebsiteData
            ? 'We already analyzed your website. Now add competitors to compare against.'
            : 'Add up to 3 competitor URLs and we\'ll analyze them.'}
        </p>
        <ul className="text-sm text-zinc-400 space-y-1 ml-1">
          <li>* Crawl competitor sites in real-time</li>
          <li>* Extract positioning, keywords & target audience</li>
          <li>* Generate multi-competitor radar chart</li>
          <li>* AI-powered differentiator suggestions</li>
        </ul>

        {/* Competitor URL slots */}
        <div className="space-y-3">
          {competitors.map((competitor, index) => (
            <div key={competitor.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <div className="flex gap-2">
                  <Input
                    value={competitor.url}
                    onChange={(e) => updateCompetitorUrl(competitor.id, e.target.value)}
                    placeholder={index === 0 ? 'https://competitor.com' : `https://competitor-${index + 1}.com`}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Button
                    onClick={() => handleAnalyzeClick(competitor.id)}
                    disabled={!competitor.url.trim() || competitor.isAnalyzing}
                    variant="outline"
                    className={`border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white bg-transparent whitespace-nowrap ${
                      highlightAnalyze && isPremium && index === 0 ? 'ring-2 ring-[#C24516] ring-offset-2 ring-offset-zinc-900 animate-pulse' : ''
                    }`}
                  >
                    {competitor.isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Analyze {!isPremium && <Lock className="w-3 h-3 ml-1" />}</>
                    )}
                  </Button>
                </div>
                {competitor.error && (
                  <p className="text-red-400 text-xs mt-1">{competitor.error}</p>
                )}
              </div>
              {competitors.length > 1 && (
                <button
                  onClick={() => removeCompetitor(competitor.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add more competitor */}
        {canAddMore && (
          <button
            onClick={addCompetitorSlot}
            className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-[#C24516] hover:text-[#C24516] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add competitor ({competitors.length}/3)
          </button>
        )}

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
                onClick={handleCheckout}
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
              This feature analyzes your competitors and generates:
            </p>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Multi-competitor analysis (up to 3)
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                Competitive positioning radar chart
              </li>
              <li className="flex items-center gap-2 text-zinc-300">
                <Check className="w-4 h-4 text-green-500" />
                AI-powered differentiator suggestions
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
                Enhanced llms.txt & brand-schema.json
              </li>
            </ul>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3 text-sm">
              <p className="text-zinc-400 mb-2">Example output for similar product:</p>
              <div className="bg-zinc-900 rounded p-3 text-xs text-zinc-300 space-y-2 font-mono">
                <p><strong>Analyzed:</strong> Asana, Monday.com, ClickUp</p>
                <p><strong>Their positioning:</strong> "Work management for enterprise teams"</p>
                <p><strong>Suggested differentiation:</strong><br />"Simpler, async-first, built for remote teams under 50"</p>
                <p><strong>Generated search terms:</strong></p>
                <ul className="ml-2">
                  <li>* "asana alternative for small teams"</li>
                  <li>* "simple remote project management"</li>
                </ul>
                <p className="text-zinc-500">[+ 6 more contextual terms]</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowUpgradeModal(false);
                  handleCheckout();
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
