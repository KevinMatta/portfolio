"use client";

import { useTranslations } from "next-intl";
import { SectionTitle } from "@/components/ui/section-title";
import { OfflineDemo } from "./offline-demo";
import { IdempotencyDemo } from "./idempotency-demo";
import { AtomicDemo } from "./atomic-demo";

export function Lab() {
  const t = useTranslations();

  return (
    <section
      id="exec"
      aria-labelledby="exec-title"
      className="slab relative -mt-[4vw] bg-paper-2 px-4 pb-[12vw] pt-[10vw] md:px-10"
    >
      <SectionTitle id="exec-title" verb="EXEC" label={t("nav.steps.exec")} />
      <p className="mt-6 max-w-[34ch] text-[clamp(1.25rem,2.2vw,1.9rem)] font-medium leading-tight">
        {t("exec.intro")}
      </p>

      <div className="mt-[8vw] grid gap-[10vw] md:gap-[7vw]">
        <Demo name={t("exec.offline.name")} lead={t("exec.offline.lead")} side="left">
          <OfflineDemo />
        </Demo>
        <Demo name={t("exec.idempotency.name")} lead={t("exec.idempotency.lead")} side="right">
          <IdempotencyDemo />
        </Demo>
        <Demo name={t("exec.atomic.name")} lead={t("exec.atomic.lead")} side="left">
          <AtomicDemo />
        </Demo>
      </div>
    </section>
  );
}

function Demo({
  name,
  lead,
  side,
  children,
}: {
  name: string;
  lead: string;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <article
      className={`grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-12 ${
        side === "right" ? "md:ml-[12vw]" : "md:mr-[8vw]"
      }`}
    >
      <header>
        <h3 className="display text-[clamp(3rem,7vw,6rem)]">{name}</h3>
        <p className="mt-3 max-w-[30ch] text-lg leading-snug text-ink-soft">{lead}</p>
      </header>
      <div>{children}</div>
    </article>
  );
}
