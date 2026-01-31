// File: src/lib/api/client.ts
import axios from "axios";

// Ambil URL dari .env, kalau kosong fallback ke localhost
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

// Bikin instance Axios biar rapi
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});