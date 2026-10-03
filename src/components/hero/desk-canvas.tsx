"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, EffectPass, RenderPass } from "postprocessing";
import { HalfFloatType, MathUtils, Vector3, type Group } from "three";
import { palette } from "@/lib/palette";
import { AsciiRevealEffect } from "./ascii-reveal-effect";
import { InkMask } from "./ink-mask";
import { Keyboard } from "./keyboard";

export type HeroScroll = { progress: number; reveal: number };

// Recorrido de cámara a lo largo del scroll del hero: de frente, rasante, cenital.
const SHOTS = [
  { pos: new Vector3(-2.5, 9, 12), look: new Vector3(-3.2, 0, 0.8) },
  { pos: new Vector3(11, 2.6, 6.5), look: new Vector3(-1.5, 0, 0) },
  { pos: new Vector3(-1, 19, 4), look: new Vector3(0.5, 0, 0) },
];

function useMonoFont() {
  const [font, setFont] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-martian")
      .trim();
    document.fonts.ready.then(() => {
      if (!cancelled) setFont(family || "monospace");
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return font;
}

function Rig({ scroll }: { scroll: RefObject<HeroScroll> }) {
  const look = useRef(new Vector3());
  const targetRef = useRef({ pos: new Vector3(), look: new Vector3() });

  useFrame(({ camera, pointer, size }, delta) => {
    const target = targetRef.current;
    const p = scroll.current.progress * (SHOTS.length - 1);
    const i = Math.min(Math.floor(p), SHOTS.length - 2);
    const f = MathUtils.smootherstep(p - i, 0, 1);
    target.pos.lerpVectors(SHOTS[i].pos, SHOTS[i + 1].pos, f);
    target.look.lerpVectors(SHOTS[i].look, SHOTS[i + 1].look, f);
    // En vertical (móvil) la cámara se aleja para que quepa el teclado.
    const zoom = MathUtils.clamp(1.15 / (size.width / size.height), 1, 2.1);
    target.pos.sub(target.look).multiplyScalar(zoom).add(target.look);
    target.pos.x += pointer.x * 0.9;
    target.pos.y += pointer.y * 0.5;

    const k = 1 - Math.exp(-delta * 6);
    camera.position.lerp(target.pos, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);
  });

  return null;
}

function Post({
  font,
  scroll,
  cellCss,
}: {
  font: string;
  scroll: RefObject<HeroScroll>;
  cellCss: number;
}) {
  const { gl, scene, camera, size, viewport } = useThree();

  const { composer, effect, ink } = useMemo(() => {
    const effect = new AsciiRevealEffect({ font, palette });
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType });
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new EffectPass(camera, effect));
    return { composer, effect, ink: new InkMask() };
  }, [gl, scene, camera, font]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    effect.setCellSize(cellCss, viewport.dpr);
    ink.setAspect(size.width / size.height);
  }, [composer, effect, ink, size, viewport.dpr, cellCss]);

  // Escuchamos en window: el texto del hero está encima del canvas.
  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) ink.move(x, y);
      else ink.active = false;
    };
    const leave = () => (ink.active = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [gl, ink]);

  useEffect(
    () => () => {
      composer.dispose();
      ink.dispose();
    },
    [composer, ink],
  );

  useFrame((_, delta) => {
    ink.update(gl, delta);
    // Objetos de three.js: se mutan cada frame a propósito, fuera de React.
    // eslint-disable-next-line react-hooks/immutability
    effect.mask = ink.texture;
    effect.reveal = scroll.current.reveal;
    composer.render(delta);
  }, 1);

  return null;
}

function Scene({
  font,
  scroll,
  cellCss,
}: {
  font: string;
  scroll: RefObject<HeroScroll>;
  cellCss: number;
}) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 12, 5]} intensity={2.4} />
      <directionalLight position={[-8, 4, -6]} intensity={0.6} color="#8c93ff" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer intensity={1.5} position={[-8, 2, 4]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer intensity={1.5} color="#8c93ff" position={[8, 2, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>
      <Rig scroll={scroll} />
      <Desk>
        <Keyboard font={font} />
      </Desk>
      <Post font={font} scroll={scroll} cellCss={cellCss} />
    </>
  );
}

function Desk({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.25) * 0.05 - 0.12;
    ref.current.position.y = Math.sin(t * 0.6) * 0.08;
  });
  return <group ref={ref}>{children}</group>;
}

export default function DeskCanvas({
  scroll,
  active,
}: {
  scroll: RefObject<HeroScroll>;
  active: boolean;
}) {
  const font = useMonoFont();
  const [mobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  // Resolución adaptativa: si el equipo no sostiene los fps, baja la resolución
  // del canvas (el ASCII casi no lo nota); si va sobrado, la sube.
  const maxDpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, mobile ? 1.25 : 1.5);
  const [dpr, setDpr] = useState(Math.min(1, maxDpr));

  if (!font) return null;

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 34, position: SHOTS[0].pos.toArray(), near: 0.5, far: 60 }}
      aria-hidden
    >
      <PerformanceMonitor
        bounds={(refreshRate) => (refreshRate > 90 ? [55, refreshRate] : [50, 58])}
        onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        flipflops={4}
        onFallback={() => setDpr(0.75)}
      />
      <Scene font={font} scroll={scroll} cellCss={mobile ? 12 : 11} />
    </Canvas>
  );
}
