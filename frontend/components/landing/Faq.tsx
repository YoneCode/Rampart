"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "How is this different from a multisig or a spending limit?",
    a: "Those are model-unaware. A manipulated agent passes the exact same thresholds a legitimate one would, because the check can't see intent. Rampart evaluates each proposed action against a deterministic policy and records the reason for every allow or deny — and pairs it with a TEE-attested LLM advisory.",
  },
  {
    q: "What if the AI model is wrong or gets manipulated?",
    a: "The LLM is advisory only. The binding decision is a deterministic firewall running on-chain in replicated EVM. Even a fully compromised model cannot push an action past your policy — we prove this in tests where the model says ALLOW and the firewall still blocks an over-limit transaction.",
  },
  {
    q: "Is Rampart custodial?",
    a: "No. Your funds and your policy live in your own vault contract. No operator can read or override it, and policy changes are owner-signed and timelocked. The trust root is the chain, not us.",
  },
  {
    q: "Which chain does it run on?",
    a: "Ritual Chain (testnet, id 1979) — the only L1 with native TEE-attested LLM and HTTP precompiles plus execution-aware consensus, which is what makes an on-chain reasoning-vs-execution split possible.",
  },
  {
    q: "How does the agent reason without leaking secrets?",
    a: "Reasoning runs inside a hardware enclave (TEE) via Ritual's LLM precompile. The result is verified by attestation rather than re-executed by every validator — so the model can think privately while its output stays provable.",
  },
  {
    q: "Can I see what the firewall decided?",
    a: "Yes. Every allow and deny is anchored on-chain in a tamper-evident keccak hash chain. You can browse them in the dashboard and verify each one on the block explorer.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative border-t border-white/5 py-24 lg:py-32">
      <div className="mx-auto max-w-[900px] section-pad">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ritual-pink">FAQ</p>
          <h2
            className="mt-4 font-display font-bold leading-tight tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
          >
            Questions, answered.
          </h2>
        </Reveal>

        <div className="mt-12 divide-y divide-gray-800 border-y border-gray-800">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none"
                >
                  <span className={`font-display text-lg transition-colors ${isOpen ? "text-ritual-green" : "text-gray-200"}`}>
                    {f.q}
                  </span>
                  <span className={`shrink-0 transition-colors ${isOpen ? "text-ritual-green" : "text-gray-500"}`}>
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-10 text-[15px] leading-relaxed text-gray-400">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
