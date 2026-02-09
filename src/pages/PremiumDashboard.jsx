import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PostPaymentRadarChart } from '@/components/competitive/PostPaymentRadarChart';
import {
  Download,
  Copy,
  CheckCircle,
  Zap,
  TrendingUp,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';

// Set premium tier in localStorage on successful payment
function markAsPremium(sessionId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('annexa_tier', 'premium');
  if (sessionId) {
    localStorage.setItem('annexa_stripe_session', sessionId);
  }
}

// Load cached form data from localStorage
function getStoredFormData() {
  try {
    const raw = localStorage.getItem('annexa_premium_form_data');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Load cached generated documents from localStorage
function getStoredDocuments() {
  try {
    const raw = localStorage.getItem('annexa_premium_documents');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function PremiumDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [radarData, setRadarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const retryTimerRef = useRef(null);
  const maxRetries = 5;

  // Merge radar data with stored form data for complete user picture
  const storedFormData = getStoredFormData();
  const storedDocuments = getStoredDocuments();

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    markAsPremium(sessionId);
    loadDashboardData();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [sessionId]);

  const loadDashboardData = async (attempt = 0) => {
    try {
      const result = await base44.functions.invoke('getPremiumDashboard', {
        sessionId,
        email: storedFormData?.contact_email || '',
      });

      if (result.data.success) {
        setRadarData(result.data.data.radarData);
        setIsLoading(false);
        return;
      }

      // Data not ready yet - webhook may still be processing
      if (result.data.error && attempt < maxRetries) {
        setRetryCount(attempt + 1);
        retryTimerRef.current = setTimeout(() => {
          loadDashboardData(attempt + 1);
        }, (attempt + 1) * 2000);
        return;
      }

      throw new Error(result.data.error || 'Failed to load dashboard');
    } catch (err) {
      console.error('Failed to load dashboard data:', err);

      if (attempt < maxRetries) {
        setRetryCount(attempt + 1);
        retryTimerRef.current = setTimeout(() => {
          loadDashboardData(attempt + 1);
        }, (attempt + 1) * 2000);
        return;
      }

      setError(err.message || 'Unable to load dashboard');
      setIsLoading(false);
    }
  };

  const companyName =
    radarData?.userName ||
    storedFormData?.company_name ||
    'Your Business';

  const copyImplementationPrompt = () => {
    const prompt = generateImplementationPrompt(
      companyName,
      radarData,
      storedFormData,
      storedDocuments
    );
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadRadarJSON = () => {
    if (!radarData) return;
    const blob = new Blob(
      [JSON.stringify(radarData, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitive-analysis-${companyName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllDocuments = async () => {
    if (!storedDocuments?.documents) {
      // No cached documents - redirect to form to generate them
      navigate('/Form?payment=success&tier=premium');
      return;
    }

    try {
      const response = await base44.functions.invoke('generateMarkdownZip', {
        documents: storedDocuments.documents,
        productName: companyName,
        socialBios: storedDocuments.socialBios || null,
      });

      // Response is a zip blob
      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `launch-kit-premium-${companyName.replace(/\s+/g, '-').toLowerCase()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#C24516] mx-auto mb-4" />
          <p className="text-lg text-zinc-300 font-sans">
            Loading your premium dashboard...
          </p>
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="max-w-md text-center p-8 border border-zinc-700 rounded-lg bg-zinc-900 mx-4">
          <AlertCircle className="w-10 h-10 text-[#C24516] mx-auto mb-4" />
          <h2 className="font-serif text-2xl mb-4 text-zinc-100">
            Dashboard Unavailable
          </h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <p className="text-sm text-zinc-500 mb-6">
            Your payment was successful and you now have Premium access.
            The competitive analysis may still be generating.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setRetryCount(0);
                loadDashboardData(0);
              }}
              className="bg-zinc-800 text-zinc-200 px-6 py-3 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/Form?payment=success&tier=premium')}
              className="bg-[#C24516] text-white px-6 py-3 rounded-lg hover:bg-[#A03814] transition-colors"
            >
              Continue to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* VIP Header */}
      <div className="bg-gradient-to-r from-[#C24516] to-[#A03814] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h1 className="font-serif text-3xl">Premium Dashboard</h1>
              </div>
              <p className="text-white/90 font-sans">
                {companyName} &bull; Full Access
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={downloadAllDocuments}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#C24516] rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm font-sans"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>

              <button
                onClick={copyImplementationPrompt}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm font-sans"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Implementation Prompt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Documents Generated"
            value={storedDocuments ? Object.keys(storedDocuments.documents || {}).length.toString() : '11'}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Competitive Dimensions"
            value={radarData?.axes?.length?.toString() || '6'}
            color="accent"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Your Strengths"
            value={radarData?.strengths?.length?.toString() || '3'}
            color="blue"
          />
          <StatCard
            icon={<Download className="w-5 h-5" />}
            label="Export Formats"
            value="ZIP, PDF, MD"
            color="purple"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800 mb-8 overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'competitive'}
            onClick={() => setActiveTab('competitive')}
          >
            Competitive Intelligence
          </TabButton>
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </TabButton>
          <TabButton
            active={activeTab === 'implementation'}
            onClick={() => setActiveTab('implementation')}
          >
            Implementation
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            radarData={radarData}
            companyName={companyName}
            storedFormData={storedFormData}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === 'competitive' && (
          <CompetitiveTab
            radarData={radarData}
            companyName={companyName}
            onExport={downloadRadarJSON}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            storedDocuments={storedDocuments}
            companyName={companyName}
            onDownloadAll={downloadAllDocuments}
            onGenerateDocuments={() => navigate('/Form?payment=success&tier=premium')}
          />
        )}

        {activeTab === 'implementation' && (
          <ImplementationTab
            companyName={companyName}
            radarData={radarData}
            storedFormData={storedFormData}
            storedDocuments={storedDocuments}
            onCopy={copyImplementationPrompt}
            copied={copied}
          />
        )}
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    green: 'bg-green-950/50 border-green-800/40 text-green-400',
    accent: 'bg-[#C24516]/10 border-[#C24516]/30 text-[#C24516]',
    blue: 'bg-blue-950/50 border-blue-800/40 text-blue-400',
    purple: 'bg-purple-950/50 border-purple-800/40 text-purple-400',
  };

  return (
    <div className={`border-2 rounded-xl p-5 ${colorClasses[color]}`}>
      <div className="mb-3">{icon}</div>
      <div className="text-2xl font-bold mb-1 text-zinc-100">{value}</div>
      <div className="text-sm opacity-80 font-sans">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 font-medium transition-colors whitespace-nowrap font-sans text-sm ${
        active
          ? 'text-[#C24516] border-b-2 border-[#C24516]'
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Tab Content ────────────────────────────────────────────────────────────

function OverviewTab({ radarData, companyName, storedFormData, onTabChange }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="border-2 border-[#C24516]/20 rounded-xl p-8 bg-[#C24516]/5">
        <h2 className="font-serif text-3xl mb-4 text-[#faf7f2]">
          Your Brand Intelligence Report
        </h2>
        <p className="text-zinc-400 text-lg mb-6 font-sans">
          Complete competitive analysis for {companyName}.
          All documents generated. Ready to implement.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-zinc-200 font-sans">
              Your Positioning
            </h3>
            <p className="text-zinc-400 text-sm font-sans">
              {storedFormData?.product_description ||
                radarData?.userURL ||
                'Complete your form to see positioning details'}
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-zinc-200 font-sans">
              Target Market
            </h3>
            <p className="text-zinc-400 text-sm font-sans">
              {radarData?.industry || storedFormData?.industry || 'SaaS'} &bull;{' '}
              {radarData?.competitorName
                ? `Competing with ${radarData.competitorName}`
                : 'General market'}
            </p>
          </div>
        </div>
      </div>

      {/* Radar Preview */}
      {radarData && (
        <div className="border border-zinc-800 rounded-xl p-8 bg-zinc-900/30">
          <h3 className="font-serif text-2xl mb-6 text-[#faf7f2]">
            Competitive Positioning
          </h3>
          <div className="max-w-2xl mx-auto">
            <PostPaymentRadarChart
              axes={radarData.axes}
              userScores={radarData.userScores}
              competitorScores={radarData.competitorScores}
              userName={companyName}
              competitorName={radarData.competitorName || 'Competitor'}
            />
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => onTabChange('competitive')}
              className="text-[#C24516] hover:text-[#A03814] font-medium font-sans text-sm"
            >
              View full analysis &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {radarData && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-green-900/50 rounded-xl p-6 bg-green-950/20">
            <h3 className="font-serif text-xl mb-4 text-green-400">
              Your Strengths
            </h3>
            <ul className="space-y-2">
              {radarData.strengths?.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300 font-sans">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-amber-900/50 rounded-xl p-6 bg-amber-950/20">
            <h3 className="font-serif text-xl mb-4 text-amber-400">
              Growth Opportunities
            </h3>
            <ul className="space-y-2">
              {radarData.opportunities?.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-300 font-sans">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitiveTab({ radarData, companyName, onExport }) {
  if (!radarData) {
    return (
      <div className="text-center py-12 text-zinc-500 font-sans">
        <p>No competitive analysis available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Full Radar Chart */}
      <div className="border-2 border-[#C24516]/30 rounded-xl p-8 bg-[#C24516]/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-3xl text-[#faf7f2]">
            Competitive Positioning Map
          </h2>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:border-[#C24516] hover:text-[#C24516] transition-colors text-sm font-sans"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
        <div className="max-w-3xl mx-auto">
          <PostPaymentRadarChart
            axes={radarData.axes}
            userScores={radarData.userScores}
            competitorScores={radarData.competitorScores}
            userName={companyName}
            competitorName={radarData.competitorName || 'Competitor'}
          />
        </div>
      </div>

      {/* Detailed Axis Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {radarData.axes.map((axis, i) => {
          const userScore = radarData.userScores[i] || 0;
          const compScore = radarData.competitorScores[i] || 0;
          const gap = userScore - compScore;

          return (
            <div
              key={axis.id || i}
              className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30"
            >
              <h3 className="font-medium mb-2 text-zinc-100 font-sans">
                {axis.name}
              </h3>
              <p className="text-xs text-zinc-500 mb-4 font-sans">
                {axis.description}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-sans">
                    <span className="text-zinc-300">You</span>
                    <span className="font-medium text-blue-400">
                      {userScore}/100
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${userScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1 font-sans">
                    <span className="text-zinc-500">
                      {radarData.competitorName}
                    </span>
                    <span className="font-medium text-pink-400">
                      {compScore}/100
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 transition-all duration-500"
                      style={{ width: `${compScore}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-medium font-sans ${
                      gap > 0
                        ? 'text-green-400'
                        : gap < 0
                        ? 'text-red-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    {gap > 0 ? '+' : ''}
                    {gap} gap
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border-2 border-green-800/30 rounded-xl p-6 bg-green-950/20">
          <h3 className="font-serif text-2xl mb-4 text-green-400">
            Your Strengths
          </h3>
          <ul className="space-y-3">
            {radarData.strengths?.map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300 font-sans">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-2 border-amber-800/30 rounded-xl p-6 bg-amber-950/20">
          <h3 className="font-serif text-2xl mb-4 text-amber-400">
            Growth Opportunities
          </h3>
          <ul className="space-y-3">
            {radarData.opportunities?.map((opp, i) => (
              <li key={i} className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-300 font-sans">{opp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-center">
        <p className="text-sm text-zinc-600 font-sans">
          Analysis generated{' '}
          {radarData.generatedAt
            ? new Date(radarData.generatedAt).toLocaleString()
            : 'recently'}
          {radarData.industry && ` | Industry: ${radarData.industry}`}
        </p>
      </div>
    </div>
  );
}

function DocumentsTab({
  storedDocuments,
  companyName,
  onDownloadAll,
  onGenerateDocuments,
}) {
  const documents = storedDocuments?.documents
    ? Object.entries(storedDocuments.documents).map(([name, content]) => ({
        name,
        content: typeof content === 'string' ? content : '',
        words: typeof content === 'string' ? content.split(/\s+/).length : 0,
      }))
    : [
        { name: 'Privacy Policy', content: '', words: 0 },
        { name: 'Terms of Use', content: '', words: 0 },
        { name: 'Cookie Policy', content: '', words: 0 },
        { name: 'About Us', content: '', words: 0 },
        { name: 'robots.txt', content: '', words: 0 },
        { name: 'sitemap.xml', content: '', words: 0 },
        { name: 'llms.txt', content: '', words: 0 },
        { name: 'brand-schema.json', content: '', words: 0 },
      ];

  const socialBios = storedDocuments?.socialBios;
  const hasDocuments = storedDocuments?.documents != null;
  const [copiedDoc, setCopiedDoc] = useState(null);

  const copyDocument = (name, content) => {
    navigator.clipboard.writeText(content);
    setCopiedDoc(name);
    setTimeout(() => setCopiedDoc(null), 2000);
  };

  const downloadSingleDoc = (name, content) => {
    const ext = name.includes('.') ? '' : '.md';
    const filename = name.toLowerCase().replace(/\s+/g, '-') + ext;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!hasDocuments) {
    return (
      <div className="text-center py-16">
        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h3 className="font-serif text-2xl text-zinc-200 mb-3">
          Documents Not Generated Yet
        </h3>
        <p className="text-zinc-400 font-sans mb-6 max-w-md mx-auto">
          Complete the form to generate your premium documents. As a premium
          member, you get all 11 documents with AI enhancement.
        </p>
        <button
          onClick={onGenerateDocuments}
          className="flex items-center gap-2 px-6 py-3 bg-[#C24516] text-white rounded-lg hover:bg-[#A03814] transition-colors font-sans mx-auto"
        >
          Generate Documents
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-3xl text-[#faf7f2]">Your Documents</h2>
        <button
          onClick={onDownloadAll}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C24516] text-white rounded-lg hover:bg-[#A03814] transition-colors text-sm font-sans"
        >
          <Download className="w-4 h-4" />
          Download All (ZIP)
        </button>
      </div>

      <div className="grid gap-3">
        {documents.map((doc, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg hover:border-[#C24516]/40 transition-colors bg-zinc-900/30"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-zinc-100 font-sans">
                {doc.name}
              </h3>
              <p className="text-sm text-zinc-500 font-sans">
                {doc.words > 0 ? `${doc.words} words` : 'Ready to generate'}
              </p>
            </div>

            {doc.content && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => downloadSingleDoc(doc.name, doc.content)}
                  className="px-3 py-1.5 border border-zinc-700 rounded text-zinc-300 hover:border-[#C24516] hover:text-[#C24516] transition-colors text-xs font-sans"
                >
                  Download
                </button>
                <button
                  onClick={() => copyDocument(doc.name, doc.content)}
                  className="px-3 py-1.5 border border-zinc-700 rounded text-zinc-300 hover:border-[#C24516] hover:text-[#C24516] transition-colors text-xs font-sans"
                >
                  {copiedDoc === doc.name ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Social Bios Section */}
      {socialBios && (
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/30 mt-8">
          <h3 className="font-serif text-xl mb-4 text-zinc-100">
            Social Media Bios
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {socialBios.twitter && (
              <SocialBioCard
                platform="Twitter / X"
                bio={socialBios.twitter}
                maxChars={160}
              />
            )}
            {socialBios.linkedin && (
              <SocialBioCard
                platform="LinkedIn"
                bio={socialBios.linkedin}
                maxChars={220}
              />
            )}
            {(socialBios.phTagline || socialBios.phDescription) && (
              <SocialBioCard
                platform="Product Hunt"
                bio={
                  socialBios.phTagline
                    ? `${socialBios.phTagline}\n\n${socialBios.phDescription || ''}`
                    : socialBios.phDescription || ''
                }
                maxChars={320}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SocialBioCard({ platform, bio, maxChars }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(bio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-300 font-sans">
          {platform}
        </span>
        <button
          onClick={copy}
          className="text-xs text-zinc-500 hover:text-[#C24516] transition-colors font-sans"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-sm text-zinc-400 font-sans whitespace-pre-line">
        {bio}
      </p>
      <p className="text-xs text-zinc-600 mt-2 font-sans">
        {bio.length}/{maxChars} chars
      </p>
    </div>
  );
}

function ImplementationTab({
  companyName,
  radarData,
  storedFormData,
  storedDocuments,
  onCopy,
  copied,
}) {
  return (
    <div className="space-y-8">
      <div className="border-2 border-[#C24516]/30 rounded-xl p-8 bg-[#C24516]/5">
        <h2 className="font-serif text-3xl mb-4 text-[#faf7f2]">
          One-Click Implementation
        </h2>
        <p className="text-zinc-400 text-lg mb-6 font-sans">
          Copy this prompt and paste it into Cursor, Lovable, Bolt.new, or
          Base44 to implement all your documents instantly.
        </p>

        <button
          onClick={onCopy}
          className="flex items-center gap-3 px-8 py-4 bg-[#C24516] text-white rounded-lg hover:bg-[#A03814] transition-colors text-lg font-medium font-sans"
        >
          {copied ? (
            <>
              <CheckCircle className="w-6 h-6" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-6 h-6" />
              Copy Implementation Prompt
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-2xl text-[#faf7f2]">
          How to implement:
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <StepCard
            number="1"
            title="Copy the prompt"
            description="Click the button above to copy the complete implementation prompt"
          />
          <StepCard
            number="2"
            title="Open your AI coding tool"
            description="Cursor, Lovable, Bolt.new, or Base44 - any works"
          />
          <StepCard
            number="3"
            title="Paste and run"
            description="Paste the prompt and let AI implement all documents"
          />
          <StepCard
            number="4"
            title="Deploy"
            description="Your legal docs are live in minutes, not weeks"
          />
        </div>
      </div>

      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/30">
        <h4 className="font-medium mb-3 text-zinc-200 font-sans">
          What gets implemented:
        </h4>
        <ul className="space-y-2 text-sm text-zinc-400 font-sans">
          <li>&bull; All legal documents with your business details</li>
          <li>&bull; Competitive positioning from radar analysis</li>
          <li>&bull; SEO-optimized llms.txt and robots.txt</li>
          <li>&bull; JSON-LD schema for rich search results</li>
          <li>&bull; Social media bios for 3 platforms</li>
          <li>&bull; Proper routing and page structure</li>
        </ul>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-[#C24516] text-white rounded-full flex items-center justify-center font-bold font-sans">
        {number}
      </div>
      <div>
        <h4 className="font-medium mb-1 text-zinc-200 font-sans">{title}</h4>
        <p className="text-sm text-zinc-500 font-sans">{description}</p>
      </div>
    </div>
  );
}

// ─── Implementation Prompt Generator ────────────────────────────────────────

function generateImplementationPrompt(
  companyName,
  radarData,
  storedFormData,
  storedDocuments
) {
  const docs = storedDocuments?.documents || {};
  const socialBios = storedDocuments?.socialBios;

  let prompt = `# Implement Annexa Generated Documents

## Business Details
- Name: ${companyName}
- Description: ${storedFormData?.product_description || ''}
- Industry: ${radarData?.industry || storedFormData?.industry || 'SaaS'}
- Email: ${storedFormData?.contact_email || ''}
- Website: ${radarData?.userURL || storedFormData?.website_url || ''}

## Documents to Implement
`;

  // Add each document
  Object.entries(docs).forEach(([name, content]) => {
    prompt += `\n### ${name}\n\`\`\`\n${content}\n\`\`\`\n`;
  });

  // Add social bios
  if (socialBios) {
    prompt += `\n## Social Media Bios\n`;
    if (socialBios.twitter)
      prompt += `- Twitter (160 chars): ${socialBios.twitter}\n`;
    if (socialBios.linkedin)
      prompt += `- LinkedIn (220 chars): ${socialBios.linkedin}\n`;
    if (socialBios.phTagline)
      prompt += `- Product Hunt tagline: ${socialBios.phTagline}\n`;
    if (socialBios.phDescription)
      prompt += `- Product Hunt description: ${socialBios.phDescription}\n`;
  }

  // Add competitive intelligence
  if (radarData) {
    prompt += `\n## Competitive Intelligence\n`;
    prompt += `Positioning vs ${radarData.competitorName}:\n`;
    radarData.axes?.forEach((axis, i) => {
      prompt += `- ${axis.name}: You (${radarData.userScores[i]}) vs Competitor (${radarData.competitorScores[i]})\n`;
    });

    if (radarData.strengths?.length) {
      prompt += `\nStrengths:\n`;
      radarData.strengths.forEach((s) => {
        prompt += `- ${s}\n`;
      });
    }

    if (radarData.opportunities?.length) {
      prompt += `\nOpportunities:\n`;
      radarData.opportunities.forEach((o) => {
        prompt += `- ${o}\n`;
      });
    }
  }

  prompt += `
## Implementation Instructions

Create these routes in your app:
- /privacy - Privacy Policy page
- /terms - Terms of Service page
- /cookies - Cookie Policy page
- /about - About Us page
- /robots.txt - SEO robots file
- /sitemap.xml - Sitemap
- /llms.txt - AI assistant optimization

Add JSON-LD schema to all pages for rich search results.
Use the brand guidelines and competitive positioning to inform all copy.
`;

  return prompt;
}
