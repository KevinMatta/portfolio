import { tsParticles } from '@tsparticles/engine';
import { loadFull } from 'tsparticles';

const targets = document.querySelectorAll('[data-stars]');

if (targets.length) {
  const init = async () => {
    await loadFull(tsParticles);
    targets.forEach((target) => {
      const canvasId = target.id;
      if (!canvasId) return;
      tsParticles.load({
      id: canvasId,
      options: {
        fullScreen: { enable: false },
        background: { color: 'transparent' },
        detectRetina: true,
        fpsLimit: 60,
        interactivity: {
          events: {
            onHover: { enable: false },
            onClick: { enable: false },
            resize: true,
          },
        },
        particles: {
          color: { value: ['#7df9ff', '#8b5cff', '#ffffff'] },
          links: { enable: false },
          move: {
            direction: 'none',
            enable: true,
            outModes: { default: 'out' },
            speed: 0.18,
            straight: false,
          },
          number: {
            density: { enable: true, width: 900, height: 900 },
            value: 110,
          },
          opacity: {
            value: { min: 0.35, max: 0.85 },
            animation: { enable: true, speed: 0.3, minimumValue: 0.2 },
          },
          shape: { type: 'circle' },
          size: {
            value: { min: 0.8, max: 2.1 },
          },
        },
      },
      });
    });
  };

  init();
}
