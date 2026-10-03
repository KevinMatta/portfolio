"use client";

import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}


const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Recorre la página hasta la sección (pasando por las animaciones del camino). */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const distance = Math.abs(el.getBoundingClientRect().top);
  // Más lejos, un poco más de tiempo: el punto es ver cómo se recorre la web.
  const duration = Math.min(3, 1.3 + distance / 4500);
  if (lenis) {
    lenis.scrollTo(el, { duration, easing: easeInOutCubic });
  } else {
    gsap.to(window, { scrollTo: { y: el, autoKill: true }, duration, ease: "power2.inOut" });
  }
  history.replaceState(null, "", `#${id}`);
}
