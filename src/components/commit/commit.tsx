"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { profile } from "@/content/profile";
import { useVisit } from "@/lib/visit-store";
import { useInView } from "@/lib/use-in-view";
import { SectionTitle } from "@/components/ui/section-title";

gsap.registerPlugin(useGSAP);

function useElapsed(since: number) {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Commit() {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  return (
    <section
      id="commit"
      aria-labelledby="commit-title"
      className="relative -mt-[4vw] bg-accent px-4 pb-10 pt-[10vw] text-on-accent [clip-path:polygon(0_4vw,100%_0,100%_100%,0_100%)] md:px-10"
    >
      <SectionTitle id="commit-title" verb="COMMIT" label={t("nav.steps.commit")} className="[&_.label]:bg-on-accent [&_.label]:text-accent" />

      <div className="mt-10 grid gap-12 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div>
          <p className="max-w-[22ch] text-[clamp(1.6rem,3.4vw,3rem)] font-bold leading-[1.02] [font-variation-settings:'wdth'_80]">
            {t("commit.lead")}
          </p>

          <a
            href={`mailto:${profile.email}`}
            className="display mt-10 block w-fit text-[clamp(3.4rem,10vw,9rem)] transition-[font-variation-settings,transform] duration-200 ease-slam hover:-skew-x-6 hover:[font-variation-settings:'wdth'_125]"
          >
            {t("commit.write")}
          </a>
          <p className="mono mt-3 break-all text-sm">{profile.email}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copy}
              className="-skew-x-12 bg-on-accent px-5 py-3 font-bold text-accent transition-transform duration-75 active:translate-y-1"
            >
              <span className="block skew-x-12" aria-live="polite">
                {copied ? t("commit.copied") : t("commit.copy")}
              </span>
            </button>
            {[
              { href: profile.github, label: t("commit.github") },
              { href: profile.linkedin, label: t("commit.linkedin") },
              ...(profile.cv ? [{ href: profile.cv, label: t("commit.cv") }] : []),
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="-skew-x-12 border-2 border-on-accent px-5 py-3 font-bold transition-colors duration-100 hover:bg-on-accent hover:text-accent"
              >
                <span className="block skew-x-12">{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <Receipt />
      </div>

      <footer className="mt-[10vw] flex flex-wrap justify-between gap-4 border-t-2 border-on-accent/30 pt-4 text-sm">
        <p>{t("footer.made")}</p>
        <p>© {new Date().getFullYear()} {profile.name}</p>
      </footer>
    </section>
  );
}

function Receipt() {
  const t = useTranslations("commit.receipt");
  const visit = useVisit();
  const elapsed = useElapsed(visit.startedAt);
  const root = useRef<HTMLDivElement>(null);
  const ticket = visit.startedAt.toString(36).slice(-6).toUpperCase();

  const { contextSafe } = useGSAP({ scope: root });
  const print = contextSafe(() => {
    gsap
      .timeline()
      .set(".paper", { yPercent: -100 })
      .to(".paper", { yPercent: 0, duration: 1.1, ease: "steps(14)" });
  });
  useInView(root, print);

  const lines: [string, string | number][] = [
    [t("time"), elapsed],
    [t("keys"), visit.keys],
    [t("sales"), visit.offlineSales],
    [t("taps"), visit.payTaps],
    [t("charges"), visit.charges],
    [t("rollbacks"), visit.rollbacks],
  ];

  return (
    <div ref={root} className="relative">
      <div className="relative z-10 h-4 -skew-x-6 bg-ink" aria-hidden />
      <div className="overflow-hidden px-3">
        <div className="paper receipt-edge mono bg-thermal px-5 pb-8 pt-5 text-[0.8rem] text-thermal-ink shadow-[0_18px_30px_-18px_rgb(0_0_0/.5)]">
          <p className="text-center font-bold">{t("store")}</p>
          <p className="text-center">{t("city")}</p>
          <p className="mt-2 text-center" suppressHydrationWarning>
            {t("ticket")} #{ticket}
          </p>
          <hr className="my-3 border-0 border-t-2 border-dashed border-thermal-ink/60" />
          <dl className="grid gap-1">
            {lines.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt>{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <hr className="my-3 h-1.5 border-y-2 border-x-0 border-dashed border-thermal-ink/60" />
          <div className="flex justify-between text-base font-bold">
            <span>{t("total")}</span>
            <span>{t("free")}</span>
          </div>
          <p className="mt-6 text-center">{t("thanks")}</p>
          <p className="mt-3 text-center tracking-[0.3em]" aria-hidden>
            ||| | || ||| | | |||
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => print()}
        className="mt-4 text-sm font-semibold underline underline-offset-4"
      >
        {t("print")}
      </button>
    </div>
  );
}
