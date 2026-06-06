"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ritualChain } from "@/lib/chain";
import { shortAddr } from "@/lib/format";
import { BrandMark } from "@/components/BrandMark";

export function AppHeader() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const onRitual = chainId === ritualChain.id;
  const wrongChain = authenticated && !onRitual;
  const display = address ?? user?.wallet?.address;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7" />
            <span className="font-display text-xl tracking-tight text-gray-100">RAMPART</span>
          </Link>
          <Link href="/" className="hidden text-xs text-gray-500 hover:text-gray-300 sm:block">
            ← Back to site
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={[
              "hidden items-center gap-2 rounded-lg border px-3 py-2 font-mono text-xs sm:inline-flex",
              onRitual ? "border-ritual-green/30 text-ritual-green" : "border-gray-700 text-gray-400",
            ].join(" ")}
          >
            <span className={`h-2 w-2 rounded-full ${onRitual ? "bg-ritual-green" : "bg-gray-600"}`} />
            Ritual · 1979
          </span>

          {wrongChain && (
            <button
              onClick={() => switchChain({ chainId: ritualChain.id })}
              disabled={isPending}
              className="rounded-lg border border-ritual-gold/60 bg-ritual-gold/10 px-3 py-2 text-sm text-ritual-gold hover:bg-ritual-gold/20"
            >
              {isPending ? "Switching…" : "Switch network"}
            </button>
          )}

          {!authenticated ? (
            <button
              onClick={login}
              disabled={!ready}
              className="rounded-lg border border-ritual-green px-4 py-2 text-sm font-semibold text-ritual-green transition-all hover:bg-ritual-green/10 hover:shadow-glow-green disabled:opacity-50"
            >
              {ready ? "Connect Wallet" : "Loading…"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-gray-700 bg-ritual-surface px-3 py-2 font-mono text-xs text-gray-300">
                {shortAddr(display)}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-200"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
