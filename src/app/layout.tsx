import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Metadata global do app
 * Aparece no navegador, compartilhamento e SEO
 */
export const metadata: Metadata = {
  title: {
    default: "MSH Hidráulica",
    template: "%s • MSH Hidráulica",
  },
  description:
    "Sistema de gestão da MSH Hidráulica: agenda, ordens de serviço e notas.",
  applicationName: "MSH Hidráulica",
  authors: [{ name: "MSH Hidráulica" }],
  keywords: [
    "hidráulica",
    "ordem de serviço",
    "agenda",
    "notas",
    "gestão",
    "MSH",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
