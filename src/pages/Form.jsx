import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Trash2, Check, HelpCircle, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { base44 } from '@/api/base44Client';
import LivePreview from '@/components/LivePreview';
import PresetSelector, { presets } from '@/components/PresetSelector';
import CharacterBudget from '@/components/CharacterBudget';
import UpsellModal from '@/components/UpsellModal';
import ExitIntentModal from '@/components/ExitIntentModal';
import AIRefiner from '@/components/AIRefiner';
import DraftModal from '@/components/DraftModal';
import LegalBanner from '@/components/LegalBanner';
import { Checkbox } from '@/components/ui/checkbox';
import CookieConsent from '@/components/CookieConsent';
import JurisdictionNotice from '@/components/JurisdictionNotice';
import CompetitiveIntelligence from '@/components/CompetitiveIntelligence';
import { upgradeToEdge, getUserTier } from '@/lib/tierUtils';

export default function Form() {
  const navigate = useNavigate();
  const location = useLocation();
  const scanResults = location.state?.scanResults;
  const websiteUrl = location.state?.websiteUrl;
  const existingData = location.state?.formData;

  const [formData, setFormData] = useState({
    company_name: '',
    product_description: '',
    company_lead: '',
    country: '',
    contact_email: '',
    website_url: websiteUrl || '',
    cookie_level: 'analytics',
    services_used: '',
    preset: 'standard',
    // EDGE fields
    brand_positioning: '',
    key_competitors: '',
    target_pain_points: '',
    core_features: '',
    tone_preference: 'conversational',
    social_strategies: []
  });

  const [generating, setGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [customServices, setCustomServices] = useState('');
  const [customCookies, setCustomCookies] = useState('analytics');
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [generatedDocuments, setGeneratedDocuments] = useState(null);
  const [isEdge, setIsEdge] = useState(() => getUserTier() === 'edge');
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generationError, setGenerationError] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [jurisdiction, setJurisdiction] = useState(null);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [generationStage, setGenerationStage] = useState('');
  const [highlightedField, setHighlightedField] = useState(null);
  const [showDeleteDraftModal, setShowDeleteDraftModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [transformedIntroduction, setTransformedIntroduction] = useState(null);
  const [transforming, setTransforming] = useState(false);
  const [competitiveIntel, setCompetitiveIntel] = useState(null);
  const [showCompetitiveIntel, setShowCompetitiveIntel] = useState(false);

  useEffect(() => {
    // Detect user location
    const detectUserLocation = async () => {
      try {
        const response = await base44.functions.invoke('detectLocation', {});
        if (response.data.jurisdiction) {
          setJurisdiction(response.data.jurisdiction);
          setDetectedCountry(response.data.country);
        }
      } catch (err) {
        console.error('Failed to detect location:', err);
      }
    };
    detectUserLocation();

    // Check for resume link in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resume');
    const checkoutSessionId = urlParams.get('session_id') || urlParams.get('stripe_session_id');
    const checkoutStatus = urlParams.get('checkout');

    if (checkoutSessionId || checkoutStatus === 'success') {
      upgradeToEdge(checkoutSessionId || 'edge_' + Date.now());
      setIsEdge(true);
    }

    if (resumeId) {
      loadSavedProgress(resumeId);
    } else if (existingData) {
      setFormData(existingData);
      if (existingData.preset === 'custom') {
        setCustomServices(existingData.services_used || '');
        setCustomCookies(existingData.cookie_level || 'analytics');
      }
    } else if (scanResults?.prefilled) {
      setFormData(prev => ({
        ...prev,
        ...scanResults.prefilled
      }));
    } else {
      // Check for saved draft in localStorage
      const savedDraft = localStorage.getItem('vox-launch-kit-draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          const age = Date.now() - draft.timestamp;
          const sevenDays = 7 * 24 * 60 * 60 * 1000;

          if (age < sevenDays) {
            setDraftTimestamp(draft.timestamp);
            setShowDraftModal(true);
          } else {
            localStorage.removeItem('vox-launch-kit-draft');
            handlePresetChange('standard');
          }
        } catch (err) {
          localStorage.removeItem('vox-launch-kit-draft');
          handlePresetChange('standard');
        }
      } else {
        handlePresetChange('standard');
      }
    }
  }, [scanResults, existingData]);

  useEffect(() => {
    const syncTier = () => {
      setIsEdge(getUserTier() === 'edge');
    };

    syncTier();
    window.addEventListener('storage', syncTier);
    return () => window.removeEventListener('storage', syncTier);
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraft(formData);
        setLastSaved(Date.now());
      }

      // Cmd/Ctrl + Enter to move to next section
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const nextAction = getNextButtonAction();
        if (nextAction) {
          nextAction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, currentStep]);

  useEffect(() => {
    // Transform product description to privacy policy intro
    if (!formData.company_name || !formData.product_description) {
      setTransformedIntroduction(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setTransforming(true);
        const response = await base44.functions.invoke('transformProductDescription', {
          productName: formData.company_name,
          productDescription: formData.product_description
        });
        setTransformedIntroduction(response.data.introduction);
      } catch (err) {
        console.error('Failed to transform description:', err);
        // Fallback: use template
        setTransformedIntroduction(
          `${formData.company_name} ("we", "our", or "us") operates ${formData.product_description}. This Privacy Policy explains how we collect, use, and protect your information when you use our service.`
        );
      } finally {
        setTransforming(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [formData.company_name, formData.product_description]);

  useEffect(() => {
    // Exit intent detection - only after user has made real progress
    const handleMouseLeave = (e) => {
      // Check if mouse is leaving from top of viewport
      if (e.clientY <= 0) {
        const requiredFields = ['company_name', 'product_description', 'company_lead', 'country'];
        const filledFields = requiredFields.filter(key => formData[key]?.toString().trim()).length;
        const progressPercentage = Math.round((filledFields / requiredFields.length) * 100);
        const allFieldsFilled = isStep1Complete() && isStep2Complete() && isStep3Complete();
        const alreadyDismissed = sessionStorage.getItem('exitIntentDismissed') === 'true';

        // Only show if user has filled at least 3 required fields (60% progress) and hasn't completed everything
        if (filledFields >= 3 && progressPercentage >= 60 && !allFieldsFilled && !alreadyDismissed) {
          setShowExitIntent(true);
        }
      }
    };

    document.addEventListener('mouseout', handleMouseLeave);
    return () => document.removeEventListener('mouseout', handleMouseLeave);
  }, [formData]);

  useEffect(() => {
    if (showExitIntent) {
      const progress = calculateProgress();
      const totalCompleted = progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed;
      const totalFields = progress.foundation.fields.length + progress.legalBasics.fields.length + progress.contact.fields.length;
      base44.analytics.track({
        eventName: 'launch_kit_exit_intent_shown',
        properties: {
          completion_percentage: Math.round((totalCompleted / totalFields) * 100)
        }
      });
    }
  }, [showExitIntent]);

  const loadSavedProgress = async (uniqueId) => {
    try {
      const response = await base44.functions.invoke('loadProgress', { uniqueId });
      if (response.data.success) {
        setFormData(response.data.formData);
        if (response.data.formData.preset === 'custom') {
          setCustomServices(response.data.formData.services_used || '');
          setCustomCookies(response.data.formData.cookie_level || 'analytics');
        }
      }
    } catch (err) {
      console.error('Failed to load saved progress:', err);
    }
  };

  const validateField = (field, value) => {
    if (field === 'contact_email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Enter a valid email';
      }
    }
    if (field === 'product_description' && value) {
      if (value.trim().length < 50) {
        return `Add at least 50 characters (${value.trim().length}/50)`;
      }
    }
    const requiredFields = ['company_name', 'product_description', 'company_lead', 'country'];
    if (requiredFields.includes(field) && !value?.trim()) {
      return 'This field is required';
    }
    return null;
  };

  const handleChange = async (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    saveDraft(updated);

    // Auto-detect jurisdiction when country changes
    if (field === 'country' && value) {
      try {
        const response = await base44.functions.invoke('detectJurisdiction', { country: value });
        updated.jurisdiction = response.data.jurisdiction;
        setFormData(updated);
        saveDraft(updated);
      } catch (err) {
        console.error('Failed to detect jurisdiction:', err);
      }
    }

    // Clear error when user corrects field
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }

    // Track first field filled
    const requiredFields = ['company_name', 'product_description', 'company_lead', 'country'];
    const wasEmpty = requiredFields.every(f => !formData[f]?.trim());
    if (wasEmpty && value?.trim()) {
      base44.analytics.track({
        eventName: 'launch_kit_started',
        properties: { first_field: field }
      });
    }

    // Track field completion
    if (requiredFields.includes(field) && value?.trim() && !formData[field]?.trim()) {
      const filledCount = requiredFields.filter(f => (f === field ? value : formData[f])?.trim()).length;
      base44.analytics.track({
        eventName: 'launch_kit_field_completed',
        properties: {
          field,
          fields_filled: filledCount,
          completion_percentage: Math.round((filledCount / requiredFields.length) * 100)
        }
      });
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const saveDraft = (data) => {
    const draft = {
      formData: data,
      currentStep,
      customServices,
      customCookies,
      timestamp: Date.now()
    };
    localStorage.setItem('vox-launch-kit-draft', JSON.stringify(draft));
    setLastSaved(Date.now());
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('vox-launch-kit-draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setFormData(draft.formData);
      setCurrentStep(draft.currentStep || 1);
      setCustomServices(draft.customServices || '');
      setCustomCookies(draft.customCookies || 'analytics');
      setLastSaved(draft.timestamp);
    }
    setShowDraftModal(false);
  };

  const clearDraft = () => {
    setShowDeleteDraftModal(true);
  };

  const confirmDeleteDraft = () => {
    localStorage.removeItem('vox-launch-kit-draft');
    setFormData({
      company_name: '',
      product_description: '',
      company_lead: '',
      country: '',
      contact_email: '',
      website_url: websiteUrl || '',
      cookie_level: 'analytics',
      services_used: '',
      preset: 'standard',
      jurisdiction: ''
    });
    setCurrentStep(1);
    setCustomServices('');
    setCustomCookies('analytics');
    setLastSaved(null);
    handlePresetChange('standard');
    setShowDeleteDraftModal(false);
  };

  const startFresh = () => {
    localStorage.removeItem('vox-launch-kit-draft');
    setShowDraftModal(false);
    handlePresetChange('standard');
  };

  const handlePresetChange = (presetKey) => {
    const selectedPreset = presets[presetKey];
    const updated = {
      ...formData,
      preset: presetKey,
      services_used: selectedPreset.services,
      cookie_level: selectedPreset.cookies
    };
    setFormData(updated);
    saveDraft(updated);

    // Track preset selection
    base44.analytics.track({
      eventName: 'launch_kit_preset_selected',
      properties: { preset: presetKey }
    });
  };

  const handleCustomServicesChange = (value) => {
    setCustomServices(value);
    const updated = { ...formData, services_used: value };
    setFormData(updated);
    saveDraft(updated);
  };

  const handleCustomCookiesChange = (value) => {
    setCustomCookies(value);
    const updated = { ...formData, cookie_level: value };
    setFormData(updated);
    saveDraft(updated);
  };



  const isStep1Complete = () => {
    return formData.company_name?.trim() &&
      formData.product_description?.trim().length >= 50;
  };

  const isStep2Complete = () => {
    return formData.country?.trim() && formData.preset;
  };

  const isStep3Complete = () => {
    return formData.company_lead?.trim();
  };

  const calculateProgress = () => {
    const foundation = {
      fields: ['company_name', 'product_description'],
      completed: ['company_name', 'product_description'].filter(f => formData[f]?.trim()).length
    };
    const legalBasics = {
      fields: ['country', 'preset'],
      completed: ['country', 'preset'].filter(f => formData[f]?.trim()).length
    };
    const contact = {
      fields: ['company_lead'],
      completed: ['company_lead'].filter(f => formData[f]?.trim()).length
    };
    return { foundation, legalBasics, contact };
  };

  const validateForm = () => {
    const requiredFields = ['company_name', 'product_description', 'company_lead', 'country'];
    const newErrors = {};
    const newTouched = {};

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        newTouched[field] = true;
      }
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setGenerationStage('Preparing your documents...');

    try {
      base44.analytics.track({
        eventName: 'launch_kit_step_completed',
        properties: { step: 3 }
      });

      const response = await base44.functions.invoke('generateDocuments', {
        ...formData,
        competitiveIntel: competitiveIntel
      });
      // Store full response including documents, socialBios, and technicalFiles
      setGeneratedDocuments(response.data);

      const progress = calculateProgress();
      base44.analytics.track({
        eventName: 'launch_kit_generated',
        properties: {
          preset_used: formData.preset,
          fields_filled: progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed,
          completion_percentage: Math.round(((progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed) / (progress.foundation.fields.length + progress.legalBasics.fields.length + progress.contact.fields.length)) * 100)
        }
      });

      setGenerating(false);
      setShowUpsellModal(true);
    } catch (err) {
      setGenerationError(err.message || 'Something went wrong. Please try again.');
      base44.analytics.track({
        eventName: 'launch_kit_generation_failed',
        properties: { error: err.message }
      });
      setGenerating(false);
    }
  };

  const handleDownloadFree = () => {
    const persistedTier = getUserTier();
    const resolvedTier = persistedTier === 'edge' || isEdge ? 'edge' : 'free';

    base44.analytics.track({
      eventName: 'launch_kit_upsell_dismissed',
      properties: { tier: resolvedTier }
    });

    setShowUpsellModal(false);
    navigate('/preview', {
      state: {
        documents: generatedDocuments?.documents,
        socialBios: generatedDocuments?.socialBios,
        technicalFiles: generatedDocuments?.technicalFiles,
        competitiveIntel: competitiveIntel,
        formData: formData,
        tier: resolvedTier
      }
    });
  };

  const handleUpgrade = () => {
    base44.analytics.track({
      eventName: 'launch_kit_upsell_clicked',
      properties: { tier: 'free' }
    });

    // TODO: Implement Stripe payment
    // For now, persist tier to localStorage (survives page refresh)
    upgradeToEdge('placeholder_' + Date.now());

    setIsEdge(true);
    setShowUpsellModal(false);
    navigate('/preview', {
      state: {
        documents: generatedDocuments?.documents,
        socialBios: generatedDocuments?.socialBios,
        technicalFiles: generatedDocuments?.technicalFiles,
        competitiveIntel: competitiveIntel,
        formData: formData,
        tier: 'edge' // Backup in navigation state
      }
    });
  };

  const handleSaveProgress = async (email) => {
    const progress = calculateProgress();
    const totalCompleted = progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed;
    const totalFields = progress.foundation.fields.length + progress.legalBasics.fields.length + progress.contact.fields.length;
    const progressPercentage = Math.round((totalCompleted / totalFields) * 100);

    await base44.functions.invoke('saveProgress', {
      email,
      formData,
      progressPercentage
    });

    base44.analytics.track({
      eventName: 'launch_kit_exit_intent_submitted',
      properties: {
        completion_percentage: progressPercentage,
        fields_filled: totalCompleted
      }
    });

    sessionStorage.setItem('exitIntentDismissed', 'true');
  };

  const handleExitIntentDismiss = () => {
    const progress = calculateProgress();
    const totalCompleted = progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed;
    const totalFields = progress.foundation.fields.length + progress.legalBasics.fields.length + progress.contact.fields.length;

    base44.analytics.track({
      eventName: 'launch_kit_exit_intent_dismissed',
      properties: {
        completion_percentage: Math.round((totalCompleted / totalFields) * 100)
      }
    });

    setShowExitIntent(false);
  };

  const getNextButtonText = () => {
    if (currentStep === 1 && isStep1Complete()) return 'Continue to Legal Basics';
    if (currentStep === 2 && isStep2Complete()) return 'Continue to Contact';
    if (currentStep === 3 && isStep3Complete()) return 'Build My Launch Kit';
    return 'Continue';
  };

  const getNextButtonAction = () => {
    if (currentStep === 1 && isStep1Complete()) return () => {
      setCurrentStep(2);
      saveDraft(formData);
      base44.analytics.track({
        eventName: 'launch_kit_step_completed',
        properties: { step: 1 }
      });
    };
    if (currentStep === 2 && isStep2Complete()) return () => {
      setCurrentStep(3);
      saveDraft(formData);
      base44.analytics.track({
        eventName: 'launch_kit_step_completed',
        properties: { step: 2, preset_used: formData.preset }
      });
    };
    if (currentStep === 3 && isStep3Complete()) return handleSubmit;
    return null;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const nextAction = getNextButtonAction();
  const progress = calculateProgress();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-32 md:pb-12">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-400 hover:text-white mb-6 flex items-center text-sm"
      >
        ← Back to start
      </button>

      <LegalBanner />

      <JurisdictionNotice jurisdiction={jurisdiction} country={detectedCountry} />

      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
          <div className={currentStep >= 1 ? 'text-zinc-300' : ''}>
            Foundation <span className="text-zinc-500">({progress.foundation.completed}/{progress.foundation.fields.length})</span>
          </div>
          <span className="text-zinc-600">→</span>
          <div className={currentStep >= 2 ? 'text-zinc-300' : ''}>
            Legal Basics <span className="text-zinc-500">({progress.legalBasics.completed}/{progress.legalBasics.fields.length})</span>
          </div>
          <span className="text-zinc-600">→</span>
          <div className={currentStep >= 3 ? 'text-zinc-300' : ''}>
            Contact <span className="text-zinc-500">({progress.contact.completed}/{progress.contact.fields.length})</span>
          </div>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-11 gap-6 sm:gap-8">
        {/* LEFT PANE - Form */}
        <div className="lg:col-span-5 order-1">
          <div className="lg:sticky lg:top-6 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 sm:p-6 lg:max-w-[500px] max-h-[calc(100vh-3rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#C24516] [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] [scrollbar-color:#C24516_transparent]">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">Tell us about your product</h2>
              <div className="flex items-center gap-2">
                {lastSaved && (
                  <div className="flex items-center gap-1.5 text-xs text-green-500">
                    <Check className="w-3.5 h-3.5" />
                    <span>Draft auto-saved</span>
                  </div>
                )}
                <div className="relative group">
                  <button
                    onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Keyboard shortcuts"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  {showKeyboardHelp && (
                    <div className="absolute right-0 top-6 bg-[#09090B] border border-zinc-800 rounded-lg p-3 w-48 text-xs text-zinc-300 space-y-1.5 z-10 shadow-lg">
                      <div><span className="text-[#C24516] font-semibold">⌘ + S</span> Save draft</div>
                      <div><span className="text-[#C24516] font-semibold">⌘ + ↵</span> Next section</div>
                      <div className="text-zinc-500 text-[11px] pt-1.5 border-t border-zinc-800">Tab through fields</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[rgba(250,247,242,0.7)] text-sm mb-4 sm:mb-6 leading-relaxed">
              Foundation questions. These populate your Privacy Policy, Terms, and About page.
            </p>

            {scanResults?.found && scanResults.found.length > 0 && (
              <details className="mb-6 group">
                <summary className="cursor-pointer text-sm text-[rgba(250,247,242,0.7)] hover:text-[#faf7f2] transition-colors list-none flex items-center gap-2">
                  <span className="text-[#C24516]">▼</span>
                  <span>We found these existing files ({scanResults.found.length})</span>
                </summary>
                <div className="mt-3 pl-6 flex flex-wrap gap-2">
                  {scanResults.found.map((file, idx) => (
                    <React.Fragment key={file}>
                      <span className="text-xs text-[rgba(250,247,242,0.6)]">{file}</span>
                      {idx < scanResults.found.length - 1 && <span className="text-xs text-[rgba(250,247,242,0.3)]">•</span>}
                    </React.Fragment>
                  ))}
                </div>
              </details>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STEP 1 - Foundation */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#faf7f2] mb-1">Foundation</h3>
                  <p className="text-sm text-[rgba(250,247,242,0.5)]">Tell us what you're building</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-base sm:text-sm">What should we call your product? *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    onFocus={() => setHighlightedField('company_name')}
                    onBlur={() => {
                      handleBlur('company_name');
                      setHighlightedField(null);
                    }}
                    className={`bg-zinc-900 border-zinc-800 text-white text-base h-12 sm:h-10 ${errors.company_name && touched.company_name ? 'border-red-500' : ''
                      }`}
                    placeholder="TaskFlow"
                  />
                  {errors.company_name && touched.company_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white mb-2 block text-base sm:text-sm">Describe your product in one sentence *</Label>
                  <Textarea
                    value={formData.product_description}
                    onChange={(e) => handleChange('product_description', e.target.value)}
                    onBlur={() => handleBlur('product_description')}
                    className={`bg-zinc-900 border-zinc-800 text-white text-base min-h-[120px] sm:min-h-[80px] ${errors.product_description && touched.product_description ? 'border-red-500' : ''
                      }`}
                    placeholder="Project management for remote engineering teams. Async standup + PR tracking in one place."
                    rows={3}
                  />
                  {errors.product_description && touched.product_description && (
                    <p className="text-red-500 text-xs mt-1">{errors.product_description}</p>
                  )}
                  {formData.product_description && formData.product_description.length > 0 && formData.product_description.length < 50 && (
                    <p className="text-amber-500 text-xs mt-2">💡 Be more specific about what your product does. Example: "Project management for remote teams" not just "A productivity tool"</p>
                  )}
                  <AIRefiner
                    value={formData.product_description}
                    onSelect={(refinement) => handleChange('product_description', refinement)}
                    fieldName="product_description"
                  />
                  <CharacterBudget value={formData.product_description} min={50} ideal={150} />
                </div>

                {currentStep === 1 && !showCompetitiveIntel && (
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCompetitiveIntel(true);
                      saveDraft(formData);
                      base44.analytics.track({
                        eventName: 'launch_kit_step_completed',
                        properties: { step: 1 }
                      });
                    }}
                    disabled={!isStep1Complete()}
                    className={`w-full h-12 text-base transition-all ${isStep1Complete()
                        ? 'bg-[#C24516] hover:bg-[#a33912] text-white cursor-pointer'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {/* Competitive Intelligence Step */}
                {currentStep === 1 && showCompetitiveIntel && (
                  <div className="border-t border-zinc-700 pt-6 mt-6">
                    <CompetitiveIntelligence
                      formData={formData}
                      tier={isEdge ? 'edge' : 'free'}
                      onComplete={(intel) => {
                        setCompetitiveIntel(intel);
                        setCurrentStep(2);
                        base44.analytics.track({
                          eventName: 'competitive_intel_applied',
                          properties: { has_intel: true }
                        });
                      }}
                      onSkip={() => {
                        setCurrentStep(2);
                        base44.analytics.track({
                          eventName: 'competitive_intel_skipped',
                          properties: { tier: isEdge ? 'edge' : 'free' }
                        });
                      }}
                      onUpgrade={() => {
                        // TODO: Implement Stripe payment
                        upgradeToEdge('competitive_' + Date.now());
                        setIsEdge(true);
                        base44.analytics.track({
                          eventName: 'competitive_intel_edge_clicked',
                          properties: {}
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* STEP 2 - Legal Basics */}
              {currentStep >= 2 && (
                <div className="space-y-4 border-t border-zinc-700 pt-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#faf7f2] mb-1">Legal Basics</h3>
                    <p className="text-sm text-[rgba(250,247,242,0.5)]">Where and how you operate</p>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block text-base sm:text-sm">Where is your company based? *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      onBlur={() => handleBlur('country')}
                      className={`bg-zinc-900 border-zinc-800 text-white text-base h-12 sm:h-10 ${errors.country && touched.country ? 'border-red-500' : ''
                        }`}
                      placeholder="United States"
                    />
                    {errors.country && touched.country && (
                      <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                    )}
                    {formData.jurisdiction && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-800/50 border border-zinc-700 rounded px-3 py-2">
                        <Info className="w-3.5 h-3.5 text-[#C24516] flex-shrink-0" />
                        <span>
                          {formData.jurisdiction === 'eu' && 'GDPR compliance applies'}
                          {formData.jurisdiction === 'us' && 'CCPA compliance applies'}
                          {formData.jurisdiction === 'uk' && 'UK GDPR applies'}
                          {formData.jurisdiction === 'ca' && 'PIPEDA compliance applies'}
                          {formData.jurisdiction === 'au' && 'Australian Privacy Principles apply'}
                          {formData.jurisdiction === 'br' && 'LGPD compliance applies'}
                          {formData.jurisdiction === 'generic' && 'Using international privacy standards'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-white mb-3 block text-sm">Choose your stack</Label>
                    <PresetSelector
                      preset={formData.preset}
                      onPresetChange={handlePresetChange}
                      customServices={customServices}
                      onCustomServicesChange={handleCustomServicesChange}
                      customCookies={customCookies}
                      onCustomCookiesChange={handleCustomCookiesChange}
                    />
                  </div>

                  {isStep2Complete() && currentStep === 2 && (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12 text-base hidden md:flex"
                    >
                      Continue to Contact <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}

              {/* STEP 3 - Contact Details */}
              {currentStep >= 3 && (
                <div className="space-y-4 border-t border-zinc-700 pt-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#faf7f2] mb-1">Contact Details</h3>
                    <p className="text-sm text-[rgba(250,247,242,0.5)]">Final details</p>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block text-base sm:text-sm">Who's building this? *</Label>
                    <Input
                      value={formData.company_lead}
                      onChange={(e) => handleChange('company_lead', e.target.value)}
                      onBlur={() => handleBlur('company_lead')}
                      className={`bg-zinc-900 border-zinc-800 text-white text-base h-12 sm:h-10 ${errors.company_lead && touched.company_lead ? 'border-red-500' : ''
                        }`}
                      placeholder="Jane Doe, Founder"
                    />
                    {errors.company_lead && touched.company_lead && (
                      <p className="text-red-500 text-xs mt-1">{errors.company_lead}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white mb-2 block text-base sm:text-sm">Public support email (optional)</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      onBlur={() => handleBlur('contact_email')}
                      className={`bg-zinc-900 border-zinc-800 text-white text-base h-12 sm:h-10 ${errors.contact_email && touched.contact_email ? 'border-red-500' : ''
                        }`}
                      placeholder="hello@acme.com"
                    />
                    <p className="text-zinc-500 text-xs mt-1">Used in your generated docs if provided.</p>
                    {errors.contact_email && touched.contact_email && (
                      <p className="text-red-500 text-xs mt-1">{errors.contact_email}</p>
                    )}
                  </div>

                  {/* EDGE Fields Section */}
                  {isEdge && (
                    <div className="mt-6 pt-6 border-t border-zinc-700 space-y-4">
                      <div className="bg-[#C24516]/10 border border-[#C24516]/30 rounded-lg p-4 mb-4">
                        <p className="text-sm text-zinc-300">
                          <span className="text-[#C24516] font-semibold">EDGE:</span> Answer these to get competitive analysis and social bios
                        </p>
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Brand positioning (2-3 sentences)</Label>
                        <Textarea
                          value={formData.brand_positioning}
                          onChange={(e) => handleChange('brand_positioning', e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white text-base min-h-[80px]"
                          placeholder="How do you want to be perceived? What makes you different from alternatives?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Key competitors</Label>
                        <Input
                          value={formData.key_competitors}
                          onChange={(e) => handleChange('key_competitors', e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white text-base h-10"
                          placeholder="Notion, Airtable, Monday.com"
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Target audience pain points</Label>
                        <Textarea
                          value={formData.target_pain_points}
                          onChange={(e) => handleChange('target_pain_points', e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white text-base min-h-[80px]"
                          placeholder="What frustrates your users about current solutions?"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-2 block text-sm">Core features (3-5 bullet points)</Label>
                        <Textarea
                          value={formData.core_features}
                          onChange={(e) => handleChange('core_features', e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white text-base min-h-[100px]"
                          placeholder="- Real-time collaboration&#10;- Built-in version control&#10;- API integrations"
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label className="text-white mb-3 block text-sm">Tone preference</Label>
                        <RadioGroup
                          value={formData.tone_preference}
                          onValueChange={(value) => handleChange('tone_preference', value)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="professional" id="tone-professional" />
                              <Label
                                htmlFor="tone-professional"
                                className={`font-normal cursor-pointer ${formData.tone_preference === 'professional' ? 'text-[#C24516]' : 'text-zinc-300'}`}
                              >
                                Professional and formal
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="conversational" id="tone-conversational" />
                              <Label
                                htmlFor="tone-conversational"
                                className={`font-normal cursor-pointer ${formData.tone_preference === 'conversational' ? 'text-[#C24516]' : 'text-zinc-300'}`}
                              >
                                Conversational and friendly
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="technical" id="tone-technical" />
                              <Label
                                htmlFor="tone-technical"
                                className={`font-normal cursor-pointer ${formData.tone_preference === 'technical' ? 'text-[#C24516]' : 'text-zinc-300'}`}
                              >
                                Technical and precise
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label className="text-white mb-3 block text-sm">Social media strategy (select all that apply)</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="strategy-community"
                              checked={formData.social_strategies?.includes('community')}
                              onCheckedChange={(checked) => {
                                const current = formData.social_strategies || [];
                                const updated = checked
                                  ? [...current, 'community']
                                  : current.filter(s => s !== 'community');
                                handleChange('social_strategies', updated);
                              }}
                            />
                            <Label
                              htmlFor="strategy-community"
                              className={`font-normal cursor-pointer ${formData.social_strategies?.includes('community') ? 'text-[#C24516]' : 'text-zinc-300'}`}
                            >
                              Building community
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="strategy-launches"
                              checked={formData.social_strategies?.includes('launches')}
                              onCheckedChange={(checked) => {
                                const current = formData.social_strategies || [];
                                const updated = checked
                                  ? [...current, 'launches']
                                  : current.filter(s => s !== 'launches');
                                handleChange('social_strategies', updated);
                              }}
                            />
                            <Label
                              htmlFor="strategy-launches"
                              className={`font-normal cursor-pointer ${formData.social_strategies?.includes('launches') ? 'text-[#C24516]' : 'text-zinc-300'}`}
                            >
                              Announcing launches
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="strategy-updates"
                              checked={formData.social_strategies?.includes('updates')}
                              onCheckedChange={(checked) => {
                                const current = formData.social_strategies || [];
                                const updated = checked
                                  ? [...current, 'updates']
                                  : current.filter(s => s !== 'updates');
                                handleChange('social_strategies', updated);
                              }}
                            />
                            <Label
                              htmlFor="strategy-updates"
                              className={`font-normal cursor-pointer ${formData.social_strategies?.includes('updates') ? 'text-[#C24516]' : 'text-zinc-300'}`}
                            >
                              Sharing updates
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep >= 3 && isStep3Complete() && (
                <>
                  {generationError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mt-4">
                      <p className="text-red-500 text-sm mb-3">{generationError}</p>
                      <Button
                        type="submit"
                        disabled={generating}
                        variant="outline"
                        className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={generating}
                    className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12 mt-6 text-base hidden md:flex"
                  >
                    {generating ? (
                      <div className="flex flex-col items-center gap-1 w-full">
                        <div className="flex items-center">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>{generationStage || 'Building your documents...'}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        Build My Launch Kit ↓
                      </>
                    )}
                  </Button>
                </>
              )}

              {lastSaved && (
                <button
                  onClick={clearDraft}
                  className="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1 mt-4"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear draft
                </button>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT PANE - Live Preview */}
        <div className="lg:col-span-6 order-2">
          <LivePreview
            formData={formData}
            highlightedField={highlightedField}
            transformedIntroduction={transformedIntroduction}
          />
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      {nextAction && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-50">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Step {currentStep} of 3</span>
            <span>•</span>
            <span className="text-[#C24516]">
              {currentStep === 1 && `${progress.foundation.completed}/${progress.foundation.fields.length} complete`}
              {currentStep === 2 && `${progress.legalBasics.completed}/${progress.legalBasics.fields.length} complete`}
              {currentStep === 3 && `${progress.contact.completed}/${progress.contact.fields.length} complete`}
            </span>
          </div>
          <Button
            onClick={nextAction}
            disabled={generating}
            className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-14 text-base font-semibold"
          >
            {generating ? (
              <div className="flex flex-col items-center w-full">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="text-sm">{generationStage || 'Building...'}</span>
                </div>
              </div>
            ) : (
              <>
                {getNextButtonText()} <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      <UpsellModal
        open={showUpsellModal}
        onOpenChange={setShowUpsellModal}
        onDownloadFree={handleDownloadFree}
        onUpgrade={handleUpgrade}
        isEdge={isEdge}
        documents={generatedDocuments?.documents}
        socialBios={generatedDocuments?.socialBios}
        technicalFiles={generatedDocuments?.technicalFiles}
        competitiveIntel={competitiveIntel}
        formData={formData}
        tier={isEdge ? 'edge' : 'free'}
      />

      <ExitIntentModal
        open={showExitIntent}
        onOpenChange={handleExitIntentDismiss}
        formData={formData}
        progressPercentage={Math.round((progress.foundation.completed + progress.legalBasics.completed + progress.contact.completed) / (progress.foundation.fields.length + progress.legalBasics.fields.length + progress.contact.fields.length) * 100)}
        onSave={handleSaveProgress}
      />

      <DraftModal
        open={showDraftModal}
        onContinue={loadDraft}
        onStartFresh={startFresh}
        lastSaved={draftTimestamp}
      />

      {/* Delete Draft Confirmation Modal */}
      {showDeleteDraftModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-zinc-800 rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-[#faf7f2] mb-2">Delete your draft?</h3>
            <p className="text-sm text-[rgba(250,247,242,0.6)] mb-6">This will clear all progress and cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteDraftModal(false)}
                className="bg-white text-[#09090B] hover:bg-[#faf7f2] hover:border-[#C24516]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteDraft}
                className="bg-[#C24516] hover:bg-[#a33912] text-white"
              >
                Delete draft
              </Button>
            </div>
          </div>
        </div>
      )}

      <CookieConsent />
    </div>
  );
}
