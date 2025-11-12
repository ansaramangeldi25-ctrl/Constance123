import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "agentkit Amazing",
  description: "agentkit Amazing - Powered by ChatKit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const domainKey = process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY;

  return (
    <html lang="en">
      <head>
        {domainKey ? (
          <meta name="openai-domain-key" content={domainKey} />
        ) : null}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
