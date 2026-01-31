"use client";

import { buildUnlockMessage } from "@/lib/crypto/message";
import { useEffect, useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { decryptToBytes } from "@/lib/crypto/decrypt";
import { listDocuments, type DocumentRow } from "@/lib/api/documents";
import { fetchEncryptedPayload } from "@/lib/ipfs/fetchPayload";
import ReactMarkdown from "react-markdown"; // ✅ IMPORT BARU

// --- Helper UI ---
function shortAddress(addr?: string) {
  if (!addr) return "-";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function bytesToObjectUrl(bytes: Uint8Array, mime?: string) {
  const safeBytes = new Uint8Array(bytes);
  const blob = new Blob([safeBytes], {
    type: mime || "application/octet-stream",
  });
  return URL.createObjectURL(blob);
}

export default function VaultGallery() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Preview & Decrypt State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);

  // --- AI STATE ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // 1. Fetch Data
  const loadData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    const res = await listDocuments(address);
    if (res.success && res.data) {
      setDocs(res.data);
    } else {
      setError(res.error || "Failed to load documents.");
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadData();
    } else {
      setDocs([]);
    }
  }, [isConnected, address, loadData]);

  // Cleanup URL Object to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

 	// 2. Logic Buka Dokumen (Download IPFS -> Sign -> Decrypt)
  async function onOpen(doc: DocumentRow) {
    setError(null);
    setSelectedDoc(doc);
    setBusyId(doc.id);

    try {
      if (!address) throw new Error("Wallet disconnect.");

      // A. Download Payload JSON dari IPFS (via CID)
      console.log("Downloading from IPFS...", doc.cid);
      const payload = await fetchEncryptedPayload(doc.cid);

      // B. Minta Signature User
      // Pastikan format pesan SAMA PERSIS dengan saat encrypt di Scanner.tsx
      const message = buildUnlockMessage({ docHash: payload.docHash });
      const signatureHex = await signMessageAsync({ message });

      // C. Decrypt di Browser
      const bytes = await decryptToBytes({
        payload: payload,
        signatureHex,
      });

      // D. Tampilkan
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = bytesToObjectUrl(bytes, payload.mime);
      setPreviewUrl(url);

    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Decrypt failed";
      setError(msg);
      setSelectedDoc(null); // Reset kalau gagal
    } finally {
      setBusyId(null);
    }
  }

  function onClosePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedDoc(null);
    setError(null);
    setAiResult(null);
  }

  // 3. --- AI ANALYSIS LOGIC ---
  const onAnalyzeAI = async () => {
    if (!previewUrl) return;

    try {
      setIsAnalyzing(true);
      setAiResult(null);
      
      // Convert Blob URL to Base64
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Call Our Backend API
        const apiRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageBase64: base64data,
            // Professional Prompt
            prompt: "You are Sentry AI. Analyze this image. 1. Identify document type. 2. Extract key dates/names (if any). 3. List any potential risks or sensitive data found. Keep it concise and use bullet points." 
          }),
        });
        
        const data = await apiRes.json();
        
        if (data.result) {
          setAiResult(data.result);
        } else {
          setAiResult("AI Analysis failed: " + (data.error || "Unknown error"));
        }
        setIsAnalyzing(false);
      };
      
      reader.readAsDataURL(blob);

    } catch (e) {
      console.error(e);
      setAiResult("Failed to contact AI Brain.");
      setIsAnalyzing(false);
    }
  };

  // --- RENDER ---
  if (!isConnected) {
    return <div className="text-gray-400">Please connect wallet to view vault.</div>;
  }

  if (loading && docs.length === 0) {
    return <div className="text-white animate-pulse">Loading documents from blockchain...</div>;
  }

  if (!loading && docs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
        No documents found. Scan a document first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* DOCUMENT LIST */}
      <div className="grid gap-3">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onOpen(doc)}
            disabled={busyId !== null}
            className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:bg-white/5 transition active:scale-[0.99] disabled:opacity-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {doc.filename}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  CID: <span className="font-mono break-all text-gray-500">{doc.cid}</span>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  Owner: <span className="font-mono">{shortAddress(doc.owner_address)}</span>
                  {" • "}
                  {formatDate(doc.created_at)}
                </div>

                <div className="mt-3">
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${
                    busyId === doc.id 
                      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-white/5 text-gray-300"
                  }`}>
                    {busyId === doc.id ? "Downloading & Decrypting..." : "Tap to Decrypt 🔓"}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* PREVIEW & AI MODAL */}
      {selectedDoc && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#111] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            
            {/* Left Side: Image Preview */}
            <div className="flex-1 bg-black p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative overflow-auto">
               {selectedDoc.filename.endsWith(".pdf") ? (
                  <iframe src={previewUrl} className="w-full h-full min-h-[300px]" title="PDF Preview" />
               ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Decrypted preview"
                    className="max-w-full max-h-[70vh] object-contain"
                  />
               )}
            </div>

            {/* Right Side: Controls & AI */}
            <div className="w-full md:w-80 bg-[#161616] p-6 flex flex-col gap-4 overflow-y-auto">
                <div>
                   <h3 className="font-bold text-white mb-1 truncate" title={selectedDoc.filename}>{selectedDoc.filename}</h3>
                   <div className="text-xs text-gray-500 font-mono">Verified On-Chain ✅</div>
                </div>
                
                <hr className="border-white/10" />

                {/* AI Button */}
                <button
                  onClick={onAnalyzeAI}
                  disabled={isAnalyzing}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <span className="animate-pulse">🧠 Sentry AI is thinking...</span>
                  ) : (
                    "🤖 AI Risk Analysis"
                  )}
                </button>

                {/* ✅ AI Result Box (VERSI BARU - RAPI & CANTIK) */}
                {aiResult && (
                  <div className="mt-2 rounded-xl bg-purple-900/10 border border-purple-500/30 p-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <span>⚡</span> Analysis Report
                    </div>
                    
                    {/* React Markdown Renderer */}
                    <div className="text-sm text-gray-300 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          // Styling khusus biar bintang (**) jadi ungu tebal
                          strong: ({node, ...props}) => <span className="font-bold text-purple-300" {...props} />,
                          // Styling list bullet biar rapi
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-2 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-2 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          // Styling paragraf
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                        }}
                      >
                        {aiResult}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                <div className="flex-1"></div> {/* Spacer */}

                <button
                  className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-bold text-white transition"
                  onClick={onClosePreview}
                >
                  Close Preview
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}