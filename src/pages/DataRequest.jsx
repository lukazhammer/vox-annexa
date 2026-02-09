import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DataRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    requestType: 'access',
    details: '',
    verificationAnswer: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const requestTypes = [
    {
      value: 'access',
      label: 'Access my data',
      description: 'See what information we have about you'
    },
    {
      value: 'delete',
      label: 'Delete my data',
      description: 'Remove all your information from our systems'
    },
    {
      value: 'export',
      label: 'Export my data',
      description: 'Download a copy of your information'
    },
    {
      value: 'correct',
      label: 'Correct my data',
      description: 'Fix inaccurate information'
    },
    {
      value: 'object',
      label: 'Object to processing',
      description: 'Stop certain uses of your data'
    },
    {
      value: 'withdraw',
      label: 'Withdraw consent',
      description: 'Revoke permission for optional data uses'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await base44.functions.invoke('submitDataRequest', {
        email: formData.email,
        requestType: formData.requestType,
        details: formData.details,
        verificationAnswer: formData.verificationAnswer
      });

      base44.analytics.track({
        eventName: 'data_request_submitted',
        properties: { request_type: formData.requestType }
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
          <p className="text-zinc-300 mb-4">
            Check your email for confirmation. We'll process your request and contact you within the required timeframe.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="bg-[#C24516] hover:bg-[#a33912] text-white"
          >
            Back to Annexa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-400 hover:text-white mb-8 flex items-center text-sm"
      >
        ← Back to Annexa
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-[#C24516]" />
        <div>
          <h1 className="text-3xl font-bold text-white">Data Subject Request</h1>
          <p className="text-zinc-400">Exercise your privacy rights</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Request Type */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">What Would You Like To Do?</h2>
          <RadioGroup value={formData.requestType} onValueChange={(value) => setFormData({ ...formData, requestType: value })}>
            <div className="space-y-3">
              {requestTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={type.value} id={type.value} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">{type.label}</div>
                    <div className="text-sm text-zinc-400">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* User Information */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Your Information</h2>
          
          <div>
            <Label className="text-white mb-2 block">Email address *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="email@example.com"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">The email you used for the Launch Kit</p>
          </div>

          <div>
            <Label className="text-white mb-2 block">Additional details (optional)</Label>
            <Textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="Help us understand your request..."
              rows={4}
            />
          </div>
        </div>

        {/* Verification */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Verification</h2>
          <p className="text-sm text-zinc-400 mb-4">
            To protect your privacy, we need to verify your identity.
          </p>
          
          <div>
            <Label className="text-white mb-2 block">What was your product name? *</Label>
            <Input
              type="text"
              value={formData.verificationAnswer}
              onChange={(e) => setFormData({ ...formData, verificationAnswer: e.target.value })}
              className="bg-zinc-900 border-zinc-800 text-white"
              placeholder="Product name from your Launch Kit form"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">From the Launch Kit form you filled out</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#C24516] hover:bg-[#a33912] text-white h-12 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </Button>
      </form>

      {/* What Happens Next */}
      <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h3 className="font-bold text-white mb-3">What Happens Next</h3>
        <ol className="space-y-2 text-sm text-zinc-300">
          <li>1. We'll verify your identity (usually within 24 hours)</li>
          <li>2. We'll process your request (within 30 days for EU, 45 days for California)</li>
          <li>3. We'll email you when complete</li>
        </ol>
        <p className="text-xs text-zinc-500 mt-4">
          For complex requests, we may need additional information.
        </p>
      </div>

      {/* Contact */}
      <div className="mt-6 text-center text-sm text-zinc-400">
        <p>
          Questions about this process?{' '}
          <a href="mailto:privacy@vox-animus.com" className="text-[#C24516] hover:underline">
            privacy@vox-animus.com
          </a>
        </p>
        <p className="mt-1">
          Urgent requests:{' '}
          <a href="mailto:legal@vox-animus.com" className="text-[#C24516] hover:underline">
            legal@vox-animus.com
          </a>
        </p>
      </div>
    </div>
  );
}
