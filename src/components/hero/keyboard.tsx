"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { meshBounds } from "@react-three/drei";
import {
  CanvasTexture,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Group,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { keyboardMaterials } from "@/lib/palette";
import { bump } from "@/lib/visit-store";

// Teclado 65% procedural: [código de KeyboardEvent, leyenda, ancho en unidades].
type KeyDef = [code: string, legend: string, width?: number];

const ROWS: KeyDef[][] = [
  [["Escape", "esc"], ["Digit1", "1"], ["Digit2", "2"], ["Digit3", "3"], ["Digit4", "4"], ["Digit5", "5"], ["Digit6", "6"], ["Digit7", "7"], ["Digit8", "8"], ["Digit9", "9"], ["Digit0", "0"], ["Minus", "-"], ["Equal", "="], ["Backspace", "⌫", 2]],
  [["Tab", "tab", 1.5], ["KeyQ", "Q"], ["KeyW", "W"], ["KeyE", "E"], ["KeyR", "R"], ["KeyT", "T"], ["KeyY", "Y"], ["KeyU", "U"], ["KeyI", "I"], ["KeyO", "O"], ["KeyP", "P"], ["BracketLeft", "["], ["BracketRight", "]"], ["Backslash", "\\", 1.5]],
  [["CapsLock", "caps", 1.75], ["KeyA", "A"], ["KeyS", "S"], ["KeyD", "D"], ["KeyF", "F"], ["KeyG", "G"], ["KeyH", "H"], ["KeyJ", "J"], ["KeyK", "K"], ["KeyL", "L"], ["Semicolon", ";"], ["Quote", "'"], ["Enter", "enter", 2.25]],
  [["ShiftLeft", "shift", 2.25], ["KeyZ", "Z"], ["KeyX", "X"], ["KeyC", "C"], ["KeyV", "V"], ["KeyB", "B"], ["KeyN", "N"], ["KeyM", "M"], ["Comma", ","], ["Period", "."], ["Slash", "/"], ["ShiftRight", "shift", 2.75]],
  [["ControlLeft", "ctrl", 1.25], ["MetaLeft", "◆", 1.25], ["AltLeft", "alt", 1.25], ["Space", "", 6.25], ["AltRight", "alt", 1.25], ["Fn", "fn", 1.25], ["ContextMenu", "▤", 1.25], ["ControlRight", "ctrl", 1.25]],
];

const DARK_KEYS = new Set(["Escape", "Enter", "Space", "Backspace"]);
const INTRO = ["KeyK", "KeyE", "KeyV", "KeyI", "KeyN"];
const UNIT = 1;
const GAP = 0.1;
const CAP_H = 0.42;
const TRAVEL = 0.2;

type KeyState = { group: Group | null; pressed: boolean; hover: boolean; y: number };

function legendTexture(text: string, width: number, dark: boolean, font: string) {
  const px = 96;
  const canvas = document.createElement("canvas");
  const face = UNIT - GAP - 0.08;
  canvas.width = Math.round((px * (width * UNIT - GAP - 0.08)) / face);
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = dark ? keyboardMaterials.legendOnDark : keyboardMaterials.legend;
  const single = text.length === 1;
  ctx.font = `${single ? 600 : 500} ${single ? 40 : 24}px ${font}`;
  ctx.textBaseline = "top";
  ctx.fillText(text, 16, 14);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function Keyboard({ font }: { font: string }) {
  const keys = useRef(new Map<string, KeyState>());

  const layout = useMemo(() => {
    const out: { code: string; legend: string; w: number; x: number; z: number }[] = [];
    ROWS.forEach((row, r) => {
      let x = 0;
      row.forEach(([code, legend, w = 1]) => {
        out.push({ code, legend, w, x: x + (w * UNIT) / 2 - 7.5, z: (r - 2) * UNIT });
        x += w * UNIT;
      });
    });
    return out;
  }, []);

  const geometries = useMemo(() => {
    const map = new Map<number, RoundedBoxGeometry>();
    for (const { w } of layout) {
      if (!map.has(w)) map.set(w, new RoundedBoxGeometry(w * UNIT - GAP, CAP_H, UNIT - GAP, 3, 0.09));
    }
    return map;
  }, [layout]);

  const caseGeometry = useMemo(() => new RoundedBoxGeometry(15.7, 0.62, 5.7, 4, 0.22), []);

  const materials = useMemo(
    () => ({
      cap: new MeshStandardMaterial({ color: keyboardMaterials.cap, roughness: 0.55 }),
      dark: new MeshStandardMaterial({ color: keyboardMaterials.capDark, roughness: 0.45 }),
      case: new MeshStandardMaterial({ color: keyboardMaterials.case, roughness: 0.3, metalness: 0.55 }),
    }),
    [],
  );

  const legends = useMemo(
    () =>
      new Map(
        layout.map(({ code, legend, w }) => [
          code,
          legend ? legendTexture(legend, w, DARK_KEYS.has(code), font) : null,
        ]),
      ),
    [layout, font],
  );

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      caseGeometry.dispose();
      legends.forEach((t) => t?.dispose());
      Object.values(materials).forEach((m) => m.dispose());
    },
    [geometries, caseGeometry, legends, materials],
  );

  // el teclado real mueve el teclado 3D.
  useEffect(() => {
    const set = (code: string, pressed: boolean) => {
      const key = keys.current.get(code);
      if (key) key.pressed = pressed;
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      set(e.code, true);
      bump("keys");
    };
    const up = (e: KeyboardEvent) => set(e.code, false);
    const blur = () => keys.current.forEach((k) => (k.pressed = false));
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  // Al cargar, el teclado escribe su propio nombre.
  useEffect(() => {
    const timers: number[] = [];
    INTRO.forEach((code, i) => {
      timers.push(window.setTimeout(() => setPressed(code, true), 700 + i * 140));
      timers.push(window.setTimeout(() => setPressed(code, false), 790 + i * 140));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  function setPressed(code: string, pressed: boolean) {
    const key = keys.current.get(code);
    if (key) key.pressed = pressed;
  }

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 38);
    keys.current.forEach((key) => {
      const target = key.pressed ? -TRAVEL : key.hover ? -TRAVEL * 0.45 : 0;
      key.y += (target - key.y) * k;
      if (key.group) key.group.position.y = key.y;
    });
  });

  const hover = (code: string, value: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const key = keys.current.get(code);
    if (key) key.hover = value;
  };

  return (
    <group>
      <mesh geometry={caseGeometry} material={materials.case} position={[0, -0.32, 0]} />
      {layout.map(({ code, w, x, z }) => {
        const dark = DARK_KEYS.has(code);
        const legend = legends.get(code);
        return (
          <group key={code} position={[x, CAP_H / 2, z]}>
            <group
              ref={(group) => {
                const current = keys.current.get(code);
                if (current) current.group = group;
                else keys.current.set(code, { group, pressed: false, hover: false, y: 0 });
              }}
            >
              <mesh
                geometry={geometries.get(w)}
                // Raycast contra la caja de la tecla, no contra cada triángulo.
                raycast={meshBounds}
                material={dark ? materials.dark : materials.cap}
                onPointerOver={hover(code, true)}
                onPointerOut={hover(code, false)}
                onPointerDown={() => {
                  setPressed(code, true);
                  bump("keys");
                }}
                onPointerUp={() => setPressed(code, false)}
              />
              {legend && (
                <mesh position={[0, CAP_H / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[w * UNIT - GAP - 0.08, UNIT - GAP - 0.08]} />
                  <meshBasicMaterial map={legend} transparent toneMapped={false} />
                </mesh>
              )}
            </group>
          </group>
        );
      })}
    </group>
  );
}
