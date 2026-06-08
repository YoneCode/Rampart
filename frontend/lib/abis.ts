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
