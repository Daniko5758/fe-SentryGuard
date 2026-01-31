"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";

import { OnchainKitProvider } from "@coinbase/onchainkit";
import { wagmiConfig, chain } from "@/lib/wagmi";

const privyConfig: PrivyClientConfig = {
  // bikin embedded wallet otomatis untuk user awam
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    showWalletUIs: true,
  },

  // biar ada opsi email + external wallet
  loginMethods: ["email", "wallet", "google"],
  appearance: {
    theme: "dark", // Aku tambahkan ini biar UI-nya otomatis gelap sesuai tema apps kamu
    accentColor: "#676FFF",
    logo: "https://auth.privy.io/logos/privy-logo.png", // Bisa diganti logo kamu sendiri nanti
  },
};

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <OnchainKitProvider 
            chain={chain}
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} // Optional: Tambah ini kalau punya, biar lebih stabil
          >
            {children}
          </OnchainKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}