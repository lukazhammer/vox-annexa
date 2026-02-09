import React from 'react';
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

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Static radar chart for the post-payment CompetitiveResults page.
 * Renders pre-generated axes and scores (no API calls).
 */
export function PostPaymentRadarChart({
  axes,
  userScores,
  competitorScores,
  userName,
  competitorName,
}) {
  const chartData = {
    labels: axes.map(axis => axis.name),
    datasets: [
      {
        label: competitorName || 'Competitor',
        data: competitorScores,
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(236, 72, 153, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(236, 72, 153, 1)',
      },
      {
        label: userName || 'Your Business',
        data: userScores,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          display: false,
        },
        pointLabels: {
          font: {
            size: 13,
            family: 'Poppins, sans-serif',
          },
          color: '#a1a1aa',
        },
        grid: {
          color: 'rgba(161, 161, 170, 0.1)',
        },
        angleLines: {
          color: 'rgba(161, 161, 170, 0.1)',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: 'Poppins, sans-serif',
          },
          color: '#fafafa',
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(63, 63, 70, 0.5)',
        borderWidth: 1,
        padding: 12,
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
            return axes[axisIndex]?.description || '';
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="relative h-96 bg-zinc-950 rounded-lg p-6">
        <Radar data={chartData} options={chartOptions} />
      </div>

      {/* Score breakdown table */}
      <div className="border-2 border-zinc-800 rounded-lg overflow-hidden">
        <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800">
          <h3 className="font-serif text-lg text-white">Score Breakdown</h3>
          <p className="text-zinc-500 text-xs mt-0.5">Percentile scores across market dimensions (0-100)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-400">Dimension</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-pink-400 w-24">{competitorName || 'Competitor'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-blue-400 w-24">{userName || 'You'}</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-zinc-400 w-24">Gap</th>
              </tr>
            </thead>
            <tbody>
              {axes.map((axis, i) => {
                const userScore = userScores[i] || 0;
                const compScore = competitorScores[i] || 0;
                const gap = userScore - compScore;

                return (
                  <tr
                    key={axis.id || i}
                    className="border-t border-zinc-800 hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100">{axis.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 max-w-xs">{axis.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-pink-400 font-semibold text-lg">{compScore}</span>
                        <div className="w-14 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-pink-500 rounded-full transition-all duration-500"
                            style={{ width: `${compScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-blue-400 font-semibold text-lg">{userScore}</span>
                        <div className="w-14 h-1.5 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${userScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold ${gap > 0 ? 'text-green-400' : gap < 0 ? 'text-red-400' : 'text-zinc-500'}`}
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
              <span className="text-pink-400">
                {competitorName || 'Competitor'}: {Math.round(competitorScores.reduce((a, b) => a + b, 0) / competitorScores.length) || 0}
              </span>
              <span className="text-blue-400">
                {userName || 'You'}: {Math.round(userScores.reduce((a, b) => a + b, 0) / userScores.length) || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostPaymentRadarChart;
