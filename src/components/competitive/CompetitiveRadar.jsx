import { useEffect, useRef } from 'react';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function CompetitiveRadar({
  axes,
  userScores,
  competitorScores,
  userName = 'Your Product',
  competitorName = 'Competitor',
  onExport = null
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !axes || !userScores || !competitorScores) return;

    const ctx = chartRef.current.getContext('2d');

    // Destroy previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: axes.map(axis => axis.name),
        datasets: [
          {
            label: userName,
            data: userScores,
            fill: true,
            backgroundColor: 'rgba(194, 69, 22, 0.2)',
            borderColor: '#C24516',
            borderWidth: 2,
            pointBackgroundColor: '#C24516',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#C24516',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: competitorName,
            data: competitorScores,
            fill: true,
            backgroundColor: 'rgba(107, 114, 128, 0.2)',
            borderColor: '#6B7280',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#6B7280',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#6B7280',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: 'rgba(250, 247, 242, 0.5)',
              backdropColor: 'transparent',
            },
            grid: {
              color: 'rgba(250, 247, 242, 0.1)',
            },
            pointLabels: {
              color: '#faf7f2',
              font: {
                size: 12,
                family: 'Poppins, sans-serif',
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#faf7f2',
              font: {
                size: 13,
                family: 'Poppins, sans-serif',
              },
              padding: 20,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(26, 26, 28, 0.95)',
            titleColor: '#faf7f2',
            bodyColor: '#faf7f2',
            borderColor: '#C24516',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.r}/100`;
              },
            },
          },
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart',
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [axes, userScores, competitorScores, userName, competitorName]);

  const handleExport = () => {
    if (chartRef.current && onExport) {
      const url = chartRef.current.toDataURL('image/png');
      onExport(url);
    }
  };

  return (
    <div className="relative">
      <div className="aspect-square max-w-2xl mx-auto">
        <canvas ref={chartRef}></canvas>
      </div>

      {onExport && (
        <div className="text-center mt-6">
          <button
            onClick={handleExport}
            className="px-6 py-2 border-2 border-[#C24516] text-[#C24516] rounded-lg hover:bg-[#C24516]/10 transition-colors text-sm font-medium"
          >
            Export as PNG
          </button>
        </div>
      )}
    </div>
  );
}

export default CompetitiveRadar;
