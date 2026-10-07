import type { Metadata } from "next";
import "./globals.css";
import Invitation from "./invitation";

export const metadata: Metadata = {
  title: "Casa em Dia",
  description: "Família, casa e negócios num só lugar.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable: true, title: "Casa em Dia", statusBarStyle: "default"},
  icons: {
    apple: "/app-icon-192.png",
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className="antialiased"><Invitation/>{children}</body>
    </html>
  );
}
