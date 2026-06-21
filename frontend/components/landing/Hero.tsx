"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { CityBackdrop } from "./CityBackdrop";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* base glow (always; also the fallback when the 3D city is disabled) */}
        <div className="blob animate-floatA left-[-10%] top-[-10%] h-[40rem] w-[40rem] bg-ritual-green/12" />
        <div className="blob animate-floatB right-[-12%] top-[6%] h-[34rem] w-[34rem] bg-ritual-pink/10" />
        {/* animated 3D neon city (desktop + motion-ok) */}
        <CityBackdrop />
        {/* legibility overlays — keep the hero copy crisp over the city */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute inset-0 noise opacity-[0.03]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-ritual-green/25 bg-ritual-green/5 px-3.5 py-1.5 text-xs text-ritual-green"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Live on Ritual Chain · 1979 · TEE-attested
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-7 max-w-5xl font-display font-extrabold leading-[0.98] tracking-tight text-gray-100"
          style={{ fontSize: "clamp(2.75rem, 7vw, 6rem)" }}
        >
          The wall between
          <br />
          <span className="text-gradient">AI and your assets.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mt-7 max-w-2xl text-lg leading-relaxed text-gray-400 sm:text-xl"
        >
          Rampart is an attested, on-chain policy firewall between an autonomous agent&apos;s
          reasoning and its right to move funds. Manipulate the model all you want — the chain
          still says <span className="text-ritual-pink">no</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link
            href="/vault"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-ritual-green bg-ritual-green/10 px-6 py-3.5 text-sm font-semibold text-ritual-green transition-all hover:bg-ritual-green/20 hover:shadow-glow-green"
          >
            Deploy your vault
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-6 py-3.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100"
          >
            View the live vault
          </Link>
        </motion.div>

        {/* mini proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-16 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-800 bg-gray-800 sm:grid-cols-4"
        >
          {[
            ["5/5", "attacks blocked"],
            ["100%", "on-chain enforcement"],
            ["0", "operator trust"],
            ["350ms", "block time"],
          ].map(([v, l]) => (
            <div key={l} className="bg-black px-5 py-5">
              <div className="font-mono text-2xl text-ritual-lime">{v}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-gray-500">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
