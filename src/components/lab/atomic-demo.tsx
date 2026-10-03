"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { bump } from "@/lib/visit-store";

const LINES = [
  { product: "coffee", qty: 2, price: 4.5 },
  { product: "bread", qty: 6, price: 0.6 },
  { product: "milk", qty: 3, price: 1.4 },
  { product: "sugar", qty: 1, price: 1.9 },
] as const;
const FAILING_LINE = 3;
const TOTAL = LINES.reduce((sum, l) => sum + l.qty * l.price, 0);
const STEP_MS = 280;

type Row =
  | { kind: "begin" | "commit" | "rollback" }
  | { kind: "header"; status: Status }
  | { kind: "line"; n: number; status: Status };
type Status = "ok" | "fail" | "undone";
type Result = "commit" | "rollback" | "partial" | null;

const money = (n: number) => `$${n.toFixed(2)}`;

export function AtomicDemo() {
  const t = useTranslations("exec.atomic");
  const [useTx, setUseTx] = useState(true);
  const [fault, setFault] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function save() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRows([]);
    setResult(null);
    setRunning(true);

    // Guion de la escritura: cada paso se muestra con un pequeño retraso.
    const steps: (() => void)[] = [];
    const push = (row: Row) => steps.push(() => setRows((r) => [...r, row]));

    if (useTx) push({ kind: "begin" });
    push({ kind: "header", status: "ok" });
    let failed = false;
    for (let n = 1; n <= LINES.length; n++) {
      if (fault && n === FAILING_LINE) {
        push({ kind: "line", n, status: "fail" });
        failed = true;
        break;
      }
      push({ kind: "line", n, status: "ok" });
    }

    if (!failed) {
      if (useTx) push({ kind: "commit" });
      steps.push(() => finish("commit"));
    } else if (useTx) {
      // ROLLBACK: todo lo escrito dentro de la transacción se deshace.
      steps.push(() => {
        setRows((r) => [
          ...r.map((row) => ("status" in row && row.status === "ok" ? { ...row, status: "undone" as const } : row)),
          { kind: "rollback" },
        ]);
        bump("rollbacks");
        finish("rollback");
      });
    } else {
      steps.push(() => finish("partial"));
    }

    steps.forEach((step, i) => timers.current.push(window.setTimeout(step, (i + 1) * STEP_MS)));
  }

  function finish(r: Result) {
    setResult(r);
    setRunning(false);
  }

  const stored = rows.filter((r) => "status" in r && r.status === "ok").length;
  const savedSum = rows.reduce((sum, r) => {
    if (r.kind !== "line" || r.status !== "ok") return sum;
    const l = LINES[r.n - 1];
    return sum + l.qty * l.price;
  }, 0);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex flex-col items-start gap-3">
        <Toggle label={t("useTx")} on={useTx} disabled={running} onChange={setUseTx} />
        <Toggle label={t("fault")} on={fault} disabled={running} onChange={setFault} />
        <button
          type="button"
          onClick={save}
          disabled={running}
          className="mt-2 -skew-x-12 bg-ink px-6 py-3 text-lg font-bold text-paper transition-transform duration-75 active:translate-y-1 disabled:opacity-60"
        >
          <span className="block skew-x-12">{running ? t("saving") : t("save")}</span>
        </button>
      </div>

      <div className="min-w-0">
        <ol className="mono min-h-[12.5rem] text-sm" aria-live="polite">
          {rows.map((row, i) => (
            <li
              key={i}
              className={`grid animate-[slam_.24s_cubic-bezier(.16,1,.3,1)] grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-dashed border-ink/25 py-1.5 ${
                "status" in row && row.status === "undone" ? "text-ink-soft line-through" : ""
              }`}
            >
              <span className="truncate">{describe(row)}</span>
              <span className={statusClass(row)}>{statusText(row)}</span>
            </li>
          ))}
        </ol>

        <p className="mono mt-3 text-sm text-ink-soft">{t("stored", { count: stored })}</p>
        {result && (
          <p
            className={`mt-3 max-w-[46ch] animate-[slam_.28s_cubic-bezier(.16,1,.3,1)] px-3 py-2 font-semibold ${
              result === "partial" ? "bg-accent text-on-accent" : "bg-ink text-paper"
            }`}
          >
            {result === "partial" ? t("partial", { total: TOTAL.toFixed(2), sum: savedSum.toFixed(2) }) : t(result)}
          </p>
        )}
      </div>
    </div>
  );

  function describe(row: Row) {
    switch (row.kind) {
      case "begin":
        return "BEGIN TRANSACTION";
      case "commit":
        return "COMMIT";
      case "rollback":
        return "ROLLBACK";
      case "header":
        return `INSERT ${t("invoice")} · ${money(TOTAL)}`;
      case "line": {
        const l = LINES[row.n - 1];
        return `INSERT ${t("line", { n: row.n })} · ${t(`products.${l.product}`)} ×${l.qty} · ${money(l.qty * l.price)}`;
      }
    }
  }

  function statusText(row: Row) {
    if (!("status" in row)) return "";
    if (row.status === "fail") return `✗ ${t("outOfStock")}`;
    if (row.status === "undone") return "↺";
    return "✓";
  }

  function statusClass(row: Row) {
    if (row.kind === "rollback" || ("status" in row && row.status === "fail")) return "font-bold text-accent";
    return "";
  }
}

function Toggle({
  label,
  on,
  disabled,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 text-left font-semibold disabled:opacity-60"
    >
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 -skew-x-12 border-2 border-ink transition-colors duration-150 ${on ? "bg-accent" : "bg-transparent"}`}
      >
        <span
          className={`absolute top-0.5 size-4 bg-ink transition-transform duration-150 ease-slam ${on ? "translate-x-[1.35rem]" : "translate-x-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}
