import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/components/locale-provider";
import { siteUrl } from "@/lib/site";
import { profile } from "@/content/profile";
import "../globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  axes: ["wdth"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const url = `/${locale}`;
  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    applicationName: "Kevin Mata",
    authors: [{ name: "Kevin Mata", url: profile.github }],
    creator: "Kevin Mata",
    keywords: [
      "Kevin Mata",
      "software developer",
      "desarrollador de software",
      "Honduras",
      "San Pedro Sula",
      ".NET",
      "C#",
      "Angular",
      "React",
      "Next.js",
      "NestJS",
      "SQL Server",
      "PostgreSQL",
      "MCP",
      "portfolio",
    ],
    alternates: {
      canonical: url,
      languages: { es: "/es", en: "/en", "x-default": "/es" },
    },
    openGraph: {
      type: "profile",
      url,
      siteName: "Kevin Mata",
      title: t("title"),
      description: t("description"),
      locale: locale === "es" ? "es_HN" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_HN"],
      firstName: "Kevin",
      lastName: "Mata",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#2a2d36",
  colorScheme: "dark",
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${martian.variable}`}
    >
      <body>
        <LocaleProvider initialLocale={locale}>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
