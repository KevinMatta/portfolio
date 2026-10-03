"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useSwitchLocale } from "@/components/locale-provider";
import { scrollToSection } from "@/lib/scroll";
import { SoundToggle } from "@/components/sound-toggle";

export const STEPS = ["begin", "update", "exec", "select", "insert", "commit"] as const;
export type Step = (typeof STEPS)[number];

function useCurrentStep() {
  const [current, setCurrent] = useState<Step>("begin");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id as Step);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    STEPS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return current;
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const switchLocale = useSwitchLocale();
  const current = useCurrentStep();
  const [open, setOpen] = useState(false);
  const other: Locale = locale === "es" ? "en" : "es";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#exec"
        className="fixed left-4 top-3 z-[60] -translate-y-24 bg-accent px-3 py-2 font-semibold text-on-accent focus:translate-y-0"
      >
        {t("skip")}
      </a>

      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 px-4 py-3 md:px-10">
        <a
          href="#begin"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("begin");
          }}
          className="display bg-paper px-1.5 pt-1 text-3xl text-ink" aria-label="Kevin Mata">
          KM
        </a>

        <nav aria-label={t("menu")} className="hidden md:block">
          <ol className="flex -skew-x-12 items-stretch bg-paper">
            {STEPS.map((step) => {
              const on = step === current;
              return (
                <li key={step}>
                  <a
                    href={`#${step}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(step);
                    }}
                    aria-current={on ? "step" : undefined}
                    className={`group flex h-9 items-center px-3 transition-colors duration-150 ${
                      on ? "bg-ink text-paper" : "text-ink hover:bg-accent hover:text-on-accent"
                    }`}
                  >
                    <span className="skew-x-12 text-sm font-semibold">{t(`steps.${step}`)}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex items-center gap-1 bg-paper p-1">
          <SoundToggle />
          <button
            type="button"
            onClick={() => switchLocale(other)}
            className="px-2 py-1 text-sm font-semibold underline-offset-4 hover:underline"
            lang={other}
          >
            {t("language")}
          </button>
          <button
            type="button"
            className="ml-1 bg-ink px-3 py-1.5 text-sm font-semibold text-paper md:hidden"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {t("menu")}
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[70] bg-accent text-on-accent transition-[clip-path] duration-300 ease-slam md:hidden ${
          open
            ? "[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]"
            : "pointer-events-none [clip-path:polygon(0_0,0_0,0_100%,0_100%)]"
        }`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-3 bg-on-accent px-3 py-1.5 text-sm font-semibold text-accent"
        >
          {t("close")}
        </button>
        <ol className="flex h-full flex-col justify-center gap-1 px-4">
          {STEPS.map((step, i) => (
            <li key={step} style={{ paddingLeft: `${i * 4}vw` }}>
              <a
                href={`#${step}`}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  scrollToSection(step);
                }}
                className="display block text-[15vw] leading-[0.85]"
              >
                {t(`steps.${step}`)}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
