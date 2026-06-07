"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { BrandMark } from "@/components/BrandMark";
import { Social } from "@/components/Social";

export function CtaFooter() {
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="blob animate-floatA left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 bg-ritual-green/14" />
        <div className="absolute inset-0 grid-overlay" />
      </div>

      <div className="mx-auto max-w-[1400px] section-pad py-28 text-center">
        <Reveal>
          <h2
            className="mx-auto max-w-3xl font-display font-extrabold leading-[1.02] tracking-tight text-gray-100"
            style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
          >
            Give your agent <span className="text-gradient">limits it can&apos;t talk its way past.</span>
          </h2>
          <div className="mt-10 flex justify-center">
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-lg border border-ritual-green bg-ritual-green/10 px-7 py-4 text-sm font-semibold text-ritual-green transition-all hover:bg-ritual-green/20 hover:shadow-glow-green"
            >
              Launch the dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 section-pad py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-6 w-6" />
            <span className="font-display tracking-tight text-gray-200">RAMPART</span>
            <span className="hidden text-xs text-gray-600 sm:inline">the wall between AI and your assets</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-500">
            <Social />
            <a href="https://docs.ritualfoundation.org" target="_blank" rel="noreferrer" className="hover:text-gray-300">
              Ritual Chain
            </a>
            <a href={process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.ritualfoundation.org"} target="_blank" rel="noreferrer" className="hover:text-gray-300">
              Explorer
            </a>
            <span className="font-mono text-gray-600">testnet 1979</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
