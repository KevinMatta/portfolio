"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { bump } from "@/lib/visit-store";

const newKey = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, "0")).join("");

export function IdempotencyDemo() {
  const t = useTranslations("exec.idempotency");
  const [key, setKey] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);

  function pay() {
    const k = key ?? newKey();
    if (!key) {
      setKey(k);
      bump("charges");
    }
    setTaps((n) => n + 1);
    bump("payTaps");
  }

  function reset() {
    setKey(null);
    setTaps(0);
  }

  const charges = taps > 0 ? 1 : 0;
  const log = Array.from({ length: Math.min(taps, 6) }, (_, i) => taps - i);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
      <div className="flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={pay}
          className="-skew-x-12 bg-accent px-8 py-6 text-[clamp(1.6rem,3vw,2.4rem)] font-black text-on-accent shadow-[8px_8px_0_var(--ink)] transition-[transform,box-shadow] duration-75 [font-variation-settings:'wdth'_75] active:translate-x-[6px] active:translate-y-[6px] active:shadow-[2px_2px_0_var(--ink)]"
        >
          <span className="block skew-x-12">{t("pay")}</span>
        </button>
        {taps > 0 && (
          <button type="button" onClick={reset} className="text-sm font-semibold underline underline-offset-4">
            {t("reset")}
          </button>
        )}
      </div>

      <div>
        <dl className="grid grid-cols-2 gap-4" aria-live="polite">
          <div>
            <dt className="text-sm text-ink-soft">{t("requests")}</dt>
            <dd key={taps} className="display animate-[slam_.22s_cubic-bezier(.16,1,.3,1)] text-[clamp(4rem,9vw,7rem)]">
              {taps}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">{t("charges")}</dt>
            <dd className="display text-[clamp(4rem,9vw,7rem)] text-accent">{charges}</dd>
          </div>
        </dl>

        <div className="mono mt-4 text-xs leading-relaxed">
          <p className="text-ink-soft">
            {t("key")}: <span className="text-ink">{key ?? "········"}</span>
          </p>
          <ol className="mt-2 min-h-[8.5rem]">
            {log.map((n) => (
              <li key={n} className="animate-[slam_.22s_cubic-bezier(.16,1,.3,1)] whitespace-nowrap">
                POST /pay #{n} → {n === 1 ? <b className="text-accent">201</b> : <span className="text-ink-soft">200 ↺</span>}
              </li>
            ))}
          </ol>
          <p className="mt-1 max-w-[42ch] font-sans text-sm text-ink-soft">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}
