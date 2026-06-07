"use client";

import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    title: "Propose",
    accent: "text-ritual-pink",
    ring: "border-ritual-pink/30 bg-ritual-pink/10 text-ritual-pink",
    body: "The agent reasons off-chain inside a TEE (Ritual's LLM precompile, GLM-4.7-FP8) and proposes an action. Non-deterministic and manipulable — by design, it has no authority of its own.",
  },
  {
    n: "02",
    title: "Gate",
    accent: "text-ritual-green",
    ring: "border-ritual-green/30 bg-ritual-green/10 text-ritual-green",
    body: "A deterministic firewall runs on-chain in replicated EVM, checking the action against your policy: value caps, allowlists, slippage, daily limits, nonce. Fully trustless — no TEE required to enforce it.",
  },
  {
    n: "03",
    title: "Attest",
    accent: "text-ritual-gold",
    ring: "border-ritual-gold/30 bg-ritual-gold/10 text-ritual-gold",
    body: "The LLM verdict and the firewall decision are bound together and signed. The model is advisory; the on-chain rules are binding. Defense in depth — a fooled model still can't exceed policy.",
  },
  {
    n: "04",
    title: "Settle",
    accent: "text-ritual-lime",
    ring: "border-ritual-lime/30 bg-ritual-lime/10 text-ritual-lime",
    body: "Only actions that pass execute. Every allow and deny is anchored on-chain in a tamper-evident hash chain — a complete, verifiable audit trail anyone can replay.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-green">How it works</p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Reasoning proposes. The chain decides.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            Rampart splits an agent into two: the part that thinks, and the part that&apos;s allowed
            to act. They never share trust.
          </p>
        </Reveal>

        <div className="relative mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="relative h-full rounded-2xl border border-gray-800 bg-ritual-elevated p-7 shadow-card">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg border font-mono ${s.ring}`}>
                  {s.n}
                </div>
                <h3 className={`mt-5 font-display text-xl ${s.accent}`}>{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <p className="mt-8 text-center text-xs text-gray-600">
            Each step is a separate transaction, orchestrated by Ritual&apos;s Scheduler and
            two-phase async delivery — honoring the chain&apos;s one-async-call-per-tx rule.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
