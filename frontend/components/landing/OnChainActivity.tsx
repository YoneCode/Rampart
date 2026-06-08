"use client";

import { Reveal } from "./Reveal";
import { OnChainLedger } from "@/components/OnChainLedger";

export function OnChainActivity() {
  return (
    <section className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-green">Proof, not promises</p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Every contract. Every move. On the record.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            These are the real transactions that deployed, wired, and exercised Rampart on Ritual
            Chain — including the circuit breaker firing on-chain. Status and block are pulled live
            from the chain.
          </p>
        </Reveal>

        <Reveal delay={0.12} className="mt-12">
          <OnChainLedger />
        </Reveal>
      </div>
    </section>
  );
}
