import type { Metadata } from 'next';
import './globals.css';
import { AdminNav } from '@/components/layout/AdminNav';

export const metadata: Metadata = {
  title: 'EchoSpeak Admin Studio',
  description: 'Upload, transcribe, and publish content with AI prosody tooling.',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="light">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AdminNav />
        {children}
      </body>
    </html>
  );
}
