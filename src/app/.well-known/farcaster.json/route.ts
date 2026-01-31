import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://sentry-gate-app.vercel.app";

  const config = {
    "accountAssociation": {
    "header": "eyJmaWQiOjI0Mjc5OTYsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg0ODNFMWVFYzY2NjNkMmVFODU1MTJiMTlFNkI0Q0IwRjNlRDA2MDNmIn0",
    "payload": "eyJkb21haW4iOiJzZW50cnktZ2F0ZS1hcHAudmVyY2VsLmFwcCJ9",
    "signature": "Yu2tA5RDRQbxU9jpHPrzIbkD9EqHgGE/9JD4JVjfQANCb4OtW2dLtHCkf9n45kJ0GgXoFftP557GWWwUyRFZ2Rs="
  },
    miniapp: {
      version: "1",
      name: "SentryGate",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/icon.png`, 
      splashBackgroundColor: "#000000",
      description: "Secure Decentralized Document Vault on Base",
      primaryCategory: "utility",
      tags: ["security", "vault", "encryption"],
    }
  };

  return NextResponse.json(config);
}