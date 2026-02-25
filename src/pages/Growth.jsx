import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
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
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#faf7f2] px-6 py-12">
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-white border-[rgba(26,26,26,0.12)]">
                        <CardContent className="p-8 text-center">
                            <p className="text-4xl mb-4">🚀</p>
                            <h2 className="text-2xl text-[#1a1a1a] mb-4" style={{ fontFamily: "'Caudex', serif" }}>
                                Sprint generation coming soon
                            </h2>
                            <p className="text-[rgba(26,26,26,0.7)] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                We're building your {bottleneck.title.toLowerCase()} sprint for <strong>{productName}</strong>.
                                This feature will be connected shortly.
                            </p>
                            <div className="bg-[#f5f0ea] rounded-lg p-4 text-left text-sm text-[rgba(26,26,26,0.7)] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                                <p className="font-semibold text-[#1a1a1a] mb-2">What you submitted:</p>
                                <p><strong>Bottleneck:</strong> {bottleneck.title}</p>
                                <p><strong>Product:</strong> {productName}</p>
                                <p><strong>Description:</strong> {productDescription}</p>
                                <p><strong>Current situation:</strong> {currentSituation}</p>
                            </div>
                            <Link to={createPageUrl('Home')}>
                                <Button
                                    variant="outline"
                                    className="border-[rgba(26,26,26,0.2)] text-[#1a1a1a]"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to home
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf7f2] px-6 py-12">
            <div className="max-w-2xl mx-auto">
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
                                    rows={4}
                                    className="border-[rgba(26,26,26,0.2)] focus:border-[#A03814] focus:ring-[#A03814]"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-[#A03814] hover:bg-[#8a2f11] text-white"
                            >
                                Generate my sprint
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