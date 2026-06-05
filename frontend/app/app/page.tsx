"use client";

import { useBalance, useReadContract } from "wagmi";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { OnChainLedger } from "@/components/OnChainLedger";
import { Reveal } from "@/components/landing/Reveal";
import { addresses, isDeployed } from "@/lib/addresses";
import { vaultAbi, auditAbi, agentAbi } from "@/lib/abis";
import { fmtRitual, bps, shortAddr, ADVISORY_LABELS, DECISION_LABELS } from "@/lib/format";

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.ritualfoundation.org";

export default function Dashboard() {
  const vaultLive = isDeployed(addresses.vault);
  const auditLive = isDeployed(addresses.audit);
  const agentLive = isDeployed(addresses.agent);

  const { data: balance } = useBalance({ address: addresses.vault, query: { enabled: vaultLive } });
  const vaultRead = { address: addresses.vault, abi: vaultAbi, query: { enabled: vaultLive } } as const;

  const { data: policy } = useReadContract({ ...vaultRead, functionName: "policy" });
  const { data: paused } = useReadContract({ ...vaultRead, functionName: "paused" });
  const { data: dailySpent } = useReadContract({ ...vaultRead, functionName: "currentDailySpent" });
  const { data: hwm } = useReadContract({ ...vaultRead, functionName: "highWaterMark" });
  const { data: nonce } = useReadContract({ ...vaultRead, functionName: "expectedNonce" });
  const { data: reporter } = useReadContract({ ...vaultRead, functionName: "reporter" });
  const { data: targetCount } = useReadContract({ ...vaultRead, functionName: "targetCount" });

  const { data: decisionCount } = useReadContract({
    address: addresses.audit, abi: auditAbi, functionName: "decisionCount",
    args: [addresses.vault], query: { enabled: auditLive },
  });
  const { data: lastAdvisory } = useReadContract({
    address: addresses.agent, abi: agentAbi, functionName: "lastAdvisory", query: { enabled: agentLive },
  });
  const { data: lastFirewallCode } = useReadContract({
    address: addresses.agent, abi: agentAbi, functionName: "lastFirewallCode", query: { enabled: agentLive },
  });
  const { data: lastActionHash } = useReadContract({
    address: addresses.agent, abi: agentAbi, functionName: "lastActionHash", query: { enabled: agentLive },
  });

  const ZERO_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const hasAssessment = agentLive && !!lastActionHash && lastActionHash !== ZERO_HASH;

  const p = policy as readonly [bigint, bigint, number, number, bigint] | undefined;
  const breakerTripped = Boolean(paused);

  return (
    <div className="min-h-screen bg-black bg-mesh">
      <AppHeader />

      <main className="mx-auto max-w-[1400px] section-pad py-10 lg:py-12">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1
                className="font-display font-bold tracking-tight text-gray-100"
                style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.75rem)" }}
              >
                Live Vault
              </h1>
              <p className="mt-2 text-gray-400">
                Real-time policy state, read directly from Ritual Chain.
              </p>
            </div>
            {vaultLive && (
              <a
                href={`${EXPLORER}/address/${addresses.vault}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-gray-700 px-3 py-2 font-mono text-xs text-gray-300 hover:border-gray-500"
              >
                {shortAddr(addresses.vault)} ↗
              </a>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.05} className="mt-8">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Vault Balance" icon="⇄" accent="lime"
              value={vaultLive ? `${fmtRitual(balance?.value)}` : "—"}
              sub={vaultLive ? "RITUAL held in custody" : "not deployed"} />
            <StatCard label="Daily Spend" icon="◎" accent="gold"
              value={p ? `${fmtRitual(dailySpent as bigint)}` : "—"}
              sub={p ? `cap ${fmtRitual(p[1])} / 24h` : "—"} />
            <StatCard label="Circuit Breaker" icon={breakerTripped ? "✗" : "✓"}
              accent={breakerTripped ? "pink" : "green"}
              value={vaultLive ? (breakerTripped ? "TRIPPED" : "ARMED") : "—"}
              sub={p ? `drawdown limit ${bps(p[3])}` : "—"} />
            <StatCard label="Decisions Anchored" icon="⌗" accent="green"
              value={auditLive ? String(decisionCount ?? 0n) : "—"} sub="tamper-evident audit trail" />
          </section>
        </Reveal>

        <Reveal delay={0.1} className="mt-6">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-ritual-elevated p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-gray-100">Active Policy</h2>
                <span className="text-xs uppercase tracking-wider text-gray-500">enforced on-chain</span>
              </div>
              <div className="mt-4 h-px bg-gradient-to-r from-ritual-green/30 via-gray-800 to-transparent" />
              <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row label="Max tx value" value={p ? `${fmtRitual(p[0])} RITUAL` : "—"} />
                <Row label="Max daily spend" value={p ? `${fmtRitual(p[1])} RITUAL` : "—"} />
                <Row label="Max slippage" value={p ? bps(p[2]) : "—"} />
                <Row label="Drawdown limit" value={p ? bps(p[3]) : "—"} />
                <Row label="Allowlisted targets" value={vaultLive ? String(targetCount ?? 0n) : "—"} />
                <Row label="Next nonce" value={vaultLive ? String(nonce ?? 0n) : "—"} />
                <Row label="High-water mark" value={vaultLive ? `${fmtRitual(hwm as bigint)} RITUAL` : "—"} />
                <Row label="Reporter" value={vaultLive ? shortAddr(reporter as string) : "—"} />
              </dl>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-ritual-elevated p-6 shadow-card">
              <div className="flex items-center gap-2">
                <span className="font-mono text-ritual-pink">◇</span>
                <h2 className="font-display text-lg text-gray-100">Agent Advisory</h2>
              </div>
              <p className="mt-1 text-xs text-gray-500">LLM verdict (GLM-4.7-FP8, TEE) — advisory only.</p>
              <div className="mt-5 space-y-3">
                {hasAssessment ? (
                  <>
                    <Row label="Last LLM verdict" value={ADVISORY_LABELS[Number(lastAdvisory ?? 0)] ?? "—"} />
                    <Row label="Firewall decision" value={DECISION_LABELS[Number(lastFirewallCode ?? 0)] ?? "—"} />
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No LLM assessment run yet — the advisory step is cost-deferred. The deterministic
                    firewall is active and has anchored {auditLive ? String(decisionCount ?? 0n) : "0"} decisions.
                  </p>
                )}
              </div>
              <div className="mt-5 rounded-lg border border-ritual-pink/20 bg-ritual-pink/5 p-3">
                <p className="text-xs text-gray-400">
                  Defense in depth: even if the model is manipulated into approving an action, the
                  deterministic on-chain firewall independently blocks policy violations.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.12} className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-gray-100">On-chain transaction ledger</h2>
          </div>
          <OnChainLedger />
        </Reveal>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="font-mono text-sm text-gray-300">{value}</dd>
    </div>
  );
}
