import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Edit, CheckCircle, Mail, Copy, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SocialBios from '@/components/SocialBios';
import TierDebugPanel from '@/components/TierDebugPanel';
import { getUserTier } from '@/lib/tierUtils';

export default function Preview() {
  const location = useLocation();
  const navigate = useNavigate();
  const rawDocuments = location.state?.documents || {};
  const socialBios = location.state?.socialBios || {};
  const technicalFiles = location.state?.technicalFiles || {};
  const competitiveIntel = location.state?.competitiveIntel || null;
  const formData = location.state?.formData || {};

  // Use persistent tier from localStorage (survives page refresh)
  // Falls back to navigation state, then 'free'
  const tier = getUserTier() || location.state?.tier || 'free';
  const isEdgeTier = tier === 'edge' || tier === 'premium';

  // Combine documents with technical files for display
  const documents = {
    ...rawDocuments,
    'robots.txt': technicalFiles.robotsTxt || '',
    'sitemap.xml': technicalFiles.sitemapXml || '',
    'llms.txt': technicalFiles.llmsTxt || '',
    'brand-schema.json': technicalFiles.brandSchema ? JSON.stringify(technicalFiles.brandSchema, null, 2) : ''
  };

  const [selectedDoc, setSelectedDoc] = useState('Privacy Policy');
  const [expanded, setExpanded] = useState({});
  const [generationTime] = useState(() => Math.floor(Math.random() * 30) + 90); // 90-120 seconds
  const [dataPoints] = useState(() => Object.keys(formData).filter(k => formData[k]).length);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState(formData.contact_email || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [landingPatchLoading, setLandingPatchLoading] = useState(false);
  const [landingPatchError, setLandingPatchError] = useState('');
  const [landingPatchData, setLandingPatchData] = useState(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState('');
  const [implementationFramework, setImplementationFramework] = useState('next-app');
  const [implementationCopied, setImplementationCopied] = useState(false);

  const docList = [
    'Privacy Policy',
    'Terms of Use',
    'Cookie Policy',
    'About Us',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'brand-schema.json'
  ];

  const toggleExpand = (doc) => {
    setExpanded(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  const getPreview = (content) => {
    if (!content) return '';
    const words = content.split(' ').slice(0, 50).join(' ');
    return words + (content.split(' ').length > 50 ? '...' : '');
  };

  const getWordCount = (content) => {
    if (!content) return 0;
    return content.split(/\s+/).length;
  };

  const getDocBadge = (docName) => {
    if (docName === 'Privacy Policy' || docName === 'Cookie Policy') {
      return <span className="text-green-500 text-xs ml-2">●</span>;
    }
    return null;
  };

  const downloadDocument = (docName, content, withWatermark = true) => {
    let finalContent = content;

    if (withWatermark && !docName.includes('.txt') && !docName.includes('.xml') && !docName.includes('.json')) {
      finalContent = content + '\n\n---\n\nPrepared by Vox Animus SaaS Launch Kit\nhttps://vox-animus.com';
    }

    const blob = new Blob([finalContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docName.toLowerCase().replace(/\s+/g, '-');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = (withWatermark = true) => {
    Object.entries(documents).forEach(([name, content]) => {
      setTimeout(() => downloadDocument(name, content, withWatermark), 100);
    });
  };

  const handleEdit = () => {
    navigate('/form', { state: { formData } });
  };

  const handleEmailDocuments = async () => {
    if (!emailAddress) return;

    setEmailSending(true);
    try {
      await base44.functions.invoke('emailDocuments', {
        email: emailAddress,
        documents,
        formData,
        marketingOptIn
      });
      base44.analytics.track({
        eventName: 'launch_kit_delivery_email_submitted',
        properties: {
          tier,
          marketing_opt_in: marketingOptIn
        }
      });
      setEmailSent(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSent(false);
      }, 3000);
    } catch (err) {
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const trackPlausible = (eventName, props) => {
    if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
      window.plausible(eventName, props ? { props } : undefined);
    }
  };

  const handleGenerateLandingPatch = async () => {
    setLandingPatchLoading(true);
    setLandingPatchError('');

    try {
      const differentiators = [
        formData.brand_positioning,
        formData.target_pain_points,
        competitiveIntel?.differentiation,
      ].filter(Boolean);

      const response = await base44.functions.invoke('generateLandingPatch', {
        websiteUrl: formData.website_url || '',
        productName: formData.company_name || 'Product',
        oneLiner: formData.product_description || '',
        audience: formData.target_audience || formData.target_customer || '',
        differentiators,
        tier: isEdgeTier ? 'edge' : 'free',
      });

      if (!response?.data?.success || !Array.isArray(response.data.variants)) {
        throw new Error(response?.data?.error || 'Landing patch creation failed.');
      }

      setLandingPatchData(response.data);
      setActiveVariantIndex(0);
      trackPlausible('Landing Patch Created');
    } catch (error) {
      setLandingPatchError(error?.message || 'Landing patch creation failed.');
    } finally {
      setLandingPatchLoading(false);
    }
  };

  const copyPatchBlock = async (key, text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      trackPlausible('Landing Patch Copied', { block: key });
      setTimeout(() => setCopiedKey(''), 1600);
    } catch {
      setLandingPatchError('Copy failed. Use manual copy.');
    }
  };

  const variants = landingPatchData?.variants || [];
  const activeVariant = variants[activeVariantIndex] || variants[0] || null;
  const fullHeroBlock = activeVariant
    ? [
      `Headline: ${activeVariant.headline}`,
      `Subhead: ${activeVariant.subhead}`,
      'Bullets:',
      ...(activeVariant.bullets || []).map((bullet) => `- ${bullet}`),
      `CTA: ${activeVariant.cta}`,
    ].join('\n')
    : '';

  const implementationFrameworks = [
    { id: 'next-app', label: 'Next.js (App Router)' },
    { id: 'next-pages', label: 'Next.js (Pages Router)' },
    { id: 'remix', label: 'Remix' },
    { id: 'react-router', label: 'React Router' },
  ];

  const legalRoutes = [
    { label: 'Privacy Policy', route: '/privacy', slug: 'privacy' },
    { label: 'Terms of Use', route: '/terms', slug: 'terms' },
    { label: 'Cookie Policy', route: '/cookies', slug: 'cookies' },
    { label: 'Data Request (DSAR)', route: '/data-request', slug: 'data-request' },
  ];

  const frameworkRouteFiles = {
    'next-app': legalRoutes.map((item) => ({ ...item, file: `app${item.route}/page.tsx` })),
    'next-pages': legalRoutes.map((item) => ({ ...item, file: `pages${item.route}.tsx` })),
    remix: legalRoutes.map((item) => ({ ...item, file: `app/routes/${item.slug}.tsx` })),
    'react-router': legalRoutes.map((item) => ({ ...item, file: `src/pages/${item.slug}.jsx` })),
  };

  const footerLinksSnippet = `<footer>
  <nav aria-label="Legal links">
    <a href="/privacy">Privacy Policy</a>
    <a href="/terms">Terms of Use</a>
    <a href="/cookies">Cookie Policy</a>
    <a href="/data-request">Data Request</a>
  </nav>
</footer>`;

  const checkboxSnippets = {
    'next-app': `// app/signup/page.tsx
<label>
  <input type="checkbox" name="termsAccepted" required />
  I agree to the Terms of Use
</label>
// Validate termsAccepted in your action/route handler before account creation.`,
    'next-pages': `// pages/signup.tsx
<label>
  <input type="checkbox" name="termsAccepted" required />
  I agree to the Terms of Use
</label>
// Validate termsAccepted in your API route before account creation.`,
    remix: `// app/routes/signup.tsx
<label>
  <input type="checkbox" name="termsAccepted" required />
  I agree to the Terms of Use
</label>
// In action(), reject submissions when termsAccepted is missing.`,
    'react-router': `// src/pages/Signup.jsx
<label>
  <input type="checkbox" name="termsAccepted" required />
  I agree to the Terms of Use
</label>
// In submit handler, block submit when termsAccepted is false.`,
  };

  const implementationPatch = [
    `Framework: ${implementationFrameworks.find((item) => item.id === implementationFramework)?.label || implementationFramework}`,
    '',
    'File map:',
    ...(frameworkRouteFiles[implementationFramework] || []).map((item) => `- ${item.route} -> ${item.file} (${item.label})`),
    '',
    'Footer snippet:',
    footerLinksSnippet,
    '',
    'Terms checkbox wiring:',
    checkboxSnippets[implementationFramework] || '',
  ].join('\n');

  const copyImplementationPatch = async () => {
    try {
      await navigator.clipboard.writeText(implementationPatch);
      setImplementationCopied(true);
      setTimeout(() => setImplementationCopied(false), 1600);
    } catch {
      setLandingPatchError('Copy failed. Use manual copy.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-400 hover:text-white mb-6 flex items-center text-sm"
      >
        ← Start over with different inputs
      </button>

      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-4">Your documents are ready</h2>

        {/* Metadata */}
        <p className="text-sm text-zinc-400 mb-6">
          Created: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {formData.country} • {dataPoints} inputs • GDPR, CCPA compliant
        </p>

        {/* Document List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">8 documents created:</h3>
          <div className="space-y-2">
            {docList.map(doc => (
              <div key={doc} className="flex items-center text-zinc-300">
                <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-sm">{doc}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-400">
              <strong className="text-zinc-300">Based on:</strong> {formData.company_name} • {formData.contact_email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-12">
        <Button
          onClick={() => downloadAll(tier === 'free')}
          className="bg-[#C24516] hover:bg-[#a33912] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download all
        </Button>
        <Button
          onClick={() => setShowEmailModal(true)}
          variant="outline"
          className="bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email to me
        </Button>
        <Button
          onClick={handleEdit}
          variant="outline"
          className="bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sticky top-6">
            <h3 className="font-bold mb-4 text-white">Documents</h3>
            <div className="space-y-2">
              {docList.map(doc => (
                <button
                  key={doc}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${selectedDoc === doc
                    ? 'bg-[#C24516] text-white'
                    : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{doc}</span>
                    {getDocBadge(doc)}
                  </div>
                  {documents[doc] && (
                    <div className="text-xs mt-1 text-zinc-500">
                      {getWordCount(documents[doc])} words
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* EDGE: Social Bios */}
          {isEdgeTier && socialBios && (
            <SocialBios formData={formData} socialBios={socialBios} />
          )}

          {/* Selected document full view */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold">{selectedDoc}</h3>
              <Button
                onClick={() => downloadDocument(selectedDoc, documents[selectedDoc], tier === 'free')}
                variant="outline"
                size="sm"
                className="bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-zinc-300 font-mono text-sm leading-relaxed">
              {documents[selectedDoc]}
            </pre>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold">Landing Patch</h3>
                <p className="text-zinc-400 text-sm mt-1">Create hero copy from your current inputs.</p>
              </div>
              <Button
                onClick={handleGenerateLandingPatch}
                disabled={landingPatchLoading}
                className="bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                {landingPatchLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  'Create landing patch'
                )}
              </Button>
            </div>

            {landingPatchError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/40 rounded-md px-3 py-2 text-sm text-red-400">
                {landingPatchError}
              </div>
            )}

            {activeVariant && (
              <div className="space-y-4">
                {isEdgeTier && variants.length > 1 && (
                  <div className="flex gap-2 flex-wrap">
                    {variants.map((variant, index) => (
                      <button
                        key={variant.id || `variant-${index + 1}`}
                        onClick={() => setActiveVariantIndex(index)}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${activeVariantIndex === index
                          ? 'bg-[#C24516] border-[#C24516] text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                          }`}
                      >
                        Variant {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border border-zinc-700 rounded-lg p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Headline</p>
                      <button
                        onClick={() => copyPatchBlock('headline', activeVariant.headline)}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedKey === 'headline' ? 'Copied' : 'Copy headline'}
                      </button>
                    </div>
                    <p className="text-lg text-white">{activeVariant.headline}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Subhead</p>
                    <p className="text-zinc-200">{activeVariant.subhead}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Bullets</p>
                    <ul className="space-y-1 text-zinc-200">
                      {(activeVariant.bullets || []).map((bullet, idx) => (
                        <li key={`${bullet}-${idx}`} className="flex gap-2">
                          <span className="text-[#C24516]">-</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">CTA</p>
                    <p className="text-zinc-100">{activeVariant.cta}</p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      onClick={() => copyPatchBlock('full_hero_block', fullHeroBlock)}
                      className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedKey === 'full_hero_block' ? 'Copied' : 'Copy full hero block'}
                    </Button>
                  </div>

                  {Array.isArray(activeVariant.alternates?.headline) && activeVariant.alternates.headline.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Alternates</p>
                      <div className="space-y-2 text-sm text-zinc-300">
                        <p><span className="text-zinc-500">Headline:</span> {activeVariant.alternates.headline.join(' | ')}</p>
                        <p><span className="text-zinc-500">Subhead:</span> {activeVariant.alternates.subhead.join(' | ')}</p>
                        <p><span className="text-zinc-500">CTA:</span> {activeVariant.alternates.cta.join(' | ')}</p>
                      </div>
                    </div>
                  )}

                  {isEdgeTier && activeVariant.whyThisWorks && (
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Why this works</p>
                      <p className="text-sm text-zinc-300">{activeVariant.whyThisWorks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-bold">Implementation kit</h3>
                <p className="text-zinc-400 text-sm mt-1">Framework-ready routes and snippets for your legal pages.</p>
              </div>
              <Button
                variant="outline"
                onClick={copyImplementationPatch}
                className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              >
                <Copy className="w-4 h-4 mr-2" />
                {implementationCopied ? 'Copied' : 'Copy full patch'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {implementationFrameworks.map((framework) => (
                <button
                  key={framework.id}
                  onClick={() => setImplementationFramework(framework.id)}
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    implementationFramework === framework.id
                      ? 'bg-[#C24516] border-[#C24516] text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {framework.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">File map</p>
                <ul className="space-y-1 text-sm text-zinc-200">
                  {(frameworkRouteFiles[implementationFramework] || []).map((item) => (
                    <li key={item.file} className="flex flex-wrap gap-2">
                      <span className="text-zinc-400">{item.route}</span>
                      <span className="text-zinc-500">-></span>
                      <code className="text-zinc-100">{item.file}</code>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Footer snippet</p>
                <pre className="whitespace-pre-wrap text-xs text-zinc-200 font-mono">{footerLinksSnippet}</pre>
              </div>

              <div className="border border-zinc-700 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Terms checkbox wiring</p>
                <pre className="whitespace-pre-wrap text-xs text-zinc-200 font-mono">{checkboxSnippets[implementationFramework]}</pre>
              </div>
            </div>
          </div>

          {/* Download options */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Download Options</h3>

            <div className="space-y-4">
              <div className="border border-zinc-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">Free Version</h4>
                    <p className="text-zinc-400 text-sm">Includes "Prepared by Vox Animus" attribution</p>
                  </div>
                  <span className="text-2xl font-bold text-[#C24516]">Free</span>
                </div>
                <div className="space-y-2 mt-4">
                  <Button
                    onClick={() => downloadAll(true)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download All (with watermark)
                  </Button>
                  <Button
                    onClick={() => setShowEmailModal(true)}
                    variant="outline"
                    className="w-full bg-zinc-900 border-[#C24516] text-[#C24516] hover:bg-[#C24516] hover:text-white"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email me a download link
                  </Button>
                </div>
              </div>

              {isEdgeTier && (
                <div className="border-2 border-green-500/50 rounded-lg p-6 bg-zinc-900">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Export Included
                      </h4>
                      <p className="text-zinc-400 text-sm">Professional documents with no branding</p>
                    </div>
                    <span className="text-2xl font-bold text-green-500">Included</span>
                  </div>
                  <Button
                    onClick={() => downloadAll(false)}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download ZIP Without Branding
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Where should we send the ZIP?</DialogTitle>
          </DialogHeader>

          {!emailSent ? (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                We will email a ZIP download link for your documents.
              </p>
              <div>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <label className="flex items-start gap-2 text-xs text-zinc-400">
                <Checkbox
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(Boolean(checked))}
                />
                <span>Send me optional product updates by email.</span>
              </label>
              <Button
                onClick={handleEmailDocuments}
                disabled={emailSending || !emailAddress}
                className="w-full bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                {emailSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send ZIP
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium mb-2">Check your inbox!</p>
              <p className="text-zinc-400 text-sm">
                We sent the documents to <strong className="text-white">{emailAddress}</strong>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Development-only tier debug panel */}
      <TierDebugPanel />
    </div>
  );
}
