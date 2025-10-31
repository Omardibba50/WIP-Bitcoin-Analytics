/**
 * Chart utility functions for data formatting and configuration
 */

/**
 * Format price history data for line chart
 */
export function formatPriceHistoryForChart(priceHistory) {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      labels: ['No Data'],
      datasets: [{
        label: 'BTC Price',
        data: [0],
        fill: false,
        borderColor: '#00b3ff',
        tension: 0.4,
        pointRadius: 0,
      }]
    };
  }

  const sortedHistory = [...priceHistory].sort((a, b) => a.ts - b.ts);
  const sampledData = sortedHistory.filter((_, index) => index % 6 === 0);
  
  const labels = sampledData.map(item => {
    const date = new Date(item.ts);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? '2-digit' : undefined
    });
  });
  
  const data = sampledData.map(item => item.price);

  return {
    labels,
    datasets: [{
      label: 'BTC Price',
      data,
      fill: false,
      borderColor: '#00b3ff',
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 6,
    }]
  };
}

/**
 * Format models data for bar chart
 */
export function formatModelsForChart(models) {
  if (!models || models.length === 0) {
    return {
      labels: ['No Models'],
      datasets: [{
        label: 'Model Count',
        data: [0],
        backgroundColor: ['rgba(200,200,210,0.7)'],
        borderWidth: 1.5,
        borderRadius: 8,
      }]
    };
  }

  return {
    labels: models.map(model => model.name || model.id),
    datasets: [{
      label: 'Model Count',
      data: models.map(() => 1),
      backgroundColor: models.map((_, idx) => 
        `rgba(${38 + idx * 60}, ${38 + idx * 60}, ${38 + idx * 80}, 0.85)`
      ),
      borderWidth: 1.5,
      borderRadius: 8,
    }]
  };
}

/**
 * Common chart options
 */
export const chartOptions = {
  line: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { beginAtZero: false }
    }
  },
  bar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
};
