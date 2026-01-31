import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      
      {/* Background Glow Effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-transparent blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4 pt-20 pb-10 flex flex-col items-center">
        
        {/* Logo / Icon Hero */}
        <div className="mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-black border border-white/10 shadow-2xl">
            <span className="text-4xl">🛡️</span>
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Sentry<span className="text-blue-500">Gate</span>
        </h1>
        <p className="mt-4 text-center text-gray-400 leading-relaxed max-w-sm">
          Decentralized Secure Document Vault.
          Encrypted, Immutable, and Built on Base.
        </p>

        {/* THE GATEKEEPER */}
        <AuthGate />

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-gray-600">
            Powered by Base Sepolia • IPFS • AES-GCM Encryption
          </p>
        </div>

      </div>
    </main>
  );
}