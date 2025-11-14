import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap-italia/dist/css/bootstrap-italia.min.css";
import "./globals.css";
import Navbar from "./components/Navbar";
import ToastProvider from "./components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gestione App Eramus",
  description: "Pannello gestionale per utenti e inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>
        <Navbar />
        <ToastProvider />
        <main className="container mt-4">{children}</main>
      </body>
    </html>
  );
}
