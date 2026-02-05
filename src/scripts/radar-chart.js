import {
  Chart,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const charts = new Map();

const initChart = (canvas) => {
  const root = document.documentElement;
  const lang = root.lang === 'en' ? 'en' : 'es';
  const labels = lang === 'en' ? JSON.parse(canvas.dataset.labelsEn) : JSON.parse(canvas.dataset.labelsEs);
  const values = JSON.parse(canvas.dataset.values);

  const chart = new Chart(canvas, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: lang === 'en' ? 'Soft Skills' : 'Habilidades blandas',
          data: values,
          backgroundColor: 'rgba(125, 249, 255, 0.18)',
          borderColor: 'rgba(125, 249, 255, 0.8)',
          pointBackgroundColor: '#7df9ff',
          pointBorderColor: '#0b0f1a',
          pointHoverBackgroundColor: '#ff59c7',
          pointHoverBorderColor: '#ffffff',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(125, 249, 255, 0.2)' },
          grid: { color: 'rgba(125, 249, 255, 0.12)' },
          pointLabels: { color: 'rgba(230, 241, 255, 0.8)', font: { size: 11 } },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
    },
  });

  charts.set(canvas, chart);
};

const updateLang = () => {
  const root = document.documentElement;
  charts.forEach((chart, canvas) => {
    const next = root.lang === 'en' ? 'en' : 'es';
    chart.data.labels = next === 'en' ? JSON.parse(canvas.dataset.labelsEn) : JSON.parse(canvas.dataset.labelsEs);
    chart.data.datasets[0].label = next === 'en' ? 'Soft Skills' : 'Habilidades blandas';
    chart.update();
  });
};

const resizeCharts = () => {
  charts.forEach((chart) => chart.resize());
};

const canvases = document.querySelectorAll('[data-radar]');
canvases.forEach((canvas) => {
  if (charts.has(canvas)) return;
  initChart(canvas);
});

window.addEventListener('languagechange', updateLang);
window.addEventListener('astro:languagechange', updateLang);
document.addEventListener('languagechange', updateLang);
document.addEventListener('radar:resize', resizeCharts);
