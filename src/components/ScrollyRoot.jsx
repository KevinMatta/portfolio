import React from 'react';
import { Root, Animation, Parallax } from '@bsmnt/scrollytelling';

export default function ScrollyRoot({ children }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const count = Math.max(items.length, 1);
  const block = 100 / count;

  return (
    <Root start="top top" end="bottom bottom" scrub={0.6}>
      <div className="scrolly-root">
        {/* <Parallax tween={{ start: 0, end: 100, movementY: { value: 60, unit: 'px' } }}>
          <div className="scrolly-grid" aria-hidden="true"></div>
        </Parallax> */}
        <Parallax tween={{ start: 0, end: 100, movementY: { value: -40, unit: 'px' } }}>
          <div className="scrolly-glow" aria-hidden="true"></div>
        </Parallax>
        {items.map((child, index) => {
          const start = index * block;
          const end = start + block * 0.75;
          return (
            <Animation
              key={`scrolly-section-${index}`}
              tween={{
                start,
                end,
                from: { opacity: 0, y: 80, scale: 0.97 },
                to: { opacity: 1, y: 0, scale: 1 },
                ease: 'power2.out',
              }}
            >
              <div className="scrolly-section">{child}</div>
            </Animation>
          );
        })}
      </div>
    </Root>
  );
}
