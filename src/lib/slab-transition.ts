"use client";

import { flushSync } from "react-dom";


export function slabTransition(update: () => void) {
  if (!document.startViewTransition) {
    update();
    return;
  }

  const transition = document.startViewTransition(() => flushSync(update));
  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          "polygon(-30% 0, -30% 0, -60% 100%, -60% 100%)",
          "polygon(-30% 0, 160% 0, 130% 100%, -60% 100%)",
        ],
      },
      {
        duration: 620,
        easing: "cubic-bezier(0.76, 0, 0.24, 1)",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}
