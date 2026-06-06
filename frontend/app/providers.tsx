"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { wagmiConfig } from "@/lib/wagmi";
import { ritualChain } from "@/lib/chain";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "cmqkq0a5i007c0cl4t96x6kv1";

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <p className="text-ritual-gold font-mono text-sm">
          NEXT_PUBLIC_PRIVY_APP_ID is not set. Add it to frontend/.env.local.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        defaultChain: ritualChain,
        supportedChains: [ritualChain],
        appearance: {
          theme: "dark",
          accentColor: "#19D184",
          showWalletLoginFirst: true,
        },
        embeddedWallets: { createOnLogin: "off" },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
