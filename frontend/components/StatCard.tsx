import type { ReactNode } from "react";

type Accent = "green" | "pink" | "gold" | "lime" | "neutral";

const ACCENT: Record<Accent, string> = {
  green: "text-ritual-green",
  pink: "text-ritual-pink",
  gold: "text-ritual-gold",
  lime: "text-ritual-lime",
  neutral: "text-gray-100",
};

export function StatCard({
  label,
  value,
  sub,
  accent = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: Accent;
  icon?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-ritual-elevated p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
        {icon && <span className={`font-mono text-sm ${ACCENT[accent]}`}>{icon}</span>}
      </div>
      <div className={`mt-3 font-mono text-2xl ${ACCENT[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
