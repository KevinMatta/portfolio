"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { stack, type StackGroup } from "@/content/profile";
import { SectionTitle } from "@/components/ui/section-title";
import { ICONS } from "./icons";

const FILTERS = ["all", "frontend", "backend", "ai", "data", "infra", "flow"] as const;
type Filter = (typeof FILTERS)[number];

// Capas por las que viaja una petición, en orden.
const LAYERS = ["frontend", "backend", "ai", "data"] as const;
type Layer = (typeof LAYERS)[number];

// Conexiones entre capas. "bypass": el servidor también va directo a la base.
const LINKS: { id: string; from: Layer; to: Layer; bypass?: boolean }[] = [
  { id: "c-s", from: "frontend", to: "backend" },
  { id: "s-a", from: "backend", to: "ai" },
  { id: "a-d", from: "ai", to: "data" },
  { id: "s-d", from: "backend", to: "data", bypass: true },
];

type Path = { id: string; d: string; len: number; from: Layer; to: Layer };

// Los haces salen en cadena, como una petición que cruza las capas.
const BEAM_DUR = 2.6;
const BEAM_TIMING: Record<string, { begin: number }> = {
  "c-s": { begin: 0 },
  "s-a": { begin: 0.75 },
  "a-d": { begin: 1.5 },
  "s-d": { begin: 0.75 },
};


function Beam({
  d,
  len: total,
  color,
  begin,
  dur,
  reverse = false,
  faint = false,
}: {
  d: string;
  len: number;
  color: string;
  begin: number;
  dur: number;
  reverse?: boolean;
  faint?: boolean;
}) {
  // Largo del haz en px: fijo, pero nunca más de ~60% de un cable corto.
  const len = Math.max(8, Math.min(faint ? 40 : 72, total * (faint ? 0.35 : 0.6)));
  const from = String(len);
  const to = String(-total);
  const anim = (
    <animate
      attributeName="stroke-dashoffset"
      from={reverse ? to : from}
      to={reverse ? from : to}
      dur={`${dur}s`}
      begin={`${begin}s`}
      repeatCount="indefinite"
    />
  );
  const common = {
    d,
    fill: "none",
    stroke: color,
    strokeDasharray: `${len} ${total + len}`,
    strokeDashoffset: from,
    strokeLinecap: "butt" as const,
    strokeLinejoin: "miter" as const,
  };
  return (
    <>
      {!faint && (
        <path {...common} strokeWidth={8} strokeOpacity={0.8} filter="url(#beam-glow)">
          {anim}
        </path>
      )}
      <path {...common} strokeWidth={faint ? 2 : 3} strokeOpacity={faint ? 0.5 : 1}>
        {anim}
      </path>
    </>
  );
}


export function StackQuery() {
  const t = useTranslations();
  const [filter, setFilter] = useState<Filter>("all");
  const [ping, setPing] = useState<{ layer: Layer; n: number } | null>(null);
  const system = useRef<HTMLDivElement>(null);
  const columns = useRef(new Map<Layer, HTMLElement>());
  const [paths, setPaths] = useState<Path[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const count = stack.filter((s) => filter === "all" || s.group === filter).length;
  const lit = (group: StackGroup) => filter === "all" || filter === group;
  const linkLit = (p: Path) => filter === "all" || filter === p.from || filter === p.to;

  // Las líneas se calculan con el layout real: en PC van en horizontal, en móvil en vertical.
  const measure = useCallback(() => {
    const box = system.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const r = (l: Layer) => {
      const c = columns.current.get(l)!.getBoundingClientRect();
      return { x: c.left - b.left, y: c.top - b.top, w: c.width, h: c.height };
    };
    const stacked = r("backend").y > r("frontend").y + r("frontend").h / 2;
    const next: Path[] = [];
    for (const link of LINKS) {
      const a = r(link.from);
      const z = r(link.to);
      let d: string;
      let len: number;
      if (link.bypass) {
        if (stacked) continue; // en móvil el atajo no aporta; se ve limpio sin él
        const y0 = a.y + a.h;
        const y1 = z.y + z.h;
        const dip = Math.max(y0, y1) + 34;
        // En ángulo recto: baja, cruza por debajo y sube.
        d = `M ${a.x + a.w / 2} ${y0} V ${dip} H ${z.x + z.w / 2} V ${y1}`;
        len = dip - y0 + Math.abs(z.x + z.w / 2 - (a.x + a.w / 2)) + dip - y1;
      } else if (stacked) {
        const x = a.x + a.w / 2;
        d = `M ${x} ${a.y + a.h} V ${z.y}`;
        len = z.y - (a.y + a.h);
      } else {
        // A la altura del título de la capa.
        const y = Math.max(a.y, z.y) + 26;
        d = `M ${a.x + a.w} ${y} H ${z.x}`;
        len = z.x - (a.x + a.w);
      }
      next.push({ id: link.id, d, len, from: link.from, to: link.to });
    }
    setPaths(next);
    setSize({ w: b.width, h: b.height + 40 });
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (system.current) ro.observe(system.current);
    columns.current.forEach((el) => ro.observe(el));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <section
      id="select"
      aria-labelledby="select-title"
      className="slab relative -mt-[4vw] bg-paper px-4 pb-[12vw] pt-[10vw] md:px-10"
    >
      <SectionTitle id="select-title" verb="SELECT" label={t("nav.steps.select")} />
      <p className="mt-6 max-w-[40ch] text-[clamp(1.25rem,2.2vw,1.9rem)] font-medium leading-tight">
        {t("select.intro")}
      </p>

      <div className="mt-10 flex flex-wrap items-end gap-x-8 gap-y-4">
        <pre className="mono whitespace-pre-wrap bg-ink px-5 py-4 text-sm leading-relaxed text-paper">
          <code>
            <K>SELECT</K> {t("select.columns.tool")} <K>FROM</K> kevin.stack
            {filter !== "all" && (
              <>
                {"\n"}
                <K>WHERE</K> {t("select.columns.group")} = &apos;{t(`select.filters.${filter}`)}&apos;
              </>
            )}
            ;
          </code>
        </pre>
        <div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="WHERE">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`mono -skew-x-12 px-3 py-1.5 text-sm font-semibold transition-colors duration-100 ${
                  filter === f ? "bg-accent text-on-accent" : "bg-paper-2 hover:bg-ink hover:text-paper"
                }`}
              >
                <span className="block skew-x-12">{t(`select.filters.${f}`)}</span>
              </button>
            ))}
          </div>
          <p className="mono mt-2 text-sm text-ink-soft" aria-live="polite">
            {t("select.rows", { count })}
          </p>
        </div>
      </div>

      {/* Flujo de trabajo: fuera del sistema, encima. */}
      <Layer
        title={t("select.layers.flow")}
        group="flow"
        lit={lit("flow")}
        className="mt-10 border-l-4 border-accent/60 pl-4"
        row
      />

      {/* Infra: el contenedor que envuelve el sistema. */}
      <div
        className={`relative mt-6 border-2 border-dashed p-4 pb-12 transition-[border-color,opacity] duration-300 md:p-6 md:pb-16 ${
          lit("infra") ? "border-accent" : "border-ink/25"
        }`}
      >
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className={`mono text-sm font-semibold ${lit("infra") ? "text-accent" : "text-ink-soft"}`}>
            {t("select.layers.infra")}
          </p>
          <Nodes group="infra" lit={lit("infra")} row />
        </div>

        <div ref={system} className="relative">
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={size.w}
            height={size.h}
            aria-hidden
          >
            <defs>
              <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            {paths.map((p) => {
              const on = linkLit(p);
              const t = BEAM_TIMING[p.id];
              return (
                <g key={p.id} className="transition-opacity duration-300" opacity={on ? 1 : 0.12}>
                  {/* Cable: línea recta y quieta. */}
                  <path d={p.d} fill="none" stroke="var(--ink)" strokeOpacity={0.28} strokeWidth={2} strokeLinejoin="miter" />
                  {/* Haz de luz (ida): un tramo corto que recorre el cable, con halo. */}
                  <Beam d={p.d} len={p.len} color="var(--accent)" begin={t.begin} dur={BEAM_DUR} />
                  {/* Respuesta (vuelta): más tenue y en sentido contrario. */}
                  <Beam d={p.d} len={p.len} color="var(--ink)" begin={t.begin + BEAM_DUR / 2} dur={BEAM_DUR} reverse faint />
                </g>
              );
            })}
          </svg>

          <div className="relative grid gap-12 md:grid-cols-4 md:gap-16 xl:gap-24">
            {LAYERS.map((layer) => (
              <Layer
                key={layer}
                ref={(el) => {
                  if (el) columns.current.set(layer, el);
                }}
                title={t(`select.layers.${layer}`)}
                group={layer}
                lit={lit(layer)}
                pinged={ping?.layer === layer ? ping.n : undefined}
                onPing={() => setPing((p) => ({ layer, n: (p?.n ?? 0) + 1 }))}
                className="bg-paper-2 p-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%)]"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Layer({
  ref,
  title,
  group,
  lit,
  pinged,
  onPing,
  className = "",
  row = false,
}: {
  ref?: React.Ref<HTMLDivElement>;
  title: string;
  group: StackGroup;
  lit: boolean;
  pinged?: number;
  onPing?: () => void;
  className?: string;
  row?: boolean;
}) {
  return (
    <div
      ref={ref}
      onPointerEnter={onPing}
      className={`transition-[opacity,filter,transform] duration-300 ease-slam ${
        lit ? "opacity-100" : "opacity-30 saturate-0"
      } ${className}`}
    >
      <p className="display text-[clamp(1.8rem,3vw,2.6rem)] text-ink">
        {/* Al pasar el cursor, la capa "recibe" un paquete: un destello rápido. */}
        <span key={pinged} className={pinged ? "inline-block animate-[slam_.3s_cubic-bezier(.16,1,.3,1)]" : "inline-block"}>
          {title}
        </span>
      </p>
      <Nodes group={group} lit={lit} row={row} className="mt-3" />
    </div>
  );
}

function Nodes({ group, lit, row, className = "" }: { group: StackGroup; lit: boolean; row?: boolean; className?: string }) {
  const items = stack.filter((s) => s.group === group);
  return (
    <ul className={`flex flex-wrap gap-2 ${row ? "" : "md:flex-col md:items-start"} ${className}`}>
      {items.map((item, i) => {
        const icon = item.icon ? ICONS[item.icon] : undefined;
        return (
          <li
            key={item.id}
            // Cascada al encenderse la capa.
            style={{ transitionDelay: lit ? `${i * 40}ms` : "0ms" }}
            className={`group/node flex items-center gap-2 border-l-[3px] bg-paper px-2.5 py-1.5 transition-[transform,border-color] duration-200 ease-slam hover:translate-x-1 hover:-skew-x-6 ${
              lit ? "border-accent" : "border-transparent"
            }`}
          >
            {icon ? (
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-ink-soft transition-colors group-hover/node:fill-accent" role="img" aria-label={icon.title}>
                <path d={icon.path} />
              </svg>
            ) : (
              <span className="mono w-auto shrink-0 text-[0.7rem] font-bold text-ink-soft group-hover/node:text-accent">{item.mono}</span>
            )}
            <span className="text-sm font-semibold">{item.tool}</span>
          </li>
        );
      })}
    </ul>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-accent-inv">{children}</span>;
}
