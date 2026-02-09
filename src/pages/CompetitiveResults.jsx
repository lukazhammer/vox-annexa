import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PostPaymentRadarChart } from '@/components/competitive/PostPaymentRadarChart';
import { CheckCircle, Download, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

// Set premium tier in localStorage on successful payment
function markAsPremium(sessionId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('annexa_tier', 'premium');
  if (sessionId) {
    localStorage.setItem('annexa_stripe_session', sessionId);
  }
}

export default function CompetitiveResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [radarData, setRadarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryTimerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Mark user as premium immediately on arrival
    markAsPremium(sessionId);

    loadRadarData();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [sessionId]);

  const loadRadarData = async (attempt = 0) => {
    console.log('Loading radar data for session:', sessionId, '| attempt:', attempt + 1);

    try {
      const result = await base44.functions.invoke('getRadarData', {
        sessionId,
      });

      if (result.data.success) {
        console.log('Radar data loaded');
        setRadarData(result.data.data);
        setIsLoading(false);
        return;
      }

      // Data not found yet - webhook may still be processing
      if (result.data.error && attempt < maxRetries) {
        console.log('Data not ready, retrying in', (attempt + 1) * 2, 'seconds...');
        setRetryCount(attempt + 1);
        retryTimerRef.current = setTimeout(() => {
          loadRadarData(attempt + 1);
        }, (attempt + 1) * 2000);
        return;
      }

      throw new Error(result.data.error || 'Failed to load competitive analysis');
    } catch (err) {
      console.error('Failed to load radar data:', err);

      // Retry on network errors
      if (attempt < maxRetries) {
        console.log('Error loading, retrying in', (attempt + 1) * 2, 'seconds...');
        setRetryCount(attempt + 1);
        retryTimerRef.current = setTimeout(() => {
          loadRadarData(attempt + 1);
        }, (attempt + 1) * 2000);
        return;
      }

      setError(err.message || 'Unable to load competitive analysis');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#C24516] mx-auto mb-4" />
          <p className="text-lg text-zinc-300 font-sans">Loading your competitive analysis...</p>
          {retryCount > 0 && (
            <p className="text-sm text-zinc-500 mt-2">
              Still generating... (attempt {retryCount + 1}/{maxRetries + 1})
            </p>
          )}
          <p className="text-sm text-zinc-600 mt-2">This should only take a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="max-w-md text-center p-8 border border-zinc-700 rounded-lg bg-zinc-900 mx-4">
          <AlertCircle className="w-10 h-10 text-[#C24516] mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-4 text-zinc-100">Analysis Unavailable</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <p className="text-sm text-zinc-500 mb-6">
            Your payment was successful and you now have Premium access.
            However, we encountered an issue loading your competitive analysis.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setRetryCount(0);
                loadRadarData(0);
              }}
              className="bg-zinc-800 text-zinc-200 px-6 py-3 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/Form')}
              className="bg-[#C24516] text-white px-6 py-3 rounded-lg hover:bg-[#A03814] transition-colors"
            >
              Continue to Documents
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-6">
            Contact support if this issue persists: support@annexa.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Success Banner */}
      <div className="bg-green-600/90 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3">
          <CheckCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg font-medium font-sans">
            Payment successful! You're now a Premium member.
          </p>
        </div>
      </div>

      {/* VIP Hero Section */}
      <div className="bg-gradient-to-b from-[#C24516]/10 to-transparent py-16 border-b-2 border-[#C24516]/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-2 bg-[#C24516] text-white rounded-full text-sm font-medium mb-6">
            &#10003; Premium Access
          </div>
          <h1 className="font-serif text-4xl md:text-5xl mb-4 text-[#faf7f2]">
            Welcome to competitive intelligence
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-sans">
            Your radar chart is ready. See exactly where you stand vs{' '}
            <span className="font-medium text-[#faf7f2]">{radarData.competitorName}</span>.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 mb-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border-2 border-[#C24516]/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-[#C24516] mb-2">
              {radarData.axes.length}
            </div>
            <div className="text-sm text-zinc-400">Market Dimensions</div>
          </div>
          <div className="bg-zinc-900 border-2 border-[#C24516]/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-[#C24516] mb-2">
              {radarData.strengths.length}
            </div>
            <div className="text-sm text-zinc-400">Your Strengths</div>
          </div>
          <div className="bg-zinc-900 border-2 border-[#C24516]/20 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-[#C24516] mb-2">
              {radarData.opportunities.length}
            </div>
            <div className="text-sm text-zinc-400">Growth Opportunities</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Radar Chart */}
        <div className="mb-16 p-8 border-2 border-[#C24516]/30 rounded-lg bg-[#C24516]/5">
          <PostPaymentRadarChart
            axes={radarData.axes}
            userScores={radarData.userScores}
            competitorScores={radarData.competitorScores}
            competitorName={radarData.competitorName}
            userName={radarData.userName}
          />
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Strengths */}
          <div className="p-6 border border-green-900/50 rounded-lg bg-green-950/30">
            <h3 className="font-serif text-2xl mb-4 flex items-center gap-2 text-[#faf7f2]">
              <span className="text-green-500">&#10003;</span>
              Your Strengths
            </h3>
            <ul className="space-y-3">
              {radarData.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-1 flex-shrink-0">&rarr;</span>
                  <span className="text-zinc-300 font-sans">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="p-6 border border-amber-900/50 rounded-lg bg-amber-950/30">
            <h3 className="font-serif text-2xl mb-4 flex items-center gap-2 text-[#faf7f2]">
              <span className="text-amber-500">&rarr;</span>
              Growth Opportunities
            </h3>
            <ul className="space-y-3">
              {radarData.opportunities.map((opp, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-amber-500 mt-1 flex-shrink-0">&rarr;</span>
                  <span className="text-zinc-300 font-sans">{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-center mb-8">
          <p className="text-sm text-zinc-600 font-sans">
            Analysis generated {new Date(radarData.generatedAt).toLocaleString()}
            {radarData.industry && ` | Industry: ${radarData.industry}`}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/Form')}
            className="flex items-center justify-center gap-2 bg-[#C24516] text-white px-8 py-4 rounded-lg text-lg hover:bg-[#A03814] transition-colors font-sans"
          >
            Continue to Documents
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              // Export radar data as JSON
              const blob = new Blob(
                [JSON.stringify(radarData, null, 2)],
                { type: 'application/json' }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `competitive-analysis-${radarData.userName.replace(/\s+/g, '-').toLowerCase()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-2 border-2 border-[#C24516] text-[#C24516] px-8 py-4 rounded-lg text-lg hover:bg-[#C24516]/10 transition-colors font-sans"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
