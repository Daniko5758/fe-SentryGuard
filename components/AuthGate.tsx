"use client";

import { useMemo, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import ConnectWallet from "@/components/ConnectWallet";
import PaywallModal from "@/components/PaywallModal";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import LoadingLottie from "@/components/lottie/Loading";
import { useRouter } from "next/navigation";
import PrivyLoginButton from "./PrivyLoginButton";
import { usePrivy } from "@privy-io/react-auth";

function formatExpiry(ts?: number) {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function shortAddress(addr?: string) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AuthGate() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { authenticated, logout } = usePrivy();
  const { disconnect } = useDisconnect();

  const [paywallDismissed, setPaywallDismissed] = useState(false);
  
  const { data, loading, error } = usePaymentStatus(address);

  const isInactive = isConnected && data?.status === "inactive";
  const isActive = isConnected && data?.status === "active";
  
  const paywallOpen = isInactive && !paywallDismissed;

  const shouldLock = useMemo(() => {
    if (!isConnected) return true;
    if (loading) return true;
    if (error) return true;
    return data?.status !== "active";
  }, [isConnected, loading, error, data]);

  const handleLogout = async () => {
    await logout();
    disconnect();
    window.location.reload();
  };

  return (
    <div className="mt-6 w-full max-w-xl mx-auto">
      {/* Account Status Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md">
        
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl"></div>

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
              Account Status
            </div>

            <div className="mt-3">
              <div className="truncate font-mono text-lg font-medium text-white tracking-tight">
                {isConnected ? shortAddress(address) : "Wallet Disconnected"}
              </div>
              
              <div className="mt-2 text-sm">
                {!isConnected && (
                  <span className="text-gray-400">Connect your wallet to access services.</span>
                )}

                {loading && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <LoadingLottie />
                    <span>Syncing Blockchain...</span>
                  </div>
                )}

                {!loading && isActive && (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center rounded-full bg-green-500/10 px-2.5 text-xs font-medium text-green-400 border border-green-500/20">
                      Active Access ✅
                    </span>
                    <span className="text-xs text-gray-500">
                      Exp: {formatExpiry(data?.expiry)}
                    </span>
                  </div>
                )}

                {!loading && isInactive && (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center rounded-full bg-red-500/10 px-2.5 text-xs font-medium text-red-400 border border-red-500/20">
                      Subscription Expired 🔒
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Login/Logout Button */}
          <div className="shrink-0">
            {!isConnected ? (
              <div className="flex flex-col gap-2">
                 <PrivyLoginButton />
              </div>
            ) : (
              <button 
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Menu Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 text-black transition hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          disabled={shouldLock}
          onClick={() => router.push("/scan")}
        >
          <div className="rounded-full bg-gray-100 p-2 group-hover:bg-gray-200 transition">
            📷
          </div>
          <div className="font-bold text-sm">Scan Document</div>
          {shouldLock && <div className="absolute top-2 right-2 text-xs">🔒</div>}
        </button>

        <button
          className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-white transition hover:bg-white/10 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          disabled={shouldLock}
          onClick={() => router.push("/vault")}
        >
          <div className="rounded-full bg-white/10 p-2 group-hover:bg-white/20 transition">
            📂
          </div>
          <div className="font-bold text-sm">Open Vault</div>
          {shouldLock && <div className="absolute top-2 right-2 text-xs">🔒</div>}
        </button>
      </div>

      {/* Manual Unlock Button */}
      {isInactive && paywallDismissed && (
        <button
          className="mt-4 w-full animate-pulse rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:from-blue-500 hover:to-indigo-500"
          onClick={() => setPaywallDismissed(false)}
        >
          🔓 Unlock Full Access (Subscribe)
        </button>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallDismissed(true)}
      />
    </div>
  );
}