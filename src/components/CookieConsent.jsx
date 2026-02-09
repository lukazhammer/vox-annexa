import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('vox.cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const saved = JSON.parse(consent);
      setPreferences(saved);
    }
  }, []);

  const savePreferences = (prefs) => {
    localStorage.setItem('vox.cookie-consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
    
    // Reload to apply analytics preference
    if (prefs.analytics !== preferences.analytics) {
      window.location.reload();
    }
  };

  const handleAcceptAll = () => {
    savePreferences({ essential: true, analytics: true, marketing: false });
  };

  const handleEssentialOnly = () => {
    savePreferences({ essential: true, analytics: false, marketing: false });
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  const openSettings = () => {
    setShowSettings(true);
    setShowBanner(false);
  };

  if (!showBanner && !showSettings) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#242426] border-t-2 border-[rgba(194,69,22,0.3)] p-4 sm:p-6 z-50 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-sm text-[rgba(250,247,242,0.7)] mb-4 leading-relaxed">
                  Essential cookies keep this tool working. Analytics cookies help us improve (optional).
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    size="sm"
                    className="bg-[#C24516] hover:bg-[#a33912] hover:scale-[1.02] active:scale-[0.98] text-white transition-all duration-150 h-11 min-w-[44px]"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleEssentialOnly}
                    variant="outline"
                    size="sm"
                    className="border-[#C24516] text-[#C24516] hover:bg-[rgba(194,69,22,0.1)] transition-all duration-150 h-11 min-w-[44px]"
                  >
                    Essential Only
                  </Button>
                  <button
                    onClick={openSettings}
                    className="text-sm text-[rgba(250,247,242,0.5)] hover:text-[#C24516] hover:underline transition-all duration-150 inline-flex items-center gap-1 h-11"
                  >
                    Customize →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Cookie Preferences</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Essential */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white">Essential Cookies</label>
                <span className="text-xs text-zinc-500">(Required)</span>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={true}
                  disabled
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm text-zinc-400">
                    These keep the tool working and save your progress.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    vox.cookie-consent, vox.launch-kit-draft
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white">Analytics Cookies</label>
                <span className="text-xs text-zinc-500">(Optional)</span>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm text-zinc-400">
                    Help us improve the tool with anonymous usage data.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    _vercel_analytics, session tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white">Marketing Cookies</label>
                <span className="text-xs text-zinc-500">(Optional - none used)</span>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, marketing: checked })}
                  disabled
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm text-zinc-400">
                    Future: conversion tracking. Currently not used.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              California residents: We don't sell your personal information.
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <a
                href="/annexacookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#C24516] hover:underline"
              >
                Learn more
              </a>
              <Button
                onClick={handleSaveSettings}
                className="ml-auto bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to check if analytics is enabled
export function useAnalyticsConsent() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vox.cookie-consent');
    if (consent) {
      const prefs = JSON.parse(consent);
      setAnalyticsEnabled(prefs.analytics);
    }
  }, []);

  return analyticsEnabled;
}

// Function to open settings from anywhere
export function openCookieSettings() {
  // Trigger a custom event that the CookieConsent component listens to
  window.dispatchEvent(new CustomEvent('openCookieSettings'));
}
