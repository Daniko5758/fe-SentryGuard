import { hexToBytes } from "./base64";
import { sha256Bytes } from "./hash";

const INFO = new TextEncoder().encode("SecureOnchainVault/v1");

export async function deriveAesKeyFromSignature(params: {
  signatureHex: string;
  salt: Uint8Array;
}): Promise<CryptoKey> {
  // 1. Signature Hex -> Bytes
  const sigBytes = hexToBytes(params.signatureHex);

  // 2. Hash signature biar jadi IKM (Input Key Material)
  const ikm = await sha256Bytes(sigBytes);

  // 3. Import Key Material ke Web Crypto API
  // CATATAN: Pakai 'as any' biar TypeScript diam
  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    ikm as any, 
    "HKDF",
    false,
    ["deriveKey"]
  );

  // 4. Derive Key (Turunkan kunci AES-GCM dari HKDF)
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: params.salt as any, // Pakai 'as any' juga di sini
      info: INFO,
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}