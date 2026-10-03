import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateImageMetadata() {
  return [{ id: "og", size, contentType, alt: "Kevin Mata" }];
}

// Archivo Black (OFL), incluida en el repo: el build no depende de la red.
async function archivo() {
  try {
    return await readFile(join(process.cwd(), "src/assets/fonts/ArchivoBlack-Regular.ttf"));
  } catch {
    return null;
  }
}

const ASCII = " .:-=+*o#%@";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const font = await archivo();

  // Un poco del mapa ASCII de fondo, determinista.
  const rows = Array.from({ length: 24 }, (_, y) =>
    Array.from({ length: 96 }, (_, x) => ASCII[Math.abs(Math.floor(Math.sin(x * 0.35 + y * 0.6) * 4 + Math.cos(y * 0.9 - x * 0.12) * 4)) % ASCII.length]).join(""),
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#2a2d36", position: "relative", padding: "56px 64px" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", opacity: 0.22, color: "#8c93ff", fontSize: 22, lineHeight: 1.05, padding: "20px 24px", fontFamily: "monospace" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>{r}</div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", transform: "rotate(-6deg) skewX(-12deg)", transformOrigin: "left", marginTop: 40 }}>
          <div style={{ fontFamily: font ? "Archivo" : "sans-serif", fontWeight: 400, fontSize: 170, lineHeight: 0.92, color: "#e6e7ec", letterSpacing: -4 }}>KEVIN</div>
          <div style={{ fontFamily: font ? "Archivo" : "sans-serif", fontWeight: 400, fontSize: 170, lineHeight: 0.92, color: "#e6e7ec", letterSpacing: -4, marginLeft: 110 }}>MATA</div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}>
            <div style={{ fontSize: 22, color: "#a3a8b8" }}>{t("role")}</div>
            <div style={{ fontSize: 40, color: "#e6e7ec", fontWeight: 700, marginTop: 8 }}>{t("tagline")}</div>
          </div>
          <div style={{ display: "flex", background: "#8c93ff", color: "#14172a", fontFamily: font ? "Archivo" : "sans-serif", fontSize: 30, fontWeight: 400, padding: "10px 22px", transform: "skewX(-12deg)" }}>BEGIN;</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Archivo", data: font, weight: 400, style: "normal" }] : undefined },
  );
}
