"use client";

import { Reveal } from "./Reveal";
import { ShieldCheck, Cpu, GaugeCircle, FileCheck2, Clock4, Layers } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Deterministic on-chain firewall",
    body: "Policy enforcement runs in replicated EVM — the single source of truth. No operator, node, or model can bypass it.",
  },
  {
    icon: Cpu,
    title: "TEE-attested reasoning",
    body: "The agent's LLM advisory runs once inside a hardware enclave and is verified by attestation, not re-run by every validator.",
  },
  {
    icon: GaugeCircle,
    title: "Circuit breaker",
    body: "A drawdown threshold auto-pauses the vault. Proven live on-chain — a 20% drop flips the breaker and halts execution.",
  },
  {
    icon: FileCheck2,
    title: "Tamper-evident audit",
    body: "Every allow/deny is anchored in an on-chain keccak hash-chain. Replay it to prove exactly what happened, and why.",
  },
  {
    icon: Clock4,
    title: "Timelocked policy",
    body: "Policy changes are owner-signed and timelocked — no silent mid-incident edits to spending rules or allowlists.",
  },
  {
    icon: Layers,
    title: "Ritual-native",
    body: "Built on superposition: a delegated call can read state a replicated transfer wrote in the same block. No other L1 does this natively.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-lime">What you get</p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Security that doesn&apos;t depend on the model behaving.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-gray-800 bg-ritual-elevated p-7 shadow-card transition-all hover:border-ritual-green/30 hover:shadow-glow-green">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-ritual-green/30 bg-ritual-green/10 text-ritual-green">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg text-gray-100">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
