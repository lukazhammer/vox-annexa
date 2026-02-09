import React, { useMemo } from 'react';
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
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// Color palette for competitors (muted tones to contrast with accent)
const COMPETITOR_COLORS = [
  { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.8)' },
  { bg: 'rgba(147, 114, 168, 0.1)', border: 'rgba(147, 114, 168, 0.8)' },
  { bg: 'rgba(107, 154, 128, 0.1)', border: 'rgba(107, 154, 128, 0.8)' },
];

export function MultiCompetitorRadar({
  axes,
  userScores,
  competitorScores,
  competitorNames,
  userName = 'Your Product',
}) {
  const chartData = useMemo(() => {
    if (!axes || !userScores || axes.length === 0) return null;

    const datasets = [
      // User dataset (accent color, solid line)
      {
        label: userName,
        data: userScores,
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
      // Competitor datasets (muted, dashed lines)
      ...(competitorScores || []).map((scores, i) => ({
        label: competitorNames?.[i] || `Competitor ${i + 1}`,
        data: scores,
        fill: true,
        backgroundColor: COMPETITOR_COLORS[i]?.bg || 'rgba(161, 161, 170, 0.1)',
        borderColor: COMPETITOR_COLORS[i]?.border || 'rgba(161, 161, 170, 0.7)',
        borderWidth: 2,
        borderDash: [5, 3],
        pointBackgroundColor: COMPETITOR_COLORS[i]?.border || 'rgba(161, 161, 170, 0.7)',
        pointBorderColor: '#faf7f2',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverBackgroundColor: '#faf7f2',
        pointHoverBorderColor: COMPETITOR_COLORS[i]?.border || 'rgba(161, 161, 170, 0.7)',
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
      })),
    ];

    return {
      labels: axes.map((axis) => axis.name),
      datasets,
    };
  }, [axes, userScores, competitorScores, competitorNames, userName]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart',
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: 'rgba(250, 247, 242, 0.4)',
            backdropColor: 'transparent',
            font: {
              size: 11,
              family: 'Poppins, sans-serif',
            },
          },
          grid: {
            color: 'rgba(250, 247, 242, 0.08)',
          },
          angleLines: {
            color: 'rgba(250, 247, 242, 0.08)',
          },
          pointLabels: {
            color: '#faf7f2',
            font: {
              size: 13,
              family: 'Poppins, sans-serif',
              weight: '500',
            },
            padding: 12,
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#faf7f2',
            font: {
              size: 14,
              family: 'Poppins, sans-serif',
            },
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
    }),
    [axes]
  );

  if (!chartData) {
    return null;
  }

  return (
    <div className="relative h-96">
      <Radar data={chartData} options={chartOptions} />
    </div>
  );
}

export default MultiCompetitorRadar;
