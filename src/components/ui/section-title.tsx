"use client";

import { useRef } from "react";
import { useRevealClass } from "@/lib/use-in-view";

// El verbo SQL de cada paso entra de golpe, inclinado, y se endereza.
export function SectionTitle({
  verb,
  label,
  id,
  className = "",
}: {
  verb: string;
  label: string;
  id: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useRevealClass(ref);

  return (
    <h2 ref={ref} id={id} className={`flex flex-wrap items-end gap-x-5 gap-y-2 ${className}`}>
      <span className="verb reveal display block text-[clamp(5rem,17vw,16rem)]" aria-hidden>
        {verb}
      </span>
      {/* La animación va en el contenedor: así no pisa la inclinación de la etiqueta. */}
      <span className="reveal mb-[0.6em] block [--reveal-delay:180ms]">
        <span className="label block -skew-x-12 bg-accent px-3 py-1 text-lg font-bold text-on-accent md:text-2xl">
          <span className="sr-only">{verb} </span>
          <span className="block skew-x-12">{label}</span>
        </span>
      </span>
    </h2>
  );
}
