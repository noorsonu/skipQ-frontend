import { Suspense } from 'react';
import "./globals.css";
import Navbar from "@/components/Navbar";
import { PwaInstallBottomButton } from "@/components/PwaInstallPrompt";

export const viewport = {
  themeColor: "#176B65",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: "SkipQ | Skip the Wait. Own Your Time.",
  description: "Book your token online, track your turn live, and visit when it's your time. The modern hyperlocal queue management platform.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkipQ",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
              });
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function(){});
              }
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F3F1E9] text-[#283B3D] flex flex-col antialiased selection:bg-[#176B65] selection:text-white">
        {/* Soft Background Warm Tones */}
        <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-[#DCE9E3]/50 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="fixed bottom-10 left-1/4 w-[500px] h-[500px] bg-[#176B65]/10 rounded-full blur-[130px] pointer-events-none -z-10"></div>

        <Suspense fallback={<div className="h-20 bg-[#F3F1E9] border-b border-[#DCE9E3]" />}>
          <Navbar />
        </Suspense>

        <main className="flex-1 w-full mx-auto pb-10 md:pb-16">
          <Suspense fallback={<div className="py-24 text-center text-sm font-semibold text-[#176B65]">Loading SkipQ...</div>}>
            {children}
          </Suspense>
        </main>

        {/* Footer with Universal Dual App Download & Share */}
        <footer className="bg-[#283B3D] text-[#DCE9E3] border-t border-slate-700/50 py-12 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Full-width Universal Dual App Section (Customer & Worker) */}
            <PwaInstallBottomButton />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-700/60 pt-6">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-300 font-semibold text-xs">
                <a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                <a href="/shops" className="hover:text-white transition-colors">Explore Places</a>
                <a href="/tokens" className="hover:text-white transition-colors">My Live Tokens</a>
                <a href="/merchant/register?tab=login" className="hover:text-white transition-colors">Partner Dashboard</a>
              </div>

              <p className="text-slate-400 font-medium">
                © 2026 SkipQ Platform. Available Across India.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
