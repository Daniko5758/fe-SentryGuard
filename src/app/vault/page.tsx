"use client";

import VaultGallery from "@/components/VaultGallery";
import Link from "next/link";

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        
        {/* Header Nav */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition"
          >
            ← Back to Home
          </Link>
          <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Secure Vault
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-3xl border border-white/10 bg-[#111] p-1 shadow-2xl">
          <div className="rounded-[20px] bg-black/50 p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Document Gallery</h1>
            <p className="text-sm text-gray-400 mb-6">
              Your documents are securely stored on IPFS and fully encrypted.
              Only the wallet owner can decrypt and view them.
            </p>

            <VaultGallery />
            
          </div>
        </div>

      </div>
    </main>
  );
}