import { API_BASE } from "./client";
import type { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

export type UploadEncryptedResponse = {
  success: boolean;
  cid?: string;
  error?: string;
};

export async function uploadEncrypted(params: {
  payload: EncryptedPayloadV1;
  walletAddress: string;
  category?: string;
  docHash: string;
}): Promise<UploadEncryptedResponse> {
  try {
    // 1. Siapkan File JSON
    const json = JSON.stringify(params.payload);
    const blob = new Blob([json], { type: "application/json" });
    
    // Nama file unik biar ga numpuk di server/IPFS
    const filename = `vault_${params.docHash.slice(0, 12)}_${Date.now()}.json`;
    const document = new File([blob], filename, { type: "application/json" });

    // 2. Bungkus ke FormData
    const fd = new FormData();
    
    // ⚠️ PENTING: Ganti "document" jadi "file"
    // (Kecuali kamu yakin 100% di backend codingannya upload.single('document'))
    fd.append("document", document); 
    
    fd.append("walletAddress", params.walletAddress);
    fd.append("category", params.category || "Encrypted");

    // 3. Tembak Backend Railway
    // API_BASE sudah kita atur di sesi sebelumnya agar mengarah ke Railway
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: fd,
      // Jangan set Content-Type header manual saat pake FormData! 
      // Browser akan otomatis set boundary-nya.
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Upload Error Response:", data);
      return {
        success: false,
        error: data?.error || `Server Upload Failed (${res.status})`,
      };
    }

    if (!data?.cid) {
      return {
        success: false,
        error: "Upload berhasil tapi tidak ada CID dari server.",
      };
    }

    return {
      success: true,
      cid: data.cid,
    };
  } catch (err) {
    console.error("Upload Exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network/Unknown error",
    };
  }
}