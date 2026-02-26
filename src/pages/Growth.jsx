import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const bottleneckInfo = {
    acquisition: {
        title: 'Acquisition',
        description: 'Getting people to your site or app',
        symptom: 'Traffic but no signups',
    },
    activation: {
        title: 'Activation',
        description: 'Getting signups to their first win',
        symptom: 'Signups but no engagement',
    },
    retention: {
        title: 'Retention',
        description: 'Keeping users coming back',
        symptom: 'Active users going quiet',
    },
    referral: {
        title: 'Referral',
        description: 'Getting users to bring others',
        symptom: 'Happy users but no word of mouth',
    },
};

export default function Growth() {
    const urlParams = new URLSearchParams(window.location.search);
    const bottleneckParam = urlParams.get('bottleneck') || 'activation';
    const bottleneck = bottleneckInfo[bottleneckParam] || bottleneckInfo.activation;

    const [productName, setProductName] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [currentSituation, setCurrentSituation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sprintData, setSprintData] = useState(null);
    const [copied, setCopied] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await base44.functions.invoke('generateGrowthSprint', {
                productDescription: `${productName}: ${productDescription}`,
                currentState: currentSituation,
                bottleneck: bottleneckParam
            });

            if (response.data.success) {
                setSprintData(response.data);
            } else {
                setError(response.data.error || 'Failed to generate sprint');
            }
        } catch (err) {
            console.error('Sprint generation error:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied({ ...copied, [key]: true });
        setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    };

    const CopyButton = ({ text, copyKey }) => (
        <button
            onClick={() => copyToClipboard(text, copyKey)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[rgba(26,26,26,0.05)] border border-[rgba(26,26,26,0.15)]"
            title="Copy to clipboard"
            style={{ fontFamily: "'Poppins', sans-serif" }}
        >
            {copied[copyKey] ? (
                <>
                    <Check className="w-3.5 h-3.5 text-[#5a8952]" />
                    <span className="text-[#5a8952]">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5 text-[rgba(26,26,26,0.6)]" />
                    <span className="text-[rgba(26,26,26,0.6)]">Copy</span>
                </>
            )}
        </button>
    );

    // Sprint results view
    if (sprintData) {
        const { diagnosis, experiment, nextMoves, experimentId } = sprintData;

        return (
            <div className="min-h-screen bg-[#faf7f2]">
                {/* Navigation */}
                <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                    <a href="/" className="text-2xl text-[#1a1a1a]" style={{ fontFamily: "'Caudex', serif" }}>
                        Annexa<span className="text-[#A03814]">.</span>
                    </a>
                    <div className="flex items-center gap-6">
                        <a
                            href="/#demo"
                            className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            See it work
                        </a>
                        <a
                            href="/#pricing"
                            className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            Pricing
                        </a>
                    </div>
                </nav>

                <div className="max-w-3xl mx-auto px-6 py-12">
                    {/* Top navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            to={createPageUrl('Home')}
                            className="inline-flex items-center text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors"
                            style={{ fontFamily: "'Poppins', sans-serif" }}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to home
                        </Link>
                        <Button
                            onClick={() => setSprintData(null)}
                            variant="outline"
                            size="sm"
                            className="border-[rgba(26,26,26,0.2)] text-[#1a1a1a]"
                        >
                            New sprint
                        </Button>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {experimentId}
                        </p>
                        <h1 className="text-3xl text-[#1a1a1a] mb-2" style={{ fontFamily: "'Caudex', serif" }}>
                            {experiment.title}
                        </h1>
                        <p className="text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            {bottleneck.title} experiment
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#A03814]/10 rounded-full">
                            <span className="text-sm text-[#A03814] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                Run for {experiment.durationDays} days, then report results
                            </span>
                        </div>
                    </div>

                    {/* Diagnosis Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    Diagnosis
                                </p>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    diagnosis.confidence === 'high' ? 'bg-[#5a8952]/10 text-[#5a8952]' :
                                    diagnosis.confidence === 'medium' ? 'bg-[#A03814]/10 text-[#A03814]' :
                                    'bg-[rgba(26,26,26,0.1)] text-[rgba(26,26,26,0.7)]'
                                }`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {diagnosis.confidence} confidence
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-medium text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                {diagnosis.primaryIssue}
                            </p>
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                {diagnosis.reasoning}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Hypothesis Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                Hypothesis
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-[#1a1a1a] italic" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    "{experiment.hypothesis}"
                                </p>
                                <CopyButton text={experiment.hypothesis} copyKey="hypothesis" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Variant Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    Your experiment
                                </p>
                                <span className="text-xs px-2 py-1 rounded bg-[#A03814]/10 text-[#A03814]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {experiment.variant.type}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-[#f5f0ea] rounded-lg p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-[#1a1a1a] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                        {experiment.variant.content}
                                    </p>
                                    <CopyButton text={experiment.variant.content} copyKey="variant" />
                                </div>
                            </div>
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                <span className="font-medium">Where to use:</span> {experiment.variant.context}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Implementation Prompt Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                Implementation prompt
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-[#1a1a1a] rounded-lg p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <pre className="text-sm text-[#faf7f2] whitespace-pre-wrap" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                        {experiment.implementationPrompt}
                                    </pre>
                                    <button
                                        onClick={() => copyToClipboard(experiment.implementationPrompt, 'prompt')}
                                        className="p-1.5 rounded hover:bg-[rgba(250,247,242,0.1)] transition-colors flex-shrink-0"
                                        title="Copy to clipboard"
                                    >
                                        {copied.prompt ? (
                                            <Check className="w-4 h-4 text-[#5a8952]" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-[rgba(250,247,242,0.5)]" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Metric Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                Success metric
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-[#1a1a1a] font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    {experiment.successMetric}
                                </p>
                                <CopyButton text={experiment.successMetric} copyKey="metric" />
                            </div>
                            <hr className="border-[rgba(26,26,26,0.08)]" />
                            <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                <span className="font-medium">How to measure:</span> {experiment.measurementPlan}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Next Moves Card */}
                    <Card className="bg-white border-[rgba(26,26,26,0.12)] mb-6">
                        <CardHeader className="pb-2">
                            <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.5)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                What to do next
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="text-lg">📈</span>
                                <div>
                                    <p className="text-sm font-medium text-[#5a8952]" style={{ fontFamily: "'Poppins', sans-serif" }}>If improved</p>
                                    <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>{nextMoves.ifImproved}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg">➡️</span>
                                <div>
                                    <p className="text-sm font-medium text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>If no change</p>
                                    <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>{nextMoves.ifNoChange}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg">📉</span>
                                <div>
                                    <p className="text-sm font-medium text-[#A03814]" style={{ fontFamily: "'Poppins', sans-serif" }}>If worsened</p>
                                    <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>{nextMoves.ifWorsened}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Results CTA */}
                    <div className="bg-[#f5f0ea] rounded-lg p-6 text-center">
                        <p className="text-sm text-[rgba(26,26,26,0.7)] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Run this experiment for {experiment.durationDays} days. When it's done, report your results to get your next sprint.
                        </p>
                        <Button
                            onClick={() => alert('Coming soon! Report results feature is under development.')}
                            className="bg-[#A03814] hover:bg-[#8a2f11] text-white px-8"
                        >
                            Report Results
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f2]">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
                <a href="/" className="text-2xl text-[#1a1a1a]" style={{ fontFamily: "'Caudex', serif" }}>
                    Annexa<span className="text-[#A03814]">.</span>
                </a>
                <div className="flex items-center gap-6">
                    <a
                        href="/#demo"
                        className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        See it work
                    </a>
                    <a
                        href="/#pricing"
                        className="text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] transition-colors duration-150"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        Pricing
                    </a>
                </div>
            </nav>

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Back link */}
                <Link
                    to={createPageUrl('Home')}
                    className="inline-flex items-center text-sm text-[rgba(26,26,26,0.7)] hover:text-[#1a1a1a] mb-8 transition-colors"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to home
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-wider text-[rgba(26,26,26,0.7)] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Growth Sprint
                    </p>
                    <h1 className="text-3xl text-[#1a1a1a] mb-2" style={{ fontFamily: "'Caudex', serif" }}>
                        {bottleneck.title}
                    </h1>
                    <p className="text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        {bottleneck.description} — "{bottleneck.symptom}"
                    </p>
                </div>

                {/* Form */}
                <Card className="bg-white border-[rgba(26,26,26,0.12)]">
                    <CardHeader className="pb-2">
                        <p className="text-sm text-[rgba(26,26,26,0.7)]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            Tell us about your product so we can create a targeted experiment.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Product name
                                </label>
                                <Input
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="e.g. HabitFlow"
                                    required
                                    disabled={loading}
                                    className="border-[rgba(26,26,26,0.2)] focus:border-[#A03814] focus:ring-[#A03814]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    What does your product do?
                                </label>
                                <Textarea
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    placeholder="e.g. A habit tracking app that helps people build daily routines through gentle reminders and streak tracking."
                                    required
                                    disabled={loading}
                                    rows={3}
                                    className="border-[rgba(26,26,26,0.2)] focus:border-[#A03814] focus:ring-[#A03814]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#1a1a1a] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                    Current situation with {bottleneck.title.toLowerCase()}
                                </label>
                                <Textarea
                                    value={currentSituation}
                                    onChange={(e) => setCurrentSituation(e.target.value)}
                                    placeholder={`e.g. We're getting about 100 signups per week but only 10% complete onboarding. Most drop off after the first screen.`}
                                    required
                                    disabled={loading}
                                    rows={4}
                                    className="border-[rgba(26,26,26,0.2)] focus:border-[#A03814] focus:ring-[#A03814]"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#A03814] hover:bg-[#8a2f11] text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating your sprint...
                                    </>
                                ) : (
                                    'Generate my sprint'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Change bottleneck */}
                <p className="text-center text-sm text-[rgba(26,26,26,0.7)] mt-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    Wrong bottleneck?{' '}
                    <Link to={createPageUrl('Home') + '#selector'} className="text-[#A03814] hover:underline">
                        Pick a different one
                    </Link>
                </p>
            </div>
        </div>
    );
}