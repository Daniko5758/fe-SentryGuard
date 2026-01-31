import { EncryptedPayloadV1 } from "@/lib/crypto/encrypt";

// Gateway IPFS publik (bisa diganti gateway dedicated jika punya)
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export async function fetchEncryptedPayload(cid: string): Promise<EncryptedPayloadV1> {
  const url = `${IPFS_GATEWAY}${cid}`;
  
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(`Gagal download file dari IPFS (CID: ${cid})`);
  }

  const json = await res.json();
  
  // Validasi sederhana apakah ini format enkripsi kita
  if (!json.ciphertextB64 || !json.ivB64) {
    throw new Error("Format file di IPFS tidak valid / bukan file terenkripsi.");
  }

  return json as EncryptedPayloadV1;
}