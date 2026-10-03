"use client";

import { useSyncExternalStore } from "react";

export type Visit = {
  startedAt: number;
  keys: number;
  offlineSales: number;
  payTaps: number;
  charges: number;
  rollbacks: number;
};

let state: Visit = {
  startedAt: Date.now(),
  keys: 0,
  offlineSales: 0,
  payTaps: 0,
  charges: 0,
  rollbacks: 0,
};
const listeners = new Set<() => void>();

export function bump(field: Exclude<keyof Visit, "startedAt">, by = 1) {
  state = { ...state, [field]: state[field] + by };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVisit() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}
