import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MerlinWalletProvider } from './wallet-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Merlin - Solana AI Assistant",
  description: "Your AI-powered Solana blockchain assistant for sending SOL, bridging tokens, and managing your Solana wallet through natural language commands.",
  keywords: ["Solana", "AI", "Blockchain", "Crypto", "Wallet", "Assistant", "DeFi"],
  authors: [{ name: "Merlin Team" }],
  creator: "Merlin",
  publisher: "Merlin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3005'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Merlin - Solana AI Assistant",
    description: "Your AI-powered Solana blockchain assistant for sending SOL, bridging tokens, and managing your Solana wallet through natural language commands.",
    url: 'http://localhost:3005',
    siteName: 'Merlin',
    images: [
      {
        url: '/merlin-preview.png',
        width: 1200,
        height: 630,
        alt: 'Merlin - Solana AI Assistant Interface',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Merlin - Solana AI Assistant",
    description: "Your AI-powered Solana blockchain assistant for sending SOL, bridging tokens, and managing your Solana wallet through natural language commands.",
    images: ['/merlin-preview.png'],
    creator: '@merlin',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MerlinWalletProvider>
          {children}
        </MerlinWalletProvider>
      </body>
    </html>
  );
}
