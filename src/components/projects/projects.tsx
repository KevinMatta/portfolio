"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { projects, type Project } from "@/content/profile";
import { SectionTitle } from "@/components/ui/section-title";
import DecryptedText from "@/components/reactbits/DecryptedText";

export function Projects() {
  const t = useTranslations();

  return (
    <section
      id="insert"
      aria-labelledby="insert-title"
      className="slab relative -mt-[4vw] bg-ink px-4 pb-[12vw] pt-[10vw] text-paper md:px-10"
    >
      <SectionTitle id="insert-title" verb="INSERT" label={t("nav.steps.insert")} />
      <p className="mt-6 max-w-[34ch] text-[clamp(1.25rem,2.2vw,1.9rem)] font-medium leading-tight">
        {t("insert.intro")}
      </p>

      <ol className="mt-[6vw]">
        {projects.map((project, i) => (
          <li key={project.slug} style={{ marginLeft: `${i * 4}vw` }}>
            <ProjectRow project={project} n={i + 1} />
          </li>
        ))}
      </ol>
    </section>
  );
}

const SLAB =
  "absolute inset-0 -z-10 bg-accent transition-[clip-path] duration-300 ease-slam [clip-path:polygon(0_0,0_0,0_100%,0_100%)] group-focus-within:[clip-path:polygon(0_0,100%_0,97%_100%,0_100%)] group-hover:[clip-path:polygon(0_0,100%_0,97%_100%,0_100%)]";

function ProjectRow({ project, n }: { project: Project; n: number }) {
  const t = useTranslations("insert");
  const locale = useLocale() as "es" | "en";
  const live = project.status === "live";
  const title = live && project.title ? project.title[locale] : t("placeholderTitle", { n });
  const body = live && project.summary ? project.summary[locale] : t("placeholderBody");

  // Proyecto publicado: misma altura que una fila pendiente; la captura de la web va a la derecha.
  if (live) {
    return (
      <article className="group relative isolate grid gap-4 border-t-2 border-paper/20 py-6 md:grid-cols-[1fr_minmax(0,24rem)] md:items-end md:py-8">
        <span aria-hidden className={SLAB} />
        <div className="px-2">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-2.5 bg-paper" aria-hidden />
            {t("live")}
            {project.year && <span className="text-paper/60">{project.year}</span>}
          </p>
          <h3 className="display text-[clamp(3.4rem,9vw,9rem)] transition-[font-variation-settings] duration-300 ease-slam group-hover:[font-variation-settings:'wdth'_110]">
            {title}
          </h3>
          <p className="mt-4 max-w-[52ch] text-base leading-snug md:text-lg">{body}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-semibold">
            {project.href && (
              <a href={project.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {t("visit")}
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {t("code")}
              </a>
            )}
            {project.stack && <span className="mono text-xs font-normal opacity-70">{project.stack.join(" / ")}</span>}
          </p>
        </div>

        {project.image && (
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${t("visit")}: ${title}`}
            className="block overflow-hidden px-2 md:pb-1"
          >
            <Image
              src={project.image}
              alt={title}
              width={1600}
              height={1000}
              sizes="(min-width: 768px) 24rem, 100vw"
              className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-slam [clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] group-hover:scale-[1.04]"
            />
          </a>
        )}
      </article>
    );
  }

  return (
    <article className="group relative isolate grid gap-4 border-t-2 border-paper/20 py-6 md:grid-cols-[1fr_minmax(0,22rem)] md:items-end md:py-8">
      <span aria-hidden className={SLAB} />
      <div className="px-2">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <span className="inline-block size-2.5 animate-pulse bg-accent group-hover:bg-paper" aria-hidden />
          {t("pending")}
        </p>
        <h3 className="display text-[clamp(3.6rem,11vw,10rem)] transition-[font-variation-settings] duration-300 ease-slam group-hover:[font-variation-settings:'wdth'_110]">
          <DecryptedText text={title} animateOn="hover" speed={30} characters=".:-=+*#%@" />
        </h3>
      </div>
      <div className="px-2 md:pb-3">
        <p className="text-lg leading-snug">{body}</p>
      </div>
    </article>
  );
}
