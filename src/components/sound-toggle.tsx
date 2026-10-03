"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { music } from "@/lib/music";


const KEY = "km-sound";

function readChoice() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function remember(value: "on" | "off") {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {}
}


function isRobot() {
  return (
    navigator.webdriver ||
    /bot|crawl|spider|headless|preview|screenshot|lighthouse|vercel|facebookexternalhit|whatsapp|slack|discord|telegram|linkedin|twitter/i.test(
      navigator.userAgent,
    )
  );
}

export function SoundToggle() {
  const t = useTranslations("nav");
  const [playing, setPlaying] = useState(false);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    const choice = readChoice();
    if (choice === "off" || isRobot()) return;
    let cancelled = false;
    if (choice !== "on") {
      queueMicrotask(() => !cancelled && setGate(true));
    } else {
      void music.start().then((ok) => {
        if (cancelled) return;
        if (ok) setPlaying(true);
        else setGate(true);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gate) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [gate]);

  async function enter(withSound: boolean) {
    setGate(false);
    remember(withSound ? "on" : "off");
    if (withSound) setPlaying(await music.start());
  }

  // En segundo plano no suena.
  useEffect(() => {
    if (!playing) return;
    const onVisibility = () => (document.hidden ? music.stop() : void music.start());
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [playing]);

  useEffect(() => () => music.stop(), []);

  async function toggle() {
    if (playing) {
      music.stop();
      setPlaying(false);
      remember("off");
      return;
    }
    remember("on");
    setPlaying(await music.start());
  }

  return (
    <>
    <button
      type="button"
      onClick={toggle}
      data-sound-toggle
      aria-pressed={playing}
      aria-label={playing ? t("soundOff") : t("soundOn")}
      className="group flex items-center gap-2 px-2 py-1 text-sm font-semibold"
    >
      <span aria-hidden className={`flex h-4 items-end gap-[2px] ${playing ? "" : "opacity-60"}`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`block w-[3px] origin-bottom bg-current ${playing ? "animate-[eq_.9s_ease-in-out_infinite]" : ""}`}
            // Apagado: barras quietas a distinta altura, que se leen como "ecualizador".
            style={{ height: playing ? "100%" : ["45%", "80%", "60%", "35%"][i], animationDelay: playing ? `${i * 0.13}s` : undefined }}
          />
        ))}
      </span>
      <span className="hidden md:inline">{t("sound")}</span>
    </button>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("gateTitle")}
        aria-hidden={!gate}
        inert={!gate}
        className={`fixed inset-0 z-[90] flex flex-col items-start justify-center gap-8 bg-accent px-6 text-on-accent transition-[clip-path] duration-500 ease-slam md:px-16 ${
          gate
            ? "[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]"
            : "pointer-events-none [clip-path:polygon(0_0,0_0,0_100%,0_100%)]"
        }`}
      >
        <p className="mono text-sm">{t("gateHint")}</p>
        <p className="display text-[22vw] md:text-[14vw]">KEVIN MATA</p>
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => enter(true)}
            className="-skew-x-12 bg-on-accent px-8 py-4 text-lg font-bold text-accent"
          >
            <span className="inline-block skew-x-12">{t("enterSound")}</span>
          </button>
          <button
            type="button"
            onClick={() => enter(false)}
            className="text-sm font-semibold underline underline-offset-4"
          >
            {t("enterMuted")}
          </button>
        </div>
      </div>
    </>
  );
}
