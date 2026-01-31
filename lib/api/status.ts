import { apiClient } from "./client";

// Kita definisikan tipe data sesuai respon dari Backend Railway
export type PaymentStatus =
  | { status: "active"; expiry?: number }
  | { status: "inactive"; message?: string };

// Fungsi utama untuk mengambil status
export async function fetchPaymentStatus(address: string): Promise<PaymentStatus> {
  // 1. Ambil URL Railway dari .env.local
  // Pastikan di .env.local namanya NEXT_PUBLIC_API_URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    console.error("❌ NEXT_PUBLIC_API_URL belum di-set di .env.local!");
    // Return inactive biar aplikasi ga crash, tapi user terkunci
    return { status: "inactive" };
  }

  // 2. Bersihkan slash di akhir URL (jika ada) biar rapi
  const cleanBase = baseUrl.replace(/\/+$/, "");

  // 3. Panggil Endpoint Railway yang BENAR (/api/status/...)
  // Backend kamu definisinya: app.get("/api/status/:address")
  const url = `${cleanBase}/api/status/${address}`;

  console.log(`📡 Checking status to: ${url}`); // Debugging di Console Browser

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store", // Jangan cache, biar statusnya real-time
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      // Handle error 404 atau 500 dari Railway
      console.error(`Railway Error: ${res.status} ${res.statusText}`);
      return { status: "inactive" };
    }

    // 4. Return JSON dari Railway
    return await res.json();
    
  } catch (error) {
    console.error("🔥 Gagal connect ke Backend:", error);
    // Kembalikan status inactive daripada aplikasi crash total
    return { status: "inactive" };
  }
}