"use client";

import { useEffect, type RefObject } from "react";

export function useInView(ref: RefObject<Element | null>, onEnter: () => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        onEnter();
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();

  }, [ref]);
}

export function useRevealClass(ref: RefObject<HTMLElement | null>) {
  useInView(ref, () => ref.current?.classList.add("is-in"));
}
