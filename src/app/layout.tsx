import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";


const appUrl = "https://sentry-gate-app.vercel.app";
export const metadata: Metadata = {
  title: "SentryGate",
  description: "Encrypted docs + Base + OnchainKit",
  manifest: "/manifest.json",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/icon.png`,
      button: {
        title: "Sentry Gate",
        action: {
          type: "launch_miniapp",
          name: "SentryGate",
          url: appUrl,
          splashImageUrl: `${appUrl}/icon.png`,
          splashBackgroundColor: "#000000",
        },
        },
    }),
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
