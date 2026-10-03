"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import VariableProximity from "@/components/reactbits/VariableProximity";
import DecryptedText from "@/components/reactbits/DecryptedText";
import type { HeroScroll } from "./desk-canvas";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DeskCanvas = dynamic(() => import("./desk-canvas"), { ssr: false });

export function Hero() {
  const t = useTranslations("hero");
  const section = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const scroll = useRef<HeroScroll>({ progress: 0, reveal: 0 });
  const [active, setActive] = useState(true);

  // El canvas solo dibuja mientras el hero está en pantalla.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          scroll.current.progress = gsap.utils.clamp(0, 1, self.progress / 0.8);
          scroll.current.reveal = gsap.utils.mapRange(0.84, 1, 0, 1, self.progress);
        },
      });

      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          // La salida de las losas depende del ancho de la ventana.
          invalidateOnRefresh: true,
        },
      });

      // fromTo con valores explícitos: el scroll nunca "hereda" un estado intermedio.
      tl.fromTo(
        ".hero-name",
        { yPercent: 0, skewY: 0, autoAlpha: 1 },
        { yPercent: -60, skewY: -6, autoAlpha: 0, duration: 0.6 },
        0.05,
      ).fromTo(".hero-meta", { y: 0, autoAlpha: 1 }, { y: -40, autoAlpha: 0, duration: 0.4 }, 0.05);


      const beats = gsap.utils.toArray<HTMLElement>(".hero-beat");
      gsap.set(beats, { x: 0, y: 0, xPercent: -115, yPercent: -50, visibility: "visible" });
      beats.forEach((beat, i) => {
        const at = 0.55 + i * 0.95;
        tl.fromTo(
          beat,
          { xPercent: -115, skewX: -14, immediateRender: false },
          { xPercent: 0, skewX: 0, duration: 0.2 },
          at,
        ).to(
          beat,
          // Sale por completo de la pantalla: 120% de su ancho no bastaba en PC
          // y las losas se amontonaban a la derecha.
          { x: () => window.innerWidth + 80, skewX: 10, duration: 0.18, ease: "power3.in" },
          at + 0.74,
        );
      });

      // Entrada: el nombre llega de golpe desde la izquierda, inclinado.
      gsap.from(".hero-name .line", {
        xPercent: -18,
        skewX: -22,
        autoAlpha: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.09,
        delay: 0.15,
        clearProps: "transform,opacity,visibility",
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} id="begin" className="relative h-[420vh]" aria-labelledby="hero-name">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="absolute inset-0">
          <DeskCanvas scroll={scroll} active={active} />
        </div>

        <div className="pointer-events-none relative flex h-full flex-col justify-between px-4 pb-6 pt-20 md:px-10 md:pb-10">
          <div className="hero-name">
            {/* Letras inclinadas como los paralelogramos de la web, y todo el bloque en diagonal. */}
            <h1
              id="hero-name"
              ref={nameRef}
              className="display origin-left -rotate-6 text-[25vw] text-ink md:mt-[2vw] md:text-[clamp(4.25rem,15.5vw,15.5rem)]"
            >
              <span className="block">
                <span className="line inline-block">
                  <span className="inline-block -skew-x-12">
                  <VariableProximity
                    label="KEVIN"
                    fromFontVariationSettings="'wdth' 62, 'wght' 900"
                    toFontVariationSettings="'wdth' 125, 'wght' 300"
                    containerRef={nameRef}
                    radius={220}
                    falloff="gaussian"
                    style={{ fontFamily: "inherit" }}
                  />
                  </span>
                </span>
              </span>
              <span className="mt-[0.06em] block pl-[0.55em]">
                <span className="line inline-block">
                  <span className="inline-block -skew-x-12">
                  <VariableProximity
                    label="MATA"
                    fromFontVariationSettings="'wdth' 62, 'wght' 900"
                    toFontVariationSettings="'wdth' 125, 'wght' 300"
                    containerRef={nameRef}
                    radius={220}
                    falloff="gaussian"
                    style={{ fontFamily: "inherit" }}
                  />
                  </span>
                </span>
              </span>
            </h1>
          </div>

          <div className="hero-meta grid gap-6 [&>*]:animate-[rise_.5s_.55s_cubic-bezier(.16,1,.3,1)_both] [&>*+*]:[animation-delay:.63s] md:grid-cols-[minmax(0,34rem)_1fr] md:items-end">
            <div className="bg-paper/90 p-3 md:-ml-3">
              <p className="text-sm text-ink-soft">{t("role")}</p>
              <p className="mt-2 text-[clamp(1.35rem,2.6vw,2.1rem)] font-semibold leading-[1.05] [font-variation-settings:'wdth'_80]">
                <DecryptedText
                  text={t("tagline")}
                  animateOn="view"
                  sequential
                  speed={18}
                  characters=".:-=+*#%@"
                  encryptedClassName="text-accent"
                />
              </p>
            </div>
            <div className="flex items-end justify-between gap-4 text-sm md:justify-end md:gap-10">
              <p className="hidden max-w-[22ch] text-ink-soft md:block">{t("hint")}</p>
              <p className="flex items-center gap-2 font-semibold">
                <span className="inline-block h-6 w-[3px] origin-top animate-[drip_1.4s_ease-in-out_infinite] bg-accent" />
                {t("scroll")}
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {(["one", "two", "three"] as const).map((beat) => (
            <p
              key={beat}
              className="hero-beat invisible absolute left-0 top-0 w-[min(92vw,58rem)] bg-ink py-5 pl-4 pr-10 text-[clamp(1.6rem,4.2vw,3.6rem)] font-black leading-[0.95] text-paper [clip-path:polygon(0_0,100%_0,94%_100%,0_100%)] [font-variation-settings:'wdth'_70] md:pl-10"
            >
              {t(`beats.${beat}`)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
