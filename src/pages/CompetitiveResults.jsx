import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CompetitiveRadarChart } from '@/components/competitive/CompetitiveRadarChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Check, Sparkles } from 'lucide-react';

export default function CompetitiveResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { result, formData, competitorUrl } = location.state || {};
    const [differentiators, setDifferentiators] = useState([]);

    // Redirect if accessed without data
    if (!result?.competitor || !formData) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <h2 className="font-serif text-2xl mb-4 text-zinc-100">No Analysis Data</h2>
                    <p className="text-zinc-400 mb-6">
                        Complete a competitive analysis to see your positioning map.
                    </p>
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-[#C24516] hover:bg-[#A03814] text-white"
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    const competitor = result.competitor;
    // Document list
    const documents = [
        'Privacy Policy (AI-enhanced)',
        'Terms of Service',
        'About Us',
        'Support',
        'sitemap.xml',
        'brand-schema.json',
        'robots.txt',
        'llms.txt (competitive)',
        'Social bios (3 platforms)'
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-400 hidden sm:inline">EDGE Analysis</span>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C24516]/10 border border-[#C24516]">
                            <div className="w-2 h-2 rounded-full bg-[#C24516]"></div>
                            <span className="text-xs font-semibold text-[#C24516]">EDGE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Sidebar - Documents & Stats (1/3 width) */}
                    <aside className="lg:col-span-1 space-y-6">
                        {/* Documents Section */}
                        <div className="border-2 border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
                            <h3 className="font-serif text-xl mb-4">Your Launch Kit</h3>
                            <p className="text-sm text-zinc-400 mb-4">
                                {documents.length} documents generated
                            </p>

                            <div className="space-y-2 mb-6">
                                {documents.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        <span className="text-zinc-300">{doc}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full bg-[#C24516] hover:bg-[#A03814] text-white"
                                onClick={() => navigate('/preview', { state: location.state })}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                View & Download All
                            </Button>
                        </div>

                        {/* Intelligence Summary */}
                        <div className="border-2 border-[#C24516] rounded-lg p-6 bg-zinc-900/30">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-[#C24516]" />
                                <h3 className="font-serif text-xl text-[#C24516]">Intelligence Applied</h3>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-zinc-500 mb-1">Search terms generated:</div>
                                    <div className="text-2xl font-bold text-zinc-100">
                                        {result.searchTerms?.length || 0}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-zinc-500 mb-1">Recommendation scenarios:</div>
                                    <div className="text-2xl font-bold text-zinc-100">
                                        {(result.recommendations?.recommend_when?.length || 0) +
                                            (result.recommendations?.do_not_recommend_when?.length || 0)}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800">
                                    <div className="text-zinc-400 text-xs mb-2">Enhanced outputs include:</div>
                                    <ul className="space-y-1">
                                        {[
                                            'llms.txt with AI recommendation rules',
                                            'brand-schema.json with competitive data',
                                            'Contextual search terms throughout',
                                            'Differentiation positioning'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                                                <span className="text-[#C24516]">✓</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Right Column - Radar Chart Hero (2/3 width) */}
                    <section className="lg:col-span-2">
                        <div className="border-2 border-[#C24516] rounded-lg p-6 sm:p-8 bg-zinc-900/30">
                            <div className="mb-6">
                                <h2 className="font-serif text-2xl sm:text-3xl mb-2">
                                    Competitive Positioning Map
                                </h2>
                                <p className="text-zinc-400">
                                    Visual comparison of{' '}
                                    <span className="text-blue-400 font-semibold">
                                        {formData.company_name || 'your product'}
                                    </span>{' '}
                                    vs{' '}
                                    <span className="text-pink-400 font-semibold">
                                        {competitor.productName}
                                    </span>{' '}
                                    across key market dimensions.
                                </p>
                            </div>

                            <CompetitiveRadarChart
                                userProduct={{
                                    name: formData.company_name || 'Your Product',
                                    description: formData.product_description,
                                    targetPersona: formData.target_audience,
                                }}
                                competitor={{
                                    name: competitor.productName,
                                    url: competitorUrl || competitor.url,
                                    description: competitor.positioning,
                                    scrapedContent: competitor.description || competitor.positioning,
                                }}
                                onDifferentiatorAdd={(diff) => {
                                    setDifferentiators([...differentiators, diff]);
                                }}
                            />

                            {/* Usage Instructions */}
                            <div className="mt-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                                <p className="text-sm text-zinc-400">
                                    <strong className="text-zinc-100">How to use this chart:</strong>{' '}
                                    The radar chart shows your competitive position across AI-generated
                                    market dimensions. Add differentiators to see how your positioning
                                    shifts. Larger coverage = stronger position in that dimension.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 text-center">
                    <Button
                        onClick={() => navigate('/preview', { state: location.state })}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-8"
                    >
                        Continue to Document Preview
                    </Button>
                </div>
            </main>
        </div>
    );
}
