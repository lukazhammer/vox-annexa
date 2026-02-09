import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MultiCompetitorRadar } from '@/components/competitive/MultiCompetitorRadar';
import CompetitiveIntelligence from '@/components/CompetitiveIntelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Download, Zap, TrendingUp, Loader2, ArrowLeft } from 'lucide-react';

export default function PremiumBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [formData, setFormData] = useState({});
  const [radarData, setRadarData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('build');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [sessionId]);

  const loadUserData = async () => {
    try {
      // Try loading from server first
      if (sessionId) {
        try {
          const result = await base44.functions.invoke('getPremiumSession', {
            sessionId,
          });
          if (result.data.success) {
            setFormData(result.data.data.formData || {});
            setRadarData(result.data.data.radarData || null);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Server session load failed, trying localStorage:', err);
        }
      }

      // Fallback to localStorage
      const storedFormData = localStorage.getItem('annexa_premium_form_data');
      if (storedFormData) {
        setFormData(JSON.parse(storedFormData));
      }

      const storedRadarData = localStorage.getItem('annexa_premium_radar_data');
      if (storedRadarData) {
        setRadarData(JSON.parse(storedRadarData));
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    // Persist to localStorage
    try {
      localStorage.setItem('annexa_premium_form_data', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist form data:', e);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await base44.functions.invoke('generateDocuments', {
        ...formData,
        competitiveIntel: null, // Will be re-generated
      });
      if (response.data) {
        base44.analytics.track({
          eventName: 'premium_documents_regenerated',
          properties: { source: 'premium_builder' }
        });
      }
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await base44.functions.invoke('generateMarkdownZip', {
        formData,
        tier: 'premium',
      });
      if (response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#C24516] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your premium workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#C24516]/10 to-transparent border-b border-[#C24516]/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/Form')}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-[#C24516]/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#C24516]" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-[#faf7f2]">Premium Builder</h1>
                <p className="text-sm text-zinc-400">
                  {formData.company_name || 'Your Product'} - Competitive Intelligence Active
                </p>
              </div>
            </div>

            <Button
              onClick={handleDownloadAll}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:border-[#C24516] hover:text-[#C24516]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <TabButton
              active={activeTab === 'build'}
              onClick={() => setActiveTab('build')}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              Build & Refine
            </TabButton>
            <TabButton
              active={activeTab === 'competitive'}
              onClick={() => setActiveTab('competitive')}
              icon={<TrendingUp className="w-4 h-4" />}
            >
              Competitive Analysis
            </TabButton>
            <TabButton
              active={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              icon={<Download className="w-4 h-4" />}
            >
              Documents
            </TabButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'build' && (
          <BuildTab
            formData={formData}
            onFieldChange={handleFieldChange}
            radarData={radarData}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        )}

        {activeTab === 'competitive' && (
          <CompetitiveTab
            formData={formData}
            radarData={radarData}
            setRadarData={setRadarData}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab formData={formData} />
        )}
      </div>
    </div>
  );
}

// ─── Build Tab ──────────────────────────────────────────────────────────
function BuildTab({ formData, onFieldChange, radarData, onRegenerate, isRegenerating }) {
  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left: Form Fields */}
      <div className="lg:col-span-5">
        <div className="sticky top-6">
          <h2 className="font-serif text-3xl text-[#faf7f2] mb-6">Refine Your Brand</h2>

          <div className="space-y-6">
            <div>
              <Label className="text-[#faf7f2] mb-2 block text-sm">Product Name</Label>
              <Input
                value={formData.company_name || ''}
                onChange={(e) => onFieldChange('company_name', e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white"
              />
            </div>

            <div>
              <Label className="text-[#faf7f2] mb-2 block text-sm">Product Description</Label>
              <Textarea
                value={formData.product_description || ''}
                onChange={(e) => onFieldChange('product_description', e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[100px]"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-[#faf7f2] mb-2 block text-sm">Brand Positioning</Label>
              <Textarea
                value={formData.brand_positioning || ''}
                onChange={(e) => onFieldChange('brand_positioning', e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[80px]"
                placeholder="How do you want to be perceived?"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-[#faf7f2] mb-2 block text-sm">Target Pain Points</Label>
              <Textarea
                value={formData.target_pain_points || ''}
                onChange={(e) => onFieldChange('target_pain_points', e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-white min-h-[80px]"
                placeholder="What frustrates your users about current alternatives?"
                rows={3}
              />
            </div>

            <Button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="w-full bg-[#C24516] hover:bg-[#a33912] text-white"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate Documents'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Radar Preview */}
      <div className="lg:col-span-7">
        {radarData ? (
          <div className="bg-zinc-900 border-2 border-[#C24516]/20 rounded-xl p-8">
            <h3 className="font-serif text-2xl text-[#faf7f2] mb-6 text-center">
              Your Competitive Position
            </h3>
            <MultiCompetitorRadar
              axes={radarData.axes}
              userScores={radarData.userScores}
              competitorScores={radarData.competitorScores}
              competitorNames={radarData.competitorNames}
              userName={formData.company_name || 'Your Product'}
            />

            {/* Insights summary */}
            {radarData.insights && (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-4">No competitive analysis yet</p>
            <p className="text-zinc-500 text-sm">
              Switch to the Competitive Analysis tab to analyze competitors and generate your positioning map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Competitive Tab ────────────────────────────────────────────────────
function CompetitiveTab({ formData, radarData, setRadarData }) {
  return (
    <div className="space-y-8">
      {/* Hero Radar - Full Width */}
      {radarData && (
        <div className="bg-zinc-900 border-2 border-[#C24516]/20 rounded-xl p-12">
          <h2 className="font-serif text-4xl text-[#faf7f2] mb-8 text-center">
            Competitive Positioning Map
          </h2>
          <div className="max-w-4xl mx-auto">
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
            <div className="mt-8 max-w-4xl mx-auto grid gap-4 sm:grid-cols-3">
              {radarData.insights.strengths?.length > 0 && (
                <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">Strengths</p>
                  <ul className="space-y-2">
                    {radarData.insights.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-100/80">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {radarData.insights.opportunities?.length > 0 && (
                <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">Opportunities</p>
                  <ul className="space-y-2">
                    {radarData.insights.opportunities.map((s, i) => (
                      <li key={i} className="text-sm text-amber-100/80">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {radarData.insights.threats?.length > 0 && (
                <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wide">Threats</p>
                  <ul className="space-y-2">
                    {radarData.insights.threats.map((s, i) => (
                      <li key={i} className="text-sm text-red-100/80">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Competitive Intelligence Interface */}
      <CompetitiveIntelligence
        formData={formData}
        tier="premium"
        onComplete={(intel) => {
          if (intel?.radarData) {
            setRadarData(intel.radarData);
            // Persist radar data
            try {
              localStorage.setItem('annexa_premium_radar_data', JSON.stringify(intel.radarData));
            } catch (e) {
              console.warn('Failed to persist radar data:', e);
            }
          }
        }}
        onSkip={() => {}}
        onUpgrade={() => {}}
      />
    </div>
  );
}

// ─── Documents Tab ──────────────────────────────────────────────────────
function DocumentsTab({ formData: _formData }) {
  const [documents, setDocuments] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('annexa_premium_documents');
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to load stored documents:', e);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C24516] mx-auto mb-4" />
        <p className="text-zinc-400">Loading documents...</p>
      </div>
    );
  }

  if (!documents) {
    return (
      <div className="text-center py-12">
        <Download className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 mb-2">No documents generated yet</p>
        <p className="text-zinc-500 text-sm">
          Go to the Build & Refine tab to generate your documents.
        </p>
      </div>
    );
  }

  const docTypes = [
    { key: 'privacy_policy', label: 'Privacy Policy', icon: '🔒' },
    { key: 'terms_of_service', label: 'Terms of Service', icon: '📋' },
    { key: 'cookie_policy', label: 'Cookie Policy', icon: '🍪' },
    { key: 'llms_txt', label: 'llms.txt', icon: '🤖' },
    { key: 'brand_schema', label: 'brand-schema.json', icon: '📊' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-3xl text-[#faf7f2] mb-6">Your Documents</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docTypes.map((doc) => {
          const content = documents.documents?.[doc.key] || documents.technicalFiles?.[doc.key];
          return (
            <div
              key={doc.key}
              className={`bg-zinc-900 border rounded-lg p-6 ${
                content ? 'border-zinc-700' : 'border-zinc-800 opacity-50'
              }`}
            >
              <div className="text-2xl mb-3">{doc.icon}</div>
              <h3 className="font-medium text-[#faf7f2] mb-1">{doc.label}</h3>
              <p className="text-xs text-zinc-500">
                {content ? `${(content.length / 1024).toFixed(1)}KB` : 'Not generated'}
              </p>
              {content && (
                <Button
                  variant="outline"
                  className="mt-4 w-full border-zinc-700 text-zinc-300 hover:border-[#C24516] text-sm"
                  onClick={() => {
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.key.replace(/_/g, '-') + (doc.key.includes('json') ? '.json' : '.md');
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors text-sm font-medium ${
        active
          ? 'border-[#C24516] text-[#C24516]'
          : 'border-transparent text-zinc-400 hover:text-[#faf7f2]'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
