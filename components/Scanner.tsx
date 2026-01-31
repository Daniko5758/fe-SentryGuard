"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useAccount, useSignMessage, useWriteContract } from "wagmi";
import { sha256Hex } from "@/lib/crypto/hash";
import { encryptFileWithSignature } from "@/lib/crypto/encrypt";
import { uploadEncrypted } from "@/lib/api/upload";
import { buildUnlockMessage } from "@/lib/crypto/message";
import Link from "next/link";

const SENTRY_ADDRESS = process.env.NEXT_PUBLIC_SENTRY_CONTRACT_ADDRESS as `0x${string}`;

const SENTRY_ABI = [
  {
    inputs: [
      { name: "_cid", type: "string" },
      { name: "_hash", type: "string" },
      { name: "_encName", type: "string" }
    ],  
    name: "addDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

type Capture = {
  dataUrl: string;
  file: File;
};

// --- Helper Functions ---
function dataUrlToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

// --- Main Component ---
export default function Scanner() {
  const webcamRef = useRef<Webcam>(null);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract(); 

  const [capture, setCapture] = useState<Capture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const videoConstraints = useMemo(
    () => ({
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    }),
    []
  );

  const onCapture = useCallback(() => {
    setError(null);
    setCid(null);
    setTxHash(null);

    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) {
      setError("Capture failed. Please allow camera access or refresh.");
      return;
    }

    const file = dataUrlToFile(
      dataUrl,
      `scan_${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`
    );

    setCapture({ dataUrl, file });
  }, []);

  const onRetake = useCallback(() => {
    setCapture(null);
    setError(null);
    setCid(null);
    setTxHash(null);
  }, []);

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setCid(null);
    setTxHash(null);

    const f = e.target.files?.[0];
    if (!f) return;

    const url = URL.createObjectURL(f);
    setCapture({ dataUrl: url, file: f });
  }, []);

  const onUsePhoto = useCallback(async () => {
    if (!capture) return;
    if (!address) {
      setError("Wallet not connected.");
      return;
    }

    try {
      setProcessingState("Hashing & Signing...");
      setError(null);

      // A. Hash & Sign
      const ab = await capture.file.arrayBuffer();
      const docHash = await sha256Hex(ab);
      const message = buildUnlockMessage({ docHash });
      const signatureHex = await signMessageAsync({ message });

      // B. Encrypt
      setProcessingState("Encrypting...");
      const payload = await encryptFileWithSignature({
        file: capture.file,
        signatureHex,
        docHash,
      });

      // C. Upload
      setProcessingState("Uploading to IPFS...");
      const up = await uploadEncrypted({
        payload,
        walletAddress: address,
        category: "Scans",
        docHash,
      });

      if (!up.success || !up.cid) {
        throw new Error(up.error || "Upload failed");
      }
      setCid(up.cid);

      // D. 🔥 WRITE TO BLOCKCHAIN 🔥
      setProcessingState("Waiting Blockchain Confirmation...");
      
      console.log("Writing to chain:", { 
        cid: up.cid, 
        docHash, 
        encName: capture.file.name 
      });

      const hash = await writeContractAsync({
        address: SENTRY_ADDRESS,
        abi: SENTRY_ABI,
        functionName: "addDocument",
        args: [up.cid, docHash, capture.file.name], 
      });

      console.log("Tx Hash:", hash);
      setTxHash(hash);
      
      setProcessingState(null);
      
    } catch (e: unknown) {
      setProcessingState(null);
      
      if (hasStatus(e) && e.status === 402) {
        setError("Payment required. Please subscribe first.");
        return;
      }

      const msg = e instanceof Error ? e.message : "Process failed";
      
      if (msg.includes("User denied")) {
        setError("File saved to server, but blockchain recording was cancelled.");
      } else {
        setError(msg);
      }
      console.error("❌ Error Process:", msg);
    }
  }, [capture, signMessageAsync, address, writeContractAsync]);

  return (
    <div className="space-y-3">
      {!capture ? (
        // --- 1. CAMERA MODE ---
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={videoConstraints}
              className="h-[55vh] w-full object-cover"
              onUserMediaError={() => setError("Camera error or permission denied.")}
            />
          </div>
          {error && <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-500/20">{error}</div>}
          
          <div className="flex gap-3">
            <button 
              className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition" 
              onClick={onCapture}
            >
              Capture
            </button>
            <label className="flex-1 flex items-center justify-center border border-white/20 text-white px-4 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition font-bold">
              Gallery 
              <input type="file" className="hidden" accept="image/*" onChange={onPickFile} />
            </label>
          </div>
        </>
      ) : (
        // --- 2. PREVIEW & ACTION MODE ---
        <>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capture.dataUrl} alt="Preview" className="h-[55vh] w-full object-contain" />
            
            {processingState && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                <div className="text-blue-400 font-mono text-lg animate-pulse mb-2">Processing...</div>
                <div className="text-white text-sm">{processingState}</div>
              </div>
            )}
          </div>

          {error && <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded border border-red-500/20">{error}</div>}

          {!cid && !processingState && (
            <div className="flex gap-3">
              <button
                className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                onClick={onUsePhoto}
              >
                Encrypt & Save On-Chain
              </button>
              <button 
                className="px-4 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition text-white" 
                onClick={onRetake}
              >
                Retake
              </button>
            </div>
          )}

          {/* --- 3. SUCCESS STATE --- */}
          {cid && txHash && (
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl space-y-2 animate-in fade-in slide-in-from-bottom-4">
              <div className="font-bold text-green-400 flex items-center gap-2">
                <span>✅</span> Saved to Blockchain!
              </div>
              <div className="text-xs text-gray-400">
                CID: <span className="font-mono text-white select-all">{cid.slice(0, 20)}...</span>
              </div>
              <div className="text-xs text-gray-400">
                Tx: <span className="font-mono text-white truncate block select-all">{txHash}</span>
              </div>
              
              <div className="flex gap-2 mt-4 pt-2 border-t border-green-500/20">
                 <Link href="/vault" className="flex-1 bg-white text-black py-2 rounded-lg text-center text-sm font-bold hover:bg-gray-200">
                   Open Vault
                 </Link>
                 <button onClick={onRetake} className="flex-1 border border-white/20 text-white py-2 rounded-lg text-sm hover:bg-white/10">
                   Scan Again
                 </button>
              </div>
            </div>
          )}
          
          {/* --- 4. SEMI-SUCCESS STATE --- */}
          {cid && !txHash && !processingState && (
             <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl animate-in fade-in">
                <div className="text-yellow-400 text-sm font-bold">⚠️ Saved to Database Only</div>
                <div className="text-xs text-gray-400 mt-1 mb-3">
                  File secured on server, but not recorded on Blockchain (transaction cancelled).
                </div>
                <div className="flex gap-2">
                  <Link href="/vault" className="flex-1 bg-yellow-400/20 text-yellow-200 py-2 rounded-lg text-center text-sm font-bold hover:bg-yellow-400/30">
                     Check Vault
                  </Link>
                  <button onClick={onRetake} className="flex-1 border border-white/10 text-white py-2 rounded-lg text-sm">
                     Close
                  </button>
                </div>
             </div>
          )}
        </>
      )}
    </div>
  );
}