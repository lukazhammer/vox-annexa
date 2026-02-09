import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Download, Loader2, Mail, CheckCircle, ExternalLink, Copy, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getUserTier } from '@/lib/tierUtils';

export default function UpsellModal({
  open,
  onOpenChange,
  onDownloadFree,
  onUpgrade,
  isEdge: isEdgeProp,
  isPremium: isPremiumProp, // Backward compatibility
  documents,
  socialBios,
  technicalFiles,
  competitiveIntel,
  formData,
  tier: tierProp // Keep for backward compatibility
}) {
  // Use persistent tier from localStorage, fallback to props
  const tier = getUserTier() || tierProp || 'free';
  const isEdge = tier === 'edge' || isEdgeProp || isPremiumProp;

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [showVoxPromo, setShowVoxPromo] = useState(true);
  const [copiedBio, setCopiedBio] = useState(null);
  const [showLlmsTxt, setShowLlmsTxt] = useState(false);

  useEffect(() => {
    if (open) {
      base44.analytics.track({
        eventName: 'launch_kit_upsell_viewed',
        properties: { tier }
      });

      const promoSeen = sessionStorage.getItem('annexa.vox-promo-seen');
      if (promoSeen) {
        setShowVoxPromo(false);
      }
    }
  }, [open, tier]);

  const handleVoxPromoDismiss = () => {
    sessionStorage.setItem('annexa.vox-promo-seen', 'true');
    setShowVoxPromo(false);
  };

  const handleVoxPromoClick = () => {
    sessionStorage.setItem('annexa.vox-promo-seen', 'true');
    window.open('https://vox-animus.com/demo', '_blank');
  };

  const handleCopyBio = (platform, text) => {
    navigator.clipboard.writeText(text);
    setCopiedBio(platform);
    setTimeout(() => setCopiedBio(null), 2000);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await base44.functions.invoke('generatePDF', {
        documents,
        productName: formData.company_name,
        withWatermark: tier === 'free'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annexa-${formData.company_name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadMarkdown = async () => {
    if (!isEdge) return;

    setDownloading(true);
    setDownloadError(null);
    try {
      const biosToUse = socialBios || {
        twitter: `${formData.company_name || 'Product'} - ${formData.product_description || 'Description'}`.substring(0, 160),
        linkedin: `${formData.company_name || 'Product'} helps ${(formData.product_description || 'Description').toLowerCase()}.`.substring(0, 200),
        instagram: `${formData.company_name || 'Product'}: ${formData.product_description || 'Description'}`.substring(0, 150)
      };

      const response = await base44.functions.invoke('generateMarkdownZip', {
        documents,
        productName: formData.company_name,
        socialBios: biosToUse,
        technicalFiles
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `annexa-edge-${formData.company_name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setDownloadError('Failed to generate zip. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // EDGE modal
  if (isEdge) {
    const hasCompetitiveIntel = competitiveIntel && competitiveIntel.competitor;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Your launch kit is ready</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document list */}
            <div className="space-y-2">
              <p className="text-zinc-300">11 documents generated:</p>
              <div className="text-sm text-zinc-400 grid grid-cols-2 gap-1">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Privacy Policy (AI-enhanced)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Terms of Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Cookie Policy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>About Us</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>robots.txt</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>sitemap.xml</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>llms.txt {hasCompetitiveIntel && '(competitive)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>brand-schema.json</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Social bios (3 platforms)</span>
                </div>
              </div>
            </div>

            {/* Context info */}
            <div className="bg-zinc-800/50 rounded px-3 py-2 text-xs text-zinc-400">
              Based on: <span className="text-zinc-300">{formData.company_name}</span> • {formData.contact_email}
              {hasCompetitiveIntel && (
                <> • Competitive analysis: <span className="text-[#C24516]">{competitiveIntel.competitor.productName}</span></>
              )}
            </div>

            {/* Social Bios Preview */}
            {socialBios && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-zinc-300">Social Bios</h4>
                <div className="space-y-2">
                  {[
                    { key: 'twitter', label: 'X/Twitter', limit: 160 },
                    { key: 'linkedin', label: 'LinkedIn', limit: 200 },
                    { key: 'instagram', label: 'Instagram', limit: 150 }
                  ].map(({ key, label, limit }) => (
                    <div key={key} className="bg-zinc-800/50 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">{label}</span>
                        <button
                          onClick={() => handleCopyBio(key, socialBios[key])}
                          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                        >
                          {copiedBio === key ? (
                            <><CheckCircle className="w-3 h-3 text-green-500" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy</>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-300">{socialBios[key]}</p>
                      <span className="text-[10px] text-zinc-600">{socialBios[key]?.length || 0}/{limit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* llms.txt Preview (competitive sections) */}
            {hasCompetitiveIntel && technicalFiles?.llmsTxt && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowLlmsTxt(!showLlmsTxt)}
                  className="text-sm font-semibold text-zinc-300 flex items-center gap-2 hover:text-white"
                >
                  <FileText className="w-4 h-4" />
                  Enhanced llms.txt Preview
                  <span className="text-xs text-zinc-500">{showLlmsTxt ? '▲' : '▼'}</span>
                </button>
                {showLlmsTxt && (
                  <div className="bg-zinc-800/50 rounded p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                      {technicalFiles.llmsTxt.split('\n').slice(0, 30).join('\n')}
                      {technicalFiles.llmsTxt.split('\n').length > 30 && '\n...'}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {downloadError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-500 text-sm">{downloadError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleDownloadMarkdown}
                disabled={downloading}
                className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12"
              >
                {downloading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Download className="w-5 h-5 mr-2" />Download All (ZIP)</>
                )}
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <Download className="w-4 h-4 mr-2" />PDF Only
                </Button>
                <Button
                  onClick={onDownloadFree}
                  variant="outline"
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <><Mail className="w-4 h-4 mr-2" />View documents</>
                </Button>
              </div>

              <Button
                onClick={onDownloadFree}
                variant="ghost"
                className="w-full text-zinc-500 hover:text-zinc-400 text-sm"
              >
                View documents in browser
              </Button>
            </div>

            {showVoxPromo && (
              <div className="pt-4 border-t border-zinc-800">
                <div className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-zinc-400">
                    Legal foundation: sorted. Need brand strategy for AI tools?
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleVoxPromoClick}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-white hover:bg-zinc-800 text-xs"
                    >
                      Vox Animus <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                    <button onClick={handleVoxPromoDismiss} className="text-xs text-zinc-500 hover:text-zinc-400">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Free modal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Your launch kit is ready</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-zinc-300">4 templates generated:</p>
            <div className="text-sm text-zinc-400 space-y-1">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Privacy Policy</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Terms of Service</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>About</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Support</span>
              </div>
            </div>
          </div>

          {downloadError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-500 text-sm">{downloadError}</p>
            </div>
          )}

          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12"
          >
            {downloading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Download launch kit</>
            )}
          </Button>

          <div className="flex items-center justify-center gap-3 text-sm text-zinc-400">
            <button onClick={onDownloadFree} className="hover:text-white transition-colors">
              View documents
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Need more than legal docs?</h3>
              <p className="text-sm text-zinc-400">
                EDGE ($19): Social bios, enhanced llms.txt with AI recommendations, competitive positioning, rich schema.org data
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={onUpgrade} className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12">
                Upgrade to EDGE ($19)
              </Button>
              <Button onClick={onDownloadFree} variant="ghost" className="w-full text-zinc-400 hover:text-white text-sm">
                Continue with free version
              </Button>
            </div>
          </div>

          {showVoxPromo && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="bg-zinc-800/30 rounded-lg p-3 space-y-2">
                <p className="text-xs text-zinc-400">Legal foundation: sorted. Need brand strategy?</p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleVoxPromoClick}
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-white hover:bg-zinc-800 text-xs"
                  >
                    Vox Animus <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                  <button onClick={handleVoxPromoDismiss} className="text-xs text-zinc-500 hover:text-zinc-400">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
