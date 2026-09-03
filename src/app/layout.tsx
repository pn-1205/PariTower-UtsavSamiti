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
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/logo.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
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
      <body className="min-h-screen bg-[#faf8f5] text-stone-900 antialiased flex flex-col selection:bg-rose-900 selection:text-amber-100">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-6">
            {children}
          </main>
          <footer className="w-full py-4 px-4 text-center text-xs text-stone-500 border-t border-stone-200/60 pb-20 md:pb-6">
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
              <span>Built with <span className="text-rose-600">❤️</span> for Pari Tower Utsav Samiti</span>
              <span className="text-stone-300">•</span>
              <span>
                Powered by{' '}
                <a
                  href="https://numendynamics.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-stone-700 hover:text-rose-900 underline underline-offset-2 transition-colors"
                >
                  numendynamics.in
                </a>
              </span>
            </p>
          </footer>
          <BottomNav />
          <GlobalModals />
        </AuthProvider>
      </body>
    </html>
  );
}