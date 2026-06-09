// Real on-chain transactions produced by Rampart on Ritual testnet (chain 1979).
// Hashes + block numbers are genuine, captured at execution (deploy broadcast receipts
// and tx logs). Every tx was verified successful on-chain (contract code present,
// wiring confirmed by reads, executor() read back, breaker paused() flip observed).
// The ledger UI also re-confirms live via the RPC when that flaky endpoint responds.

export type TxKind = "deploy" | "wire" | "config" | "breaker" | "firewall";

export interface KnownTx {
  hash: `0x${string}`;
  label: string;
  contract: string;
  kind: TxKind;
  block?: number; // verified at execution; undefined where not captured
}

export const KIND_META: Record<TxKind, { label: string; cls: string; dot: string }> = {
  deploy: { label: "Deploy", cls: "text-ritual-green", dot: "bg-ritual-green" },
  wire: { label: "Wiring", cls: "text-ritual-lime", dot: "bg-ritual-lime" },
  config: { label: "Config", cls: "text-ritual-gold", dot: "bg-ritual-gold" },
  breaker: { label: "Breaker", cls: "text-ritual-pink", dot: "bg-ritual-pink" },
  firewall: { label: "Firewall", cls: "text-red-400", dot: "bg-red-400" },
};

export const knownTxs: KnownTx[] = [
  { hash: "0x3e5e2f6cac11d19bd7fa06d611ba6d1bd190214549a5d48c3c4f89551632be7c", label: "Firewall blocked: unauthorized target", contract: "RampartVault", kind: "firewall", block: 34810167 },
  { hash: "0xd77cd0c9be5ed4da644ceb4504ec2202258c0803b2a4e2ffb8222b9f7b4f909c", label: "Firewall blocked: oversized tx", contract: "RampartVault", kind: "firewall", block: 34810157 },
  { hash: "0x04b200e2674bb0e28f7d591a257e2ef40c34bc8e6bcbaf46ef5e4d7bac3690cd", label: "Drawdown trips breaker", contract: "RampartVault", kind: "breaker" },
  { hash: "0xe485df868d570ac943735c23c40abef4313502e1124d377e8b1e8710b2fd420f", label: "Report high-water mark", contract: "RampartVault", kind: "breaker" },
  { hash: "0x5ac7fd579f811751fc817a83125faffe2ab271499f732069f1180d1a26a7366a", label: "Set live LLM executor", contract: "RampartAgent", kind: "config", block: 34773823 },
  { hash: "0x2fce854df8186c9f18326e2ffbcf63dcbc5719e547c26ae55ef2d85253c6cc69", label: "Authorize sentinel reporter", contract: "RampartVault", kind: "wire", block: 34770407 },
  { hash: "0xab6dc33ab96bd7d47e23d2c7622d6ef91617d491c7e478312caa51714d915632", label: "Register agent controller", contract: "AgentRegistry", kind: "wire", block: 34770407 },
  { hash: "0x7d32ee11861ef3d82f4f1fea7b06ec4c5de699acb9328e42e169b4abcca64536", label: "Deploy RampartVault", contract: "RampartVault", kind: "deploy", block: 34770407 },
  { hash: "0xc9391a325d5f50a1bbf2f27cc2269168df5575a0c90d0ab3a05444a39b14b8e6", label: "Deploy RampartAgent", contract: "RampartAgent", kind: "deploy", block: 34770407 },
  { hash: "0x87818f8638eb23da2318553560a1dcf5a0a04f7edc079def7278e7d71e8f4858", label: "Deploy RampartSentinel", contract: "RampartSentinel", kind: "deploy", block: 34770407 },
  { hash: "0x18de4efe541ff4a2bb190fe847a7124886d131ffe387a2fcaaaeb93ffb93ee59", label: "Deploy AgentRegistry", contract: "AgentRegistry", kind: "deploy", block: 34770406 },
  { hash: "0xcc108ccd524d2ca52f485a106c91826910927f4b4cee9a50b881f1780fd3e748", label: "Deploy AuditAnchor", contract: "AuditAnchor", kind: "deploy", block: 34770406 },
];
