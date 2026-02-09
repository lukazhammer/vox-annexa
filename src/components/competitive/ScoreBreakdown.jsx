import React from 'react';

export function ScoreBreakdown({ axes, scores }) {
    if (!axes || axes.length === 0) return null;

    return (
        <div className="border-2 border-zinc-800 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800">
                <h3 className="font-serif text-lg">Score Breakdown</h3>
                <p className="text-zinc-500 text-xs mt-0.5">Percentile scores across market dimensions (0-100)</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-900/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Dimension</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-[#C24516] w-24">You</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-400 w-24">Competitor</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-400 w-24">Gap</th>
                        </tr>
                    </thead>
                    <tbody>
                        {axes.map((axis, i) => {
                            const userScore = scores.user[i] || 0;
                            const competitorScore = scores.competitor[i] || 0;
                            const gap = userScore - competitorScore;

                            return (
                                <tr
                                    key={axis.id}
                                    className="border-t border-zinc-800 hover:bg-zinc-900/30 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium text-zinc-100">{axis.name}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5 max-w-xs">{axis.description}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[#C24516] font-semibold text-lg">{userScore}</span>
                                            <ScoreBar score={userScore} variant="accent" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-zinc-400 font-semibold text-lg">{competitorScore}</span>
                                            <ScoreBar score={competitorScore} variant="muted" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`font-semibold ${gap > 0 ? 'text-green-400' : gap < 0 ? 'text-red-400' : 'text-zinc-500'
                                                }`}
                                        >
                                            {gap > 0 ? '+' : ''}{gap}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary row */}
            <div className="bg-zinc-900/50 px-4 py-3 border-t border-zinc-800">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Average Scores</span>
                    <div className="flex gap-6">
                        <span className="text-[#C24516]">
                            You: {Math.round(scores.user.reduce((a, b) => a + b, 0) / scores.user.length) || 0}
                        </span>
                        <span className="text-zinc-400">
                            Competitor: {Math.round(scores.competitor.reduce((a, b) => a + b, 0) / scores.competitor.length) || 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mini score bar visualization
function ScoreBar({ score, variant }) {
    const barClass = variant === 'accent' ? 'bg-[#C24516]' : 'bg-zinc-500';

    return (
        <div className="w-14 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
            <div
                className={`h-full ${barClass} rounded-full transition-all duration-500`}
                style={{ width: `${score}%` }}
            />
        </div>
    );
}

export default ScoreBreakdown;
