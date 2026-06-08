"use client";

import { Reveal } from "./Reveal";
import { Brain, Lock, Timer } from "lucide-react";

const PROBLEMS = [
  {
    icon: Brain,
    title: "Prompt injection defeats guardrails",
    body: "System prompts and RLHF live in the same context window as the attack. A few crafted inputs and the agent confidently signs a transaction it should never make.",
  },
  {
    icon: Lock,
    title: "Wallets are model-unaware",
    body: "Multisigs and spending limits can't tell why a transfer happens. A manipulated agent passes every threshold a legitimate one would — the check is blind to intent.",
  },
  {
    icon: Timer,
    title: "Monitoring is too late",
    body: "External monitors react after a transaction hits the mempool. For an agent that is the authorized signer, the damage is already done at signing time.",
  },
];

export function Problem() {
  return (
    <section className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-pink">The problem</p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Autonomous agents are being handed the keys — with nothing watching the door.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-gray-800 bg-ritual-elevated p-7 shadow-card transition-colors hover:border-gray-700">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-ritual-pink/30 bg-ritual-pink/10 text-ritual-pink">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl text-gray-100">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
