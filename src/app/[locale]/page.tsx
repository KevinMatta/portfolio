import { getTranslations, setRequestLocale } from "next-intl/server";
import { PersonJsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero/hero";
import { Experience } from "@/components/experience/experience";
import { Lab } from "@/components/lab/lab";
import { StackQuery } from "@/components/stack/stack-query";
import { Projects } from "@/components/projects/projects";
import { Commit } from "@/components/commit/commit";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta" });

  return (
    <>
      <PersonJsonLd locale={locale} jobTitle={t("jobTitle")} description={t("description")} />
      <SiteHeader />
      <main>
        <Hero />
        <Experience />
        <Lab />
        <StackQuery />
        <Projects />
        <Commit />
      </main>
    </>
  );
}
