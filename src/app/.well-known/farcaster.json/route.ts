import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://sentry-gate-app.vercel.app/"; // Ganti dengan URL Vercel kamu yang asli

  const config = {
    accountAssociation: {
      // KOSONGKAN DULU, NANTI DIISI SETELAH DEPLOY PERTAMA
      header: "",
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "SentryGate",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/vercel.svg`, // Pastikan ada file icon.png di folder public
      splashImageUrl: `${appUrl}/vercel.svg`, 
      splashBackgroundColor: "#000000",
      description: "Secure Decentralized Document Vault on Base",
      primaryCategory: "utility",
      tags: ["security", "vault", "encryption"],
    }
  };

  return NextResponse.json(config);
}