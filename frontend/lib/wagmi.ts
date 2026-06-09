// Use Privy's drop-in createConfig (keeps Privy + wagmi connector state in sync).
import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { ritualChain } from "./chain";

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  transports: {
    [ritualChain.id]: http(),
  },
});
