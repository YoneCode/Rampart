// Minimal ABIs for the Rampart dashboard reads + event subscriptions.
// Full ABIs live in contracts/out after `forge build`.

export const vaultAbi = [
  { type: "function", name: "policy", stateMutability: "view", inputs: [], outputs: [
    { name: "maxTxValueWei", type: "uint256" },
    { name: "maxDailySpendWei", type: "uint256" },
    { name: "maxSlippageBps", type: "uint16" },
    { name: "drawdownLimitBps", type: "uint16" },
    { name: "defaultTtl", type: "uint64" },
  ] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "expectedNonce", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "currentDailySpent", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "highWaterMark", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "policyHash", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "agentId", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "reporter", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "targetCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event",
    name: "ActionExecuted",
    inputs: [
      { name: "nonce", type: "uint256", indexed: true },
      { name: "target", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
      { name: "actionHash", type: "bytes32", indexed: false },
      { name: "auditRoot", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ActionDenied",
    inputs: [
      { name: "nonce", type: "uint256", indexed: true },
      { name: "target", type: "address", indexed: true },
      { name: "code", type: "uint8", indexed: false },
      { name: "actionHash", type: "bytes32", indexed: false },
      { name: "auditRoot", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PausedSet",
    inputs: [
      { name: "paused", type: "bool", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PortfolioReported",
    inputs: [
      { name: "value", type: "uint256", indexed: false },
      { name: "highWaterMark", type: "uint256", indexed: false },
      { name: "tripped", type: "bool", indexed: false },
    ],
  },
] as const;

export const auditAbi = [
  { type: "function", name: "decisionCount", stateMutability: "view", inputs: [{ name: "vault", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "latestRoot", stateMutability: "view", inputs: [{ name: "vault", type: "address" }], outputs: [{ type: "bytes32" }] },
] as const;

export const agentAbi = [
  { type: "function", name: "lastAdvisory", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "lastFirewallCode", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "lastActionHash", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "lastReasoningHash", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
] as const;

// ---- Self-serve factory + vault writes ----

const POLICY_TUPLE = {
  type: "tuple",
  components: [
    { name: "maxTxValueWei", type: "uint256" },
    { name: "maxDailySpendWei", type: "uint256" },
    { name: "maxSlippageBps", type: "uint16" },
    { name: "drawdownLimitBps", type: "uint16" },
    { name: "defaultTtl", type: "uint64" },
  ],
} as const;

const ACTION_TUPLE = {
  type: "tuple",
  components: [
    { name: "nonce", type: "uint256" },
    { name: "target", type: "address" },
    { name: "value", type: "uint256" },
    { name: "callData", type: "bytes" },
    { name: "tokenIn", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "slippageBps", type: "uint16" },
    { name: "deadline", type: "uint64" },
  ],
} as const;

export const factoryAbi = [
  {
    type: "function",
    name: "createVault",
    stateMutability: "nonpayable",
    inputs: [
      { name: "policy", ...POLICY_TUPLE },
      { name: "targets", type: "address[]" },
      { name: "tokens", type: "address[]" },
      { name: "controller", type: "address" },
      { name: "modelHash", type: "bytes32" },
    ],
    outputs: [
      { name: "vaultAddr", type: "address" },
      { name: "agentId", type: "bytes32" },
    ],
  },
  { type: "function", name: "getVaults", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "address[]" }] },
  { type: "function", name: "vaultCountOf", stateMutability: "view", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalVaults", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "event",
    name: "VaultCreated",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "vault", type: "address", indexed: true },
      { name: "agentId", type: "bytes32", indexed: false },
      { name: "controller", type: "address", indexed: false },
    ],
  },
] as const;

export const vaultWriteAbi = [
  {
    type: "function",
    name: "executeAction",
    stateMutability: "nonpayable",
    inputs: [{ name: "a", ...ACTION_TUPLE }],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "evaluate",
    stateMutability: "view",
    inputs: [{ name: "a", ...ACTION_TUPLE }],
    outputs: [{ type: "uint8" }],
  },
  { type: "function", name: "setPaused", stateMutability: "nonpayable", inputs: [{ name: "p", type: "bool" }, { name: "reason", type: "string" }], outputs: [] },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
] as const;
