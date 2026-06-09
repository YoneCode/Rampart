import { formatEther } from "viem";

export function shortAddr(addr?: string): string {
  if (!addr || addr.length < 10) return addr ?? "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtRitual(wei?: bigint, maxFractionDigits = 4): string {
  if (wei === undefined) return "—";
  const n = Number(formatEther(wei));
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function bps(value?: number | bigint): string {
  if (value === undefined) return "—";
  const v = typeof value === "bigint" ? Number(value) : value;
  return `${(v / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

/** Map DecisionCode enum (uint8) → human label. Mirrors RampartTypes.DecisionCode. */
export const DECISION_LABELS: Record<number, string> = {
  0: "ALLOW",
  1: "DENY · paused",
  2: "DENY · bad nonce",
  3: "DENY · expired",
  4: "DENY · value limit",
  5: "DENY · daily limit",
  6: "DENY · target not allowed",
  7: "DENY · token not allowed",
  8: "DENY · slippage",
};

export const ADVISORY_LABELS: Record<number, string> = {
  0: "INCONCLUSIVE",
  1: "ALLOW",
  2: "DENY",
};
