"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { bump } from "@/lib/visit-store";

type Sale = { id: number; total: number; synced: boolean };

const money = (n: number) => `$${n.toFixed(2)}`;

export function OfflineDemo() {
  const t = useTranslations("exec.offline");
  const [online, setOnline] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const markSynced = (id: number) =>
    setSales((list) => list.map((s) => (s.id === id ? { ...s, synced: true } : s)));

  function sell() {
    const sale = { id: nextId.current++, total: Math.round((2 + Math.random() * 38) * 100) / 100, synced: false };
    setSales((list) => [sale, ...list].slice(0, 7));
    if (online) later(() => markSynced(sale.id), 260);
    else bump("offlineSales");
  }

  function toggle() {
    if (online) {
      setOnline(false);
      return;
    }
    setOnline(true);
    // Al volver la red, la cola se vacía en orden: la más antigua primero.
    sales
      .filter((s) => !s.synced)
      .reverse()
      .forEach((s, i) => later(() => markSynced(s.id), 220 + i * 170));
  }

  const queued = sales.filter((s) => !s.synced).length;
  const synced = sales.length - queued;

  return (
    <div className="bg-paper p-4 shadow-[10px_10px_0_var(--ink)] md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sell}
          className="-skew-x-12 bg-ink px-5 py-3 text-lg font-bold text-paper transition-transform duration-100 active:translate-y-1"
        >
          <span className="block skew-x-12">{t("sell")}</span>
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!online}
          className={`-skew-x-12 border-2 px-5 py-3 text-lg font-bold transition-colors duration-100 ${
            online ? "border-ink text-ink hover:bg-ink/10" : "border-accent bg-accent text-on-accent"
          }`}
        >
          <span className="block skew-x-12">{online ? t("cut") : t("restore")}</span>
        </button>
      </div>

      <Cable online={online} label={online ? t("online") : t("offline")} />

      <p className="mono mt-2 flex flex-wrap gap-x-6 text-sm" aria-live="polite">
        <span className={queued ? "text-accent" : "text-ink-soft"}>{t("queued", { count: queued })}</span>
        <span className="text-ink-soft">{t("synced", { count: synced })}</span>
      </p>

      <ol className="mono mt-4 min-h-[13rem] text-sm">
        {sales.length === 0 && <li className="py-2 text-ink-soft">{t("empty")}</li>}
        {sales.map((s) => (
          <li
            key={s.id}
            className="grid animate-[slam_.28s_cubic-bezier(.16,1,.3,1)] grid-cols-[1fr_auto_6.5rem] gap-3 border-b border-dashed border-ink/25 py-1.5"
          >
            <span>
              {t("sale")} #{String(s.id).padStart(4, "0")}
            </span>
            <span>{money(s.total)}</span>
            <span className={`text-right ${s.synced ? "text-ink-soft" : "font-bold text-accent"}`}>
              {s.synced ? t("done") : t("pending")}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Cable({ online, label }: { online: boolean; label: string }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <svg viewBox="0 0 200 20" className="h-5 w-40 shrink-0 overflow-visible" aria-hidden>
        <path
          d="M0 10 H92"
          stroke="currentColor"
          strokeWidth="4"
          className="transition-transform duration-200 ease-slam"
          style={{ transform: online ? "none" : "translate(-6px, 3px) rotate(4deg)" }}
        />
        <path
          d="M108 10 H200"
          stroke="currentColor"
          strokeWidth="4"
          className="transition-transform duration-200 ease-slam"
          style={{ transform: online ? "none" : "translate(6px, -3px) rotate(-4deg)", transformOrigin: "200px 10px" }}
        />
        <path d="M92 10 H108" stroke="currentColor" strokeWidth="4" style={{ opacity: online ? 1 : 0 }} />
        {!online && <path d="M96 2 L104 18 M104 2 L96 18" stroke="var(--accent)" strokeWidth="3" />}
      </svg>
      <span className={`text-sm font-semibold ${online ? "text-ink" : "text-accent"}`}>{label}</span>
    </div>
  );
}
