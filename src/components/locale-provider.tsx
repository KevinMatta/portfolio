"use client";

import { createContext, use, useCallback, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import es from "../../messages/es.json";
import en from "../../messages/en.json";
import type { Locale } from "@/i18n/routing";
import { slabTransition } from "@/lib/slab-transition";

const MESSAGES = { es, en } as const;

const SwitchLocale = createContext<(next: Locale) => void>(() => {});


export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const switchLocale = useCallback((next: Locale) => {
    slabTransition(() => {
      setLocale(next);
      const root = document.documentElement;
      root.lang = next;
      document.title = MESSAGES[next].meta.title;
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
      const rest = location.pathname.replace(/^\/(es|en)(?=\/|$)/, "");
      history.replaceState(null, "", `/${next}${rest}${location.hash}`);
    });
  }, []);

  return (
    <SwitchLocale value={switchLocale}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="America/Tegucigalpa">
        {children}
      </NextIntlClientProvider>
    </SwitchLocale>
  );
}

export function useSwitchLocale() {
  return use(SwitchLocale);
}
