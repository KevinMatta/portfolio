"use client";

import { SmoothScroll } from "./smooth-scroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
