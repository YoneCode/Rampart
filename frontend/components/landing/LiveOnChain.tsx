"use client";

import { Reveal } from "./Reveal";
import { addresses, isDeployed } from "@/lib/addresses";
import { shortAddr } from "@/lib/format";

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.ritualfoundation.org";

const CONTRACTS: { label: string; addr: string }[] = [
  { label: "RampartVault", addr: addresses.vault },
  { label: "RampartAgent", addr: addresses.agent },
  { label: "RampartSentinel", addr: addresses.sentinel },
  { label: "AgentRegistry", addr: addresses.registry },
  { label: "AuditAnchor", addr: addresses.audit },
];

export function LiveOnChain() {
  return (
    <section className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] section-pad">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-gold">Live on testnet</p>
              <h2
                className="mt-4 font-display font-bold leading-tight tracking-tight text-gray-100"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                Deployed, verified, and provable.
              </h2>
              <p className="mt-5 max-w-xl text-lg text-gray-400">
                Rampart is live on Ritual Chain (1979). The contracts below are real and verifiable
                on the explorer. The firewall blocks 5/5 attack scenarios in tests, and the circuit
                breaker has been tripped on-chain.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {[
                  "Deterministic firewall — fully trustless, replicated EVM",
                  "Circuit breaker fired live on a 20% drawdown",
                  "Every decision anchored in a tamper-evident hash chain",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 text-ritual-green">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-gray-800 bg-ritual-elevated p-6 shadow-card">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <span className="font-display text-lg text-gray-100">Deployed contracts</span>
                <span className="font-mono text-xs text-ritual-green">chain 1979</span>
              </div>
              <div className="divide-y divide-gray-800/70">
                {CONTRACTS.map((c) => (
                  <div key={c.label} className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-gray-400">{c.label}</span>
                    {isDeployed(c.addr as `0x${string}`) ? (
                      <a
                        href={`${EXPLORER}/address/${c.addr}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-ritual-green hover:underline"
                      >
                        {shortAddr(c.addr)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-gray-600">not set</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
