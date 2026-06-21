<div align="center">

<img src="frontend/app/icon.svg" width="76" height="76" alt="Rampart" />

# Rampart

### The wall between AI and your assets

An attested, on-chain **policy firewall** that sits between an autonomous agent's *reasoning* and its right to move funds. Manipulate the model all you want — the chain still says **no**.

<br/>

![Ritual Chain](https://img.shields.io/badge/Ritual_Chain-1979-19D184?style=for-the-badge&labelColor=000000)
![Status](https://img.shields.io/badge/status-live_on_testnet-19D184?style=for-the-badge&labelColor=000000)
![Tests](https://img.shields.io/badge/foundry_tests-22%2F22_passing-19D184?style=for-the-badge&labelColor=000000)
![Attacks blocked](https://img.shields.io/badge/attack_scenarios-5%2F5_blocked-FF1DCE?style=for-the-badge&labelColor=000000)

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-BFFF00?style=flat-square&labelColor=000000)
![Foundry](https://img.shields.io/badge/built_with-Foundry-FACC15?style=flat-square&labelColor=000000)
![Next.js](https://img.shields.io/badge/Next.js-14-ffffff?style=flat-square&labelColor=000000)
![wagmi](https://img.shields.io/badge/wagmi-v2-19D184?style=flat-square&labelColor=000000)
![Privy](https://img.shields.io/badge/wallet-Privy-FF1DCE?style=flat-square&labelColor=000000)
![Three.js](https://img.shields.io/badge/3D-three.js_%2F_R3F-BFFF00?style=flat-square&labelColor=000000)

[**Live dApp**](https://github.com/YoneCode/Rampart) · [Explorer](https://explorer.ritualfoundation.org) · [X](https://x.com/YoneCode)

</div>

---

## At a glance

| Metric | Value |
|---|---|
| Chain | Ritual Chain — id `1979` (testnet) |
| Smart contracts | 5, deployed & verified on-chain |
| Firewall enforcement | deterministic, on-chain (replicated EVM) |
| AI advisory | TEE-attested LLM (`zai-org/GLM-4.7-FP8`) — advisory only |
| Attack scenarios blocked | 5 / 5 (in tests) |
| Live firewall decisions anchored | on-chain audit hash-chain |
| Circuit breaker | fired live on a 20% drawdown |
| Frontend | Next.js 14 static export, Cloudflare-ready |

---

## What is Rampart?

Autonomous agents are increasingly handed the keys to real funds. The danger isn't that the model is dumb — it's that its reasoning can be **manipulated** (prompt injection) while the wallet it controls is **blind to intent**. A tricked agent passes every threshold a legitimate one would, and external monitors react only *after* the transaction is signed.

Rampart fixes this by splitting an agent into two parts that never share trust:

- **Reasoning** — non-deterministic, runs off-chain inside a TEE. It can only *propose*.
- **Execution authority** — a deterministic policy firewall that runs **on-chain** and decides what is actually allowed.

Even a fully compromised model cannot push an action past your on-chain policy.

## How it works

```
agent proposes an action
        │
        ▼
LLM advisory (TEE, attested)            ← soft check, optional
        │
        ▼
deterministic firewall (on-chain)       ← BINDING: value caps, allowlists,
        │                                  slippage, daily limit, nonce
        ▼
execute only if it passes  ──►  every decision anchored on-chain (audit hash-chain)
```

The deterministic firewall is the binding authority. The LLM advisory is **defense-in-depth**: it can catch semantic threats the rules miss, but it can never override the rules — proven by a test where the model says *ALLOW* and the firewall still blocks an over-limit transaction.

## Architecture

| Layer | Runs on | Responsibility |
|---|---|---|
| **Firewall** | On-chain (replicated EVM) | `RampartVault` holds funds + policy, evaluates every action, trips the circuit breaker, enforces a timelock |
| **Reasoning** | Delegated (TEE) | `RampartAgent` calls the LLM precompile for an advisory verdict; `RampartSentinel` pulls portfolio data via the HTTP + JQ precompiles |
| **Proof** | On-chain | `AuditAnchor` keeps a tamper-evident hash-chain of every decision; `AgentRegistry` binds agent identity to a model hash |

### Why Ritual Chain

Rampart is only possible on Ritual because it natively provides, in one shared state machine:

- **TEE-attested precompiles** — LLM (`0x0802`) and HTTP (`0x0801`) execute inside enclaves and are verified by hardware attestation (no oracles, no bridges).
- **Execution-aware consensus** — the enshrined Scheduler and two-phase async settlement orchestrate `reason → gate → settle` as protocol-enforced steps, honoring the one-async-call-per-transaction rule.
- **Superposition** — a delegated TEE call can read state a replicated transfer wrote in the *same block*.

## Deployed contracts (Ritual testnet · 1979)

| Contract | Address |
|---|---|
| RampartVault | [`0x293E57E3D8C1524b5c035aF9B3A13C18B304846c`](https://explorer.ritualfoundation.org/address/0x293E57E3D8C1524b5c035aF9B3A13C18B304846c) |
| RampartAgent | [`0x8B247f811B60Cb8fF5E3ae4dD0c8cbDC7aAc9837`](https://explorer.ritualfoundation.org/address/0x8B247f811B60Cb8fF5E3ae4dD0c8cbDC7aAc9837) |
| RampartSentinel | [`0xB402fc383adAe68eb0BC4a3AefE337BEE2089C87`](https://explorer.ritualfoundation.org/address/0xB402fc383adAe68eb0BC4a3AefE337BEE2089C87) |
| AgentRegistry | [`0x3BC02899123953E562f57Ee7f9D2CC1ED53Ef6d2`](https://explorer.ritualfoundation.org/address/0x3BC02899123953E562f57Ee7f9D2CC1ED53Ef6d2) |
| AuditAnchor | [`0x9422817DC2E84bd91dD3715DDd7d466F2977D7a3`](https://explorer.ritualfoundation.org/address/0x9422817DC2E84bd91dD3715DDd7d466F2977D7a3) |
| RampartVaultFactory | [`0xF705cD232218A100FDD7299Be64306B6BA7fdF2b`](https://explorer.ritualfoundation.org/address/0xF705cD232218A100FDD7299Be64306B6BA7fdF2b) |

## Self-serve

Anyone can deploy their **own** firewall vault in one transaction via the factory — set your policy
(caps, allowlists, slippage, drawdown), and you become the owner. Your keeper/agent then proposes
actions that your vault gates on-chain. Deploy + manage from the `/vault` console in the dApp.

## Proof on-chain

Real transactions — open them on the explorer:

| Event | Transaction |
|---|---|
| **LLM advisory says ALLOW → firewall overrides to DENY** (defense-in-depth, live) | [`0x5061c967…`](https://explorer.ritualfoundation.org/tx/0x5061c96751ac60775651f1b3692ea68d917e1b499ba2c1217fd1ea590ca8a8a3) |
| Firewall blocks an **unauthorized destination** | [`0x3e5e2f6c…`](https://explorer.ritualfoundation.org/tx/0x3e5e2f6cac11d19bd7fa06d611ba6d1bd190214549a5d48c3c4f89551632be7c) |
| Firewall blocks an **oversized transaction** | [`0xd77cd0c9…`](https://explorer.ritualfoundation.org/tx/0xd77cd0c9be5ed4da644ceb4504ec2202258c0803b2a4e2ffb8222b9f7b4f909c) |
| Circuit breaker **trips on drawdown** | [`0x04b200e2…`](https://explorer.ritualfoundation.org/tx/0x04b200e2674bb0e28f7d591a257e2ef40c34bc8e6bcbaf46ef5e4d7bac3690cd) |
| Live LLM executor wired to the agent | [`0x5ac7fd57…`](https://explorer.ritualfoundation.org/tx/0x5ac7fd579f811751fc817a83125faffe2ab271499f732069f1180d1a26a7366a) |

## Tech stack

**Contracts** — Solidity `0.8.20`, Foundry, Ritual precompiles (LLM `0x0802`, HTTP `0x0801`, JQ `0x0803`) and system contracts (Scheduler, AsyncDelivery, TEEServiceRegistry, RitualWallet).

**Frontend** — Next.js 14 (App Router, static export), React 18, TypeScript, wagmi v2 + viem v2, Privy (wallet connect), Tailwind CSS, Framer Motion, three.js / React Three Fiber (animated hero).

## Repository structure

```
.
├── contracts/                 # Foundry project
│   ├── src/
│   │   ├── RampartVault.sol        # funds + on-chain firewall + breaker + timelock
│   │   ├── RampartAgent.sol        # LLM-advisory agent (0x0802), fail-closed
│   │   ├── RampartSentinel.sol     # Scheduler → HTTP(0x0801) → JQ(0x0803) health checks
│   │   ├── AgentRegistry.sol       # agent identity + model-hash provenance
│   │   ├── AuditAnchor.sol         # tamper-evident decision hash-chain
│   │   ├── RampartPolicy.sol       # pure deterministic policy evaluation
│   │   ├── RampartTypes.sol        # Policy / ActionRequest / DecisionCode
│   │   ├── auth/ utils/ lib/       # Ownable, ReentrancyGuard, addresses
│   ├── test/                  # 22 Foundry tests (incl. 5 attack scenarios)
│   └── script/Deploy.s.sol    # deploy + wire all contracts
└── frontend/                  # Next.js dApp (landing + dashboard)
    ├── app/                   # routes, layout, providers, icon
    ├── components/            # UI + landing sections + 3D city
    └── lib/                   # chain, addresses, abis, formatting
```

## Local development

**Contracts** (requires [Foundry](https://book.getfoundry.sh/)):

```bash
cd contracts
forge install foundry-rs/forge-std
forge build
forge test -vvv
```

**Frontend**:

```bash
cd frontend
npm ci
npm run dev      # development
npm run build    # static export → frontend/out
```

Set `frontend/.env.local` from `frontend/.env.example` (chain config, Privy App ID, deployed addresses).

## Deployment

- **Contracts** — `forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.ritualfoundation.org --broadcast`, with `ACCOUNT_PRIVATE_KEY` in `.env`.
- **Frontend** — Cloudflare Pages. Root directory `frontend`, build command `npm ci && npm run build`, output directory `out`. Set the `NEXT_PUBLIC_*` env vars in the Pages project.

## Security model

- The binding firewall is **deterministic and on-chain** — it does not depend on any TEE, model, or operator behaving correctly.
- The LLM advisory is **fail-closed**: anything other than an explicit ALLOW is blocked before it reaches the vault.
- Two-phase async callbacks verify `msg.sender == AsyncDelivery`; policy updates are owner-signed and timelocked; nonces prevent replay.
- Testnet only — `RITUAL` has no monetary value.

## License

MIT
