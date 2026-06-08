import type { Address } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

// Public, on-chain contract addresses (Ritual testnet, chain 1979).
// Defaults are the live deployment; override via NEXT_PUBLIC_* env if redeployed.
export const addresses = {
  vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "0x293E57E3D8C1524b5c035aF9B3A13C18B304846c") as Address,
  agent: (process.env.NEXT_PUBLIC_AGENT_ADDRESS ?? "0x8B247f811B60Cb8fF5E3ae4dD0c8cbDC7aAc9837") as Address,
  sentinel: (process.env.NEXT_PUBLIC_SENTINEL_ADDRESS ?? "0xB402fc383adAe68eb0BC4a3AefE337BEE2089C87") as Address,
  registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "0x3BC02899123953E562f57Ee7f9D2CC1ED53Ef6d2") as Address,
  audit: (process.env.NEXT_PUBLIC_AUDIT_ADDRESS ?? "0x9422817DC2E84bd91dD3715DDd7d466F2977D7a3") as Address,
} as const;

export const isDeployed = (a: Address) => a !== ZERO;

// Ritual system contracts (fixed across deployments).
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948" as Address;
export const SCHEDULER = "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B" as Address;
