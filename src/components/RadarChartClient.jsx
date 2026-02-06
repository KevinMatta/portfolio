import { useEffect, useRef } from 'react';
import {
  Chart,
  RadialLinearScale,
  RadarController,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function RadarChartClient({ labels, labelsEn, values }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;

    const root = document.documentElement;
    const getLang = () => (root.lang === 'en' ? 'en' : 'es');
    const currentLabels = getLang() === 'en' ? labelsEn : labels;

    const chart = new Chart(canvasRef.current, {
      type: 'radar',
      data: {
        labels: currentLabels,
        datasets: [
          {
            label: getLang() === 'en' ? 'Soft Skills' : 'Habilidades blandas',
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

    chartRef.current = chart;
    const raf = requestAnimationFrame(() => chart.resize());

    const updateLang = () => {
      const next = getLang();
      chart.data.labels = next === 'en' ? labelsEn : labels;
      chart.data.datasets[0].label = next === 'en' ? 'Soft Skills' : 'Habilidades blandas';
      chart.update();
    };

    const resizeCharts = () => {
      requestAnimationFrame(() => {
        chart.resize();
        chart.update();
      });
    };

    window.addEventListener('languagechange', updateLang);
    window.addEventListener('astro:languagechange', updateLang);
    document.addEventListener('languagechange', updateLang);
    document.addEventListener('radar:resize', resizeCharts);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('languagechange', updateLang);
      window.removeEventListener('astro:languagechange', updateLang);
      document.removeEventListener('languagechange', updateLang);
      document.removeEventListener('radar:resize', resizeCharts);
      chart.destroy();
      chartRef.current = null;
    };
  }, [labels, labelsEn, values]);

  return (
    <canvas
      id="soft-skills-radar"
      aria-label="Soft skills radar chart"
      role="img"
      ref={canvasRef}
      className="radar-canvas"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
