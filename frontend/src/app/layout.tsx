import type { Metadata } from 'next';
import { ScanlineOverlay } from '@/components/ScanlineOverlay';
import { NavBar } from '@/components/NavBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Administratum 88k',
  description: 'Petition workflow engine — Administratum 88k',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-term-bg text-term-text antialiased">
        <ScanlineOverlay />
        <NavBar />
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
