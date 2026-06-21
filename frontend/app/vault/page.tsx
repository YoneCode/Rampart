"use client";

import { useEffect, useState } from "react";
import { parseEther, formatEther, isAddress, zeroAddress, type Address } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useBalance,
  usePublicClient,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { AppHeader } from "@/components/AppHeader";
import { Reveal } from "@/components/landing/Reveal";
import { addresses } from "@/lib/addresses";
import { factoryAbi, vaultWriteAbi, vaultAbi } from "@/lib/abis";
import { fmtRitual, bps, shortAddr, DECISION_LABELS } from "@/lib/format";

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://explorer.ritualfoundation.org";
const ZERO32 = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export default function VaultConsole() {
  const { address, isConnected } = useAccount();
  const { login } = usePrivy();

  const { data: vaults, refetch: refetchVaults } = useReadContract({
    address: addresses.factory,
    abi: factoryAbi,
    functionName: "getVaults",
    args: [address ?? zeroAddress],
    query: { enabled: !!address },
  });

  return (
    <div className="min-h-screen bg-black bg-mesh">
      <AppHeader />
      <main className="mx-auto max-w-[1100px] section-pad py-10 lg:py-12">
        <Reveal>
          <h1 className="font-display font-bold tracking-tight text-gray-100" style={{ fontSize: "clamp(1.9rem,3.5vw,2.75rem)" }}>
            Deploy your firewall vault
          </h1>
          <p className="mt-2 max-w-2xl text-gray-400">
            Spin up your own on-chain policy firewall in one transaction. You own it. Set the rules,
            fund it, and every action your agent proposes is gated by the chain — not by the model.
          </p>
        </Reveal>

        {!isConnected ? (
          <Reveal delay={0.05}>
            <div className="mt-10 rounded-2xl border border-gray-800 bg-ritual-elevated p-8 text-center shadow-card">
              <p className="text-gray-300">Connect your wallet to deploy and manage vaults.</p>
              <button
                onClick={login}
                className="mt-5 rounded-lg border border-ritual-green bg-ritual-green/10 px-6 py-3 text-sm font-semibold text-ritual-green hover:bg-ritual-green/20 hover:shadow-glow-green"
              >
                Connect Wallet
              </button>
            </div>
          </Reveal>
        ) : (
          <>
            <Reveal delay={0.05} className="mt-8">
              <DeployForm onDeployed={() => refetchVaults()} />
            </Reveal>

            <Reveal delay={0.1} className="mt-8">
              <h2 className="font-display text-xl text-gray-100">Your vaults</h2>
              <div className="mt-4 space-y-4">
                {(vaults as Address[] | undefined)?.length ? (
                  (vaults as Address[]).map((v) => <VaultManager key={v} vault={v} owner={address!} />)
                ) : (
                  <div className="rounded-2xl border border-gray-800 bg-ritual-elevated p-6 text-sm text-gray-500 shadow-card">
                    No vaults yet — deploy one above.
                  </div>
                )}
              </div>
            </Reveal>
          </>
        )}
      </main>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-600">{hint}</span>}
    </label>
  );
}

const inputCls =
  "mt-1.5 w-full rounded-lg border border-gray-700 bg-ritual-surface px-3 py-2.5 text-sm text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ritual-green/50";

function DeployForm({ onDeployed }: { onDeployed: () => void }) {
  const [maxTx, setMaxTx] = useState("5");
  const [maxDaily, setMaxDaily] = useState("50");
  const [slip, setSlip] = useState("2");
  const [drawdown, setDrawdown] = useState("15");
  const [targets, setTargets] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) onDeployed();
  }, [isSuccess, onDeployed]);

  function submit() {
    setErr(null);
    try {
      const targetList = targets
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const t of targetList) if (!isAddress(t)) throw new Error(`Invalid address: ${t}`);

      writeContract({
        address: addresses.factory,
        abi: factoryAbi,
        functionName: "createVault",
        args: [
          {
            maxTxValueWei: parseEther(maxTx || "0"),
            maxDailySpendWei: parseEther(maxDaily || "0"),
            maxSlippageBps: Math.round(parseFloat(slip || "0") * 100),
            drawdownLimitBps: Math.round(parseFloat(drawdown || "0") * 100),
            defaultTtl: 0n,
          },
          targetList as Address[],
          [],
          zeroAddress, // controller defaults to you
          ZERO32,
        ],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "invalid input");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-ritual-elevated p-6 shadow-card">
      <h2 className="font-display text-xl text-gray-100">New vault policy</h2>
      <p className="mt-1 text-xs text-gray-500">These rules are enforced deterministically on-chain.</p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Max tx value (RITUAL)"><input className={inputCls} value={maxTx} onChange={(e) => setMaxTx(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Max daily spend (RITUAL)"><input className={inputCls} value={maxDaily} onChange={(e) => setMaxDaily(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Max slippage (%)"><input className={inputCls} value={slip} onChange={(e) => setSlip(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Drawdown breaker (%)"><input className={inputCls} value={drawdown} onChange={(e) => setDrawdown(e.target.value)} inputMode="decimal" /></Field>
        <div className="sm:col-span-2">
          <Field label="Allowlisted targets" hint="Comma/space separated addresses. Leave empty to deny all targets until you update the policy.">
            <textarea className={`${inputCls} h-20 font-mono text-xs`} value={targets} onChange={(e) => setTargets(e.target.value)} placeholder="0x..., 0x..." />
          </Field>
        </div>
      </div>
      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={isPending || confirming}
          className="rounded-lg border border-ritual-green bg-ritual-green/10 px-5 py-2.5 text-sm font-semibold text-ritual-green hover:bg-ritual-green/20 hover:shadow-glow-green disabled:opacity-50"
        >
          {isPending ? "Confirm in wallet…" : confirming ? "Deploying…" : "Deploy vault"}
        </button>
        {hash && (
          <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-ritual-green hover:underline">
            {isSuccess ? "✓ deployed" : "view tx"} · {shortAddr(hash)}
          </a>
        )}
        {isSuccess && (
          <button onClick={() => reset()} className="text-xs text-gray-500 hover:text-gray-300">deploy another</button>
        )}
      </div>
    </div>
  );
}

function VaultManager({ vault, owner }: { vault: Address; owner: Address }) {
  const client = usePublicClient();
  const { data: balance, refetch: refetchBal } = useBalance({ address: vault });
  const read = { address: vault, abi: vaultAbi } as const;
  const { data: policy } = useReadContract({ ...read, functionName: "policy" });
  const { data: paused, refetch: refetchPaused } = useReadContract({ ...read, functionName: "paused" });
  const { data: nonce, refetch: refetchNonce } = useReadContract({ ...read, functionName: "expectedNonce" });

  const p = policy as readonly [bigint, bigint, number, number, bigint] | undefined;

  const [target, setTarget] = useState("");
  const [value, setValue] = useState("0");
  const [slip, setSlip] = useState("1");
  const [preview, setPreview] = useState<string | null>(null);
  const [depAmt, setDepAmt] = useState("0.05");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { sendTransaction, data: depHash, isPending: depPending } = useSendTransaction();
  const { isSuccess: depDone } = useWaitForTransactionReceipt({ hash: depHash });

  useEffect(() => {
    if (isSuccess || depDone) {
      refetchBal();
      refetchPaused();
      refetchNonce();
    }
  }, [isSuccess, depDone, refetchBal, refetchPaused, refetchNonce]);

  function action() {
    return {
      nonce: (nonce as bigint) ?? 0n,
      target: (isAddress(target) ? target : zeroAddress) as Address,
      value: parseEther(value || "0"),
      callData: "0x" as const,
      tokenIn: zeroAddress as Address,
      amountIn: 0n,
      slippageBps: Math.round(parseFloat(slip || "0") * 100),
      deadline: 0n,
    };
  }

  async function doPreview() {
    setPreview(null);
    try {
      const code = await client!.readContract({ address: vault, abi: vaultWriteAbi, functionName: "evaluate", args: [action()] });
      setPreview(DECISION_LABELS[Number(code)] ?? `code ${code}`);
    } catch (e) {
      setPreview(e instanceof Error ? e.message : "preview failed");
    }
  }

  function execute() {
    writeContract({ address: vault, abi: vaultWriteAbi, functionName: "executeAction", args: [action()] });
  }
  function deposit() {
    sendTransaction({ to: vault, value: parseEther(depAmt || "0") });
  }
  function togglePause() {
    writeContract({ address: vault, abi: vaultWriteAbi, functionName: "setPaused", args: [!paused, paused ? "unpause" : "manual pause"] });
  }
  function withdrawAll() {
    writeContract({ address: vault, abi: vaultWriteAbi, functionName: "withdraw", args: [owner, (balance?.value ?? 0n)] });
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-ritual-elevated p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href={`${EXPLORER}/address/${vault}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-ritual-green hover:underline">
          {shortAddr(vault)} ↗
        </a>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Balance <span className="font-mono text-ritual-lime">{fmtRitual(balance?.value)} RITUAL</span></span>
          <span className={paused ? "text-ritual-pink" : "text-ritual-green"}>{paused ? "PAUSED" : "ARMED"}</span>
          {p && <span className="text-gray-500 font-mono">cap {fmtRitual(p[0])} · {bps(p[2])} slip · {bps(p[3])} dd</span>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* propose / firewall */}
        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
          <h3 className="font-display text-sm text-gray-200">Propose an action</h3>
          <div className="mt-3 space-y-2">
            <input className={inputCls} placeholder="target 0x…" value={target} onChange={(e) => setTarget(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder="value (RITUAL)" value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" />
              <input className={inputCls} placeholder="slippage %" value={slip} onChange={(e) => setSlip(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={doPreview} className="rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:border-gray-500">Preview verdict (free)</button>
            <button onClick={execute} disabled={isPending || confirming} className="rounded-lg border border-ritual-green px-3 py-2 text-xs font-semibold text-ritual-green hover:bg-ritual-green/10 disabled:opacity-50">
              {isPending ? "Confirm…" : confirming ? "Executing…" : "Execute on-chain"}
            </button>
          </div>
          {preview && (
            <p className={`mt-3 text-sm ${preview === "ALLOW" ? "text-ritual-green" : "text-ritual-pink"}`}>
              Firewall verdict: <span className="font-semibold">{preview}</span>
            </p>
          )}
          {hash && (
            <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" className="mt-2 block font-mono text-xs text-gray-500 hover:text-ritual-green">
              {isSuccess ? "✓ " : ""}{shortAddr(hash)}
            </a>
          )}
        </div>

        {/* owner controls */}
        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
          <h3 className="font-display text-sm text-gray-200">Owner controls</h3>
          <div className="mt-3 flex items-center gap-2">
            <input className={inputCls} value={depAmt} onChange={(e) => setDepAmt(e.target.value)} inputMode="decimal" />
            <button onClick={deposit} disabled={depPending} className="shrink-0 rounded-lg border border-ritual-lime/50 px-3 py-2 text-xs text-ritual-lime hover:bg-ritual-lime/10 disabled:opacity-50">
              {depPending ? "…" : "Deposit"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={togglePause} className="rounded-lg border border-ritual-gold/50 px-3 py-2 text-xs text-ritual-gold hover:bg-ritual-gold/10">
              {paused ? "Unpause" : "Pause"}
            </button>
            <button onClick={withdrawAll} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
              Withdraw all
            </button>
          </div>
          <p className="mt-3 text-[11px] text-gray-600">Next nonce: <span className="font-mono">{String(nonce ?? 0n)}</span> · you are the registered controller.</p>
        </div>
      </div>
    </div>
  );
}
