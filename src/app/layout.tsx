import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import GlobalModals from '@/components/GlobalModals';

export const metadata: Metadata = {
  title: 'Pari Tower Festival Committee',
  description: 'Community Festival Financial Tracking Application for Pari Tower',
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