"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { API_BASE } from "@/lib/api/client"; 
import PaymentRequiredLottie from "@/components/lottie/PaymentRequired";

// --- CONTRACT CONFIG ---
const SENTRY_ADDRESS = process.env.NEXT_PUBLIC_SENTRY_CONTRACT_ADDRESS as `0x${string}`;
const IDRX_ADDRESS = process.env.NEXT_PUBLIC_IDRX_TOKEN_ADDRESS as `0x${string}`;

const SENTRY_ABI = [
  { inputs: [], name: "paySubscription", outputs: [], stateMutability: "nonpayable", type: "function" }
];
const TOKEN_ABI = [
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" }
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PaywallModal({ open, onClose }: Props) {
  const { address } = useAccount();
  
  // State Transaksi: IDLE -> APPROVING -> APPROVED -> PAYING -> SUCCESS
  const [step, setStep] = useState<"IDLE" | "APPROVING" | "APPROVED" | "PAYING" | "SUCCESS">("IDLE");
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  // --- LOGIC 1: CLAIM FREE TOKENS (FAUCET) ---
  const handleFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Faucet claim failed");
      
      alert("🎉 Tokens sent successfully! Please wait a moment, then click Approve.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Faucet failed");
    } finally {
      setFaucetLoading(false);
    }
  };

  // --- LOGIC 2: STEP 1 - APPROVE ---
  const handleApprove = async () => {
    setError(null);
    try {
      setStep("APPROVING");
      await writeContractAsync({
        address: IDRX_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [SENTRY_ADDRESS, parseEther("50000")], 
      });
      
      // Setelah sukses approve, kita ubah status jadi APPROVED
      // User harus klik tombol lagi untuk bayar (Wajib buat Mobile)
      setStep("APPROVED");

    } catch (err) {
      console.error(err);
      setStep("IDLE");
      setError("Approval failed/rejected. Please try again.");
    }
  };

  // --- LOGIC 3: STEP 2 - PAY ---
  const handlePay = async () => {
    setError(null);
    try {
      setStep("PAYING");
      
      await writeContractAsync({
        address: SENTRY_ADDRESS,
        abi: SENTRY_ABI,
        functionName: "paySubscription",
        args: [],
      });

      setStep("SUCCESS");
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error(err);
      // Kalau gagal bayar, kembalikan ke status APPROVED biar bisa coba bayar lagi tanpa approve ulang
      setStep("APPROVED");
      setError("Payment failed. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl">
        
        {step === "SUCCESS" ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-gray-400 mt-2">Welcome to SentryGate.</p>
            <div className="mt-6 text-sm text-gray-500 animate-pulse">Reloading application...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
               <div className="w-32 h-32">
                 <PaymentRequiredLottie />
               </div>
            </div>

            <h2 className="text-center text-xl font-bold text-white">
              Access Locked 🔒
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400 leading-relaxed">
              Subscription required to store encrypted documents.
              Cost: <span className="text-white font-mono">50.000 IDRX</span> / 30 Days.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center text-xs text-red-200">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-3">
              
              {/* LOGIC TOMBOL BERUBAH-UBAH */}
              
              {/* KONDISI 1: Belum Approve */}
              {(step === "IDLE" || step === "APPROVING") && (
                <button
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-500 transition disabled:opacity-50"
                  onClick={handleApprove}
                  disabled={step === "APPROVING" || faucetLoading}
                >
                  {step === "APPROVING" ? "Open Wallet to Approve..." : "Step 1: Approve Token"}
                </button>
              )}

              {/* KONDISI 2: Sudah Approve, Tinggal Bayar */}
              {(step === "APPROVED" || step === "PAYING") && (
                <button
                  className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white hover:bg-green-500 transition disabled:opacity-50 animate-pulse"
                  onClick={handlePay}
                  disabled={step === "PAYING"}
                >
                  {step === "PAYING" ? "Open Wallet to Pay..." : "Step 2: Pay Subscription (50k IDRX)"}
                </button>
              )}

              {/* Faucet Button (Hanya muncul di awal) */}
              {step === "IDLE" && (
                <button
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-gray-300 hover:bg-white/10 transition disabled:opacity-50"
                  onClick={handleFaucet}
                  disabled={faucetLoading}
                >
                  {faucetLoading ? "Sending Tokens..." : "🎁 Claim Free Tokens (Faucet)"}
                </button>
              )}
            </div>

            <button
              className="mt-4 w-full py-2 text-xs text-gray-500 hover:text-white transition"
              onClick={onClose}
              disabled={step === "APPROVING" || step === "PAYING"}
            >
              Maybe Later
            </button>
          </>
        )}
      </div>
    </div>
  );
}