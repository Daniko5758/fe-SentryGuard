import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://sentry-gate-app.vercel.app";

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
      iconUrl: `${appUrl}/icon.svg`,
      splashImageUrl: `${appUrl}/icon.svg`, 
      splashBackgroundColor: "#000000",
      description: "Secure Decentralized Document Vault on Base",
      primaryCategory: "utility",
      tags: ["security", "vault", "encryption"],
    }
  };

  return NextResponse.json(config);
}