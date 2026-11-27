import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BST",
  description:
    "A photo of a lab report or prescription goes in. Structured, verified health data comes out.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            BST
          </Link>
          <nav>
            <Link href="/upload">Upload</Link>
            <Link href="/timeline">Timeline</Link>
            <Link href="/share">Share</Link>
            <Link href="/clinician">Clinician</Link>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
