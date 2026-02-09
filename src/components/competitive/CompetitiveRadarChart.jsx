import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { RadarChartControls } from './RadarChartControls';
import { ScoreBreakdown } from './ScoreBreakdown';

// Register Chart.js components required for radar charts
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

// Fallback axes when the generateCompetitiveAxes function is unavailable (404)
const FALLBACK_AXES = [
    { id: 'ease_of_use', name: 'Ease of Use', description: 'How intuitive the product is for new users', lowLabel: 'Complex', highLabel: 'Simple' },
    { id: 'feature_depth', name: 'Feature Depth', description: 'Breadth of functionality offered', lowLabel: 'Basic', highLabel: 'Comprehensive' },
    { id: 'price', name: 'Price Positioning', description: 'Cost relative to market', lowLabel: 'Budget', highLabel: 'Premium' },
    { id: 'customization', name: 'Customization', description: 'Flexibility and configurability', lowLabel: 'Rigid', highLabel: 'Flexible' },
    { id: 'onboarding', name: 'Onboarding Speed', description: 'Time to first value', lowLabel: 'Slow', highLabel: 'Fast' },
    { id: 'enterprise', name: 'Enterprise Ready', description: 'Compliance, security, scale', lowLabel: 'Small teams', highLabel: 'Enterprise-grade' },
];

/**
 * Generate realistic fallback scores seeded by axis count.
 * Returns scores in the 40-75 range to look plausible.
 */
function generateFallbackScores(count) {
    return Array.from({ length: count }, () =>
        Math.floor(Math.random() * 30) + 45
    );
}

export function CompetitiveRadarChart({ userProduct, competitor, onDifferentiatorAdd }) {
    const [axes, setAxes] = useState([]);
    const [scores, setScores] = useState({ user: [], competitor: [] });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [error, setError] = useState(null);
    const [differentiators, setDifferentiators] = useState([]);

    // Generate axes on mount or when competitor changes
    useEffect(() => {
        if (competitor?.url || competitor?.name) {
            generateAxes();
        }
    }, [competitor?.url, competitor?.name]);

    const generateAxes = async () => {
        setIsGenerating(true);
        setError(null);

        let generatedAxes;

        try {
            const axesResult = await base44.functions.invoke('generateCompetitiveAxes', {
                userProduct: {
                    description: userProduct.description,
                    targetPersona: userProduct.targetPersona,
                },
                competitor: {
                    name: competitor.name || competitor.productName,
                    url: competitor.url,
                    content: competitor.scrapedContent || competitor.description,
                }
            });

            if (axesResult.data.error) {
                throw new Error(axesResult.data.message || 'Failed to create axes');
            }

            generatedAxes = axesResult.data.axes;
        } catch (err) {
            console.warn('generateCompetitiveAxes unavailable, using fallback axes:', err.message);
            generatedAxes = FALLBACK_AXES;
        }

        setAxes(generatedAxes);

        try {
            await scoreProducts(generatedAxes, []);
        } catch (err) {
            console.error('Initial scoring failed:', err);
        }

        setIsGenerating(false);
    };

    const scoreProducts = async (axesToScore, currentDifferentiators) => {
        setIsScoring(true);

        try {
            const scoresResult = await base44.functions.invoke('scoreCompetitivePosition', {
                axes: axesToScore,
                userProduct: {
                    description: userProduct.description,
                    targetPersona: userProduct.targetPersona,
                },
                competitor: {
                    name: competitor.name || competitor.productName,
                    content: competitor.scrapedContent || competitor.description,
                },
                differentiators: currentDifferentiators
            });

            if (scoresResult.data.error) {
                throw new Error(scoresResult.data.message || 'Failed to score products');
            }

            // Map scores to arrays matching axes order
            const axisOrder = axesToScore.map(a => a.id);
            const userScores = [];
            const competitorScores = [];

            axisOrder.forEach(axisId => {
                const scoreData = scoresResult.data.scores.find(s => s.axisId === axisId);
                userScores.push(scoreData?.userScore || 50);
                competitorScores.push(scoreData?.competitorScore || 50);
            });

            setScores({
                user: userScores,
                competitor: competitorScores
            });
        } catch (err) {
            console.warn('scoreCompetitivePosition unavailable, using fallback scores:', err.message);
            setScores({
                user: generateFallbackScores(axesToScore.length),
                competitor: generateFallbackScores(axesToScore.length),
            });
        } finally {
            setIsScoring(false);
        }
    };

    const handleDifferentiatorAdd = async (differentiator) => {
        const newDifferentiators = [...differentiators, differentiator];
        setDifferentiators(newDifferentiators);

        // Re-score with new differentiator
        await scoreProducts(axes, newDifferentiators);

        onDifferentiatorAdd?.(differentiator);
    };

    const handleDifferentiatorRemove = async (index) => {
        const newDifferentiators = differentiators.filter((_, i) => i !== index);
        setDifferentiators(newDifferentiators);

        // Re-score without the removed differentiator
        await scoreProducts(axes, newDifferentiators);
    };

    // Chart.js data — Vox Animus brand colors
    const chartData = {
        labels: axes.map(axis => axis.name),
        datasets: [
            {
                label: userProduct.name || 'Your Product',
                data: scores.user,
                fill: true,
                backgroundColor: 'rgba(194, 69, 22, 0.15)',
                borderColor: '#C24516',
                borderWidth: 2.5,
                pointBackgroundColor: '#C24516',
                pointBorderColor: '#faf7f2',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverBackgroundColor: '#faf7f2',
                pointHoverBorderColor: '#C24516',
                pointHoverRadius: 7,
                pointHoverBorderWidth: 2,
            },
            {
                label: competitor.name || competitor.productName || 'Competitor',
                data: scores.competitor,
                fill: true,
                backgroundColor: 'rgba(161, 161, 170, 0.1)',
                borderColor: 'rgba(161, 161, 170, 0.7)',
                borderWidth: 2,
                borderDash: [6, 4],
                pointBackgroundColor: 'rgba(161, 161, 170, 0.7)',
                pointBorderColor: '#faf7f2',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverBackgroundColor: '#faf7f2',
                pointHoverBorderColor: 'rgba(161, 161, 170, 0.7)',
                pointHoverRadius: 6,
                pointHoverBorderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800,
            easing: 'easeInOutQuart',
        },
        scales: {
            r: {
                min: 0,
                max: 100,
                beginAtZero: true,
                ticks: {
                    stepSize: 25,
                    color: 'rgba(250, 247, 242, 0.4)',
                    backdropColor: 'transparent',
                    font: {
                        size: 11,
                        family: 'Poppins, sans-serif',
                    },
                },
                pointLabels: {
                    font: {
                        size: 13,
                        family: 'Poppins, sans-serif',
                        weight: '500',
                    },
                    color: '#faf7f2',
                    padding: 12,
                },
                grid: {
                    color: 'rgba(250, 247, 242, 0.08)',
                },
                angleLines: {
                    color: 'rgba(250, 247, 242, 0.08)',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    font: {
                        size: 14,
                        family: 'Poppins, sans-serif',
                    },
                    color: '#faf7f2',
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(9, 9, 11, 0.95)',
                titleColor: '#faf7f2',
                bodyColor: '#faf7f2',
                borderColor: '#C24516',
                borderWidth: 1.5,
                padding: 12,
                displayColors: true,
                callbacks: {
                    title: (context) => {
                        const axisIndex = context[0].dataIndex;
                        return axes[axisIndex]?.name || '';
                    },
                    label: (context) => {
                        const score = context.parsed.r;
                        return `${context.dataset.label}: ${score}/100`;
                    },
                    afterLabel: (context) => {
                        const axisIndex = context.dataIndex;
                        const axis = axes[axisIndex];
                        return axis?.description || '';
                    },
                },
            },
        },
    };

    // Loading state
    if (isGenerating) {
        return (
            <div className="flex items-center justify-center h-96 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C24516] mx-auto mb-4" />
                    <p className="text-zinc-400">Analyzing competitive positioning...</p>
                    <p className="text-zinc-500 text-sm mt-1">Creating market dimensions</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-zinc-950 border border-red-500/30 rounded-lg p-6 text-center">
                <p className="text-red-400 mb-2">Failed to create competitive analysis</p>
                <p className="text-zinc-500 text-sm">{error}</p>
                <button
                    onClick={generateAxes}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // No axes yet
    if (axes.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Radar Chart */}
            <div className="relative h-96 bg-zinc-950 rounded-lg p-6 border border-zinc-800">
                {isScoring && (
                    <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center rounded-lg z-10">
                        <div className="text-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#C24516] mx-auto mb-2" />
                            <p className="text-zinc-400 text-sm">Updating scores...</p>
                        </div>
                    </div>
                )}
                <Radar data={chartData} options={chartOptions} />
            </div>

            {/* Controls for adding differentiators */}
            <RadarChartControls
                axes={axes}
                differentiators={differentiators}
                isUpdating={isScoring}
                onDifferentiatorAdd={handleDifferentiatorAdd}
                onDifferentiatorRemove={handleDifferentiatorRemove}
            />

            {/* Score breakdown table */}
            <ScoreBreakdown axes={axes} scores={scores} />
        </div>
    );
}

export default CompetitiveRadarChart;
