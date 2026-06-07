"use client";

import { Reveal } from "./Reveal";

const LAYERS = [
  {
    tag: "On-chain · replicated EVM",
    title: "The binding firewall",
    tagClass: "border-ritual-green/30 bg-ritual-green/10 text-ritual-green",
    dotClass: "bg-ritual-green",
    items: [
      "RampartVault holds funds + policy",
      "Deterministic evaluate() gate",
      "Nonce / replay protection",
      "Circuit breaker + timelock",
    ],
  },
  {
    tag: "Delegated · TEE",
    title: "The reasoning",
    tagClass: "border-ritual-pink/30 bg-ritual-pink/10 text-ritual-pink",
    dotClass: "bg-ritual-pink",
    items: [
      "LLM advisory (GLM-4.7-FP8)",
      "HTTP market data, attested",
      "Runs once, verified not replicated",
      "Never holds execution authority",
    ],
  },
  {
    tag: "On-chain · settlement",
    title: "The proof",
    tagClass: "border-ritual-lime/30 bg-ritual-lime/10 text-ritual-lime",
    dotClass: "bg-ritual-lime",
    items: [
      "AuditAnchor hash-chain",
      "Agent + model registry",
      "Scheduler-driven health checks",
      "Every decision is replayable",
    ],
  },
];

export function Architecture() {
  return (
    <section id="architecture" className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob animate-floatB right-[-10%] top-[20%] h-[34rem] w-[34rem] bg-ritual-green/10" />
      </div>
      <div className="mx-auto max-w-[1400px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-green">Architecture</p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Three layers. One shared state. Zero blind trust.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {LAYERS.map((l, i) => (
            <Reveal key={l.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-gray-800 bg-ritual-elevated p-7 shadow-card">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${l.tagClass}`}>
                  {l.tag}
                </span>
                <h3 className="mt-5 font-display text-xl text-gray-100">{l.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {l.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${l.dotClass}`} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-10 rounded-2xl border border-ritual-green/20 bg-ritual-green/[0.04] p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-green">Why Ritual</p>
            <p className="mt-3 max-w-3xl text-gray-300">
              Ritual is the only L1 where Rampart is even possible — the deterministic firewall and the
              attested AI advisory share one state machine, natively.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["TEE-attested precompiles", "Native LLM (0x0802) + HTTP (0x0801) run inside enclaves, verified by hardware attestation — no oracles, no bridges."],
                ["Execution-aware consensus", "The enshrined Scheduler + two-phase async settlement orchestrate reason → gate → settle as protocol-enforced steps."],
                ["Superposition", "A delegated TEE call can read state a replicated transfer wrote in the same block — impossible on any other chain."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <div className="font-display text-gray-100">{t}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-gray-400">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
