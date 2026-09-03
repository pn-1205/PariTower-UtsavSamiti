import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import GlobalModals from '@/components/GlobalModals';

export const metadata: Metadata = {
  metadataBase: new URL('https://pt-utsav-samiti.vercel.app'),
  title: 'Pari Tower Utsav Samiti',
  description: 'Live financial accounts, collections, expenses & transparent general ledger for Pari Tower Utsav Samiti.',
  openGraph: {
    title: 'Pari Tower Utsav Samiti (PTUS)',
    description: 'Live financial accounts, collections, expenses & transparent general ledger for Pari Tower Utsav Samiti.',
    url: 'https://pt-utsav-samiti.vercel.app',
    siteName: 'PTUS Accounts',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Pari Tower Utsav Samiti (PTUS)',
    description: 'Live financial accounts, collections, expenses & transparent general ledger for Pari Tower Utsav Samiti.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col selection:bg-orange-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-20 md:pb-10">
            {children}
          </main>
          <BottomNav />
          <GlobalModals />
        </AuthProvider>
      </body>
    </html>
  );
}