"use client";

import { useRef, type ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRevealClass } from "@/lib/use-in-view";
import { experience } from "@/content/profile";
import { SectionTitle } from "@/components/ui/section-title";

export function Experience() {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();

  const month = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    const label = format.dateTime(new Date(Date.UTC(y, m - 1, 15)), { month: "short", year: "numeric" });
    return locale === "es" ? label.replace(/^\w/, (c) => c.toUpperCase()) : label;
  };
  const duration = (since: string, until?: string) => {
    const [y0, m0] = since.split("-").map(Number);
    const now = new Date();
    const [y1, m1] = until ? until.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
    const total = (y1 - y0) * 12 + (m1 - m0) + 1; // ambos meses cuentan
    return t("update.duration", { years: Math.floor(total / 12), months: total % 12 }).trim();
  };

  return (
    <section
      id="update"
      aria-labelledby="update-title"
      className="slab relative -mt-[4vw] bg-paper px-4 pb-[12vw] pt-[10vw] md:px-10"
    >
      <SectionTitle id="update-title" verb="UPDATE" label={t("nav.steps.update")} />
      <p className="mt-6 max-w-[34ch] text-[clamp(1.25rem,2.2vw,1.9rem)] font-medium leading-tight">
        {t("update.intro")}
      </p>

      <ol className="mt-[7vw] grid gap-[9vw] md:gap-[6vw]">
        {experience.map((job, i) => {
          const base = `update.jobs.${job.id}` as const;
          const points = t.raw(`${base}.points`) as string[];
          const current = !job.until;
          return (
            <Reveal
              key={job.id}
              as="li"
              className={`grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 ${i % 2 ? "lg:ml-[8vw]" : ""}`}
            >
              <div className="reveal">
                <p className="display text-[clamp(3.2rem,8vw,7.5rem)] text-ink">{t(`${base}.period`)}</p>
                <h3 className="mt-4 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-tight [font-variation-settings:'wdth'_85]">
                  {t(`${base}.role`)}
                </h3>
                {/* La duración se calcula con la fecha de hoy: puede diferir del HTML generado. */}
                <p className="mono mt-2 text-sm text-ink-soft" suppressHydrationWarning>
                  {month(job.since)} — {job.until ? month(job.until) : t("update.present")} ({duration(job.since, job.until)})
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-ink-soft">
                  {t(`${base}.company`)}
                  {current && (
                    <span className="-skew-x-12 bg-accent px-2 py-0.5 text-sm font-bold text-on-accent">
                      <span className="block skew-x-12">{t("update.current")}</span>
                    </span>
                  )}
                </p>
              </div>

              <div className="reveal min-w-0 [--reveal-delay:90ms]">
                <pre className="mono overflow-x-auto bg-ink p-4 text-xs leading-relaxed text-paper [clip-path:polygon(0_0,100%_0,98%_100%,0_100%)] md:text-sm">
                  <code>
                    <K>UPDATE</K> kevin{"\n"}
                    <K>SET</K> {t("update.sql.role")} = &apos;{t(`${base}.role`)}&apos;,{"\n"}
                    {"    "}
                    {t("update.sql.company")} = &apos;{job.short}&apos;{"\n"}
                    <K>WHERE</K> {t("update.sql.since")} = &apos;{job.since}&apos;
                    {job.until && (
                      <>
                        {"\n  "}
                        <K>AND</K> {t("update.sql.until")} = &apos;{job.until}&apos;
                      </>
                    )}
                    ;
                  </code>
                </pre>
                <ul className="mt-5 grid gap-3">
                  {points.map((point) => (
                    <li key={point} className="grid grid-cols-[1.25rem_1fr] gap-2 text-lg leading-snug">
                      <span aria-hidden className="mt-2.5 block h-[3px] w-3 -skew-x-12 bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </ol>

    </section>
  );
}

function Reveal({ as: Tag, className, children }: { as: "li"; className: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useRevealClass(ref);
  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-accent-inv">{children}</span>;
}
