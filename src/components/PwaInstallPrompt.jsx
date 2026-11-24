"use client";

import React, { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';

// Global shared state for install prompt
let globalDeferredPrompt = null;

export default function PwaInstallPrompt() {
  return null;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker for PWA installability
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW register failed:', err);
        });
      });
    }

    setIsMerchant(window.location.pathname.startsWith('/merchant'));

    // Check if already running as installed standalone app
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(checkStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setInstalledSuccess(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setInstalledSuccess(true);
          setTimeout(() => setInstalledSuccess(false), 5000);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // Direct native system action (Safari on iOS & native mobile share)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: isMerchant ? 'SkipQ Partner' : 'SkipQ',
          text: isMerchant ? 'Manage store queue with SkipQ Partner' : 'Book tokens online without physical waiting: SkipQ',
          url: window.location.href,
        });
      } catch (err) {
        // user dismissed sheet, no error
      }
    }
  };

  return {
    isStandalone,
    isMerchant,
    installedSuccess,
    triggerInstall,
  };
}

// 1. TOP NAVBAR DOWNLOAD / INSTALL BUTTON
export function PwaInstallTopButton() {
  const { isStandalone, isMerchant, triggerInstall } = usePwaInstall();

  // Hide if already running in standalone app mode
  if (isStandalone) return null;

  return (
    <button
      type="button"
      onClick={triggerInstall}
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl text-white text-xs font-black shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border shrink-0 ${
        isMerchant 
          ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border-amber-400/40 text-amber-50' 
          : 'bg-gradient-to-r from-emerald-600 to-[#176B65] hover:from-emerald-500 hover:to-[#125550] border-emerald-400/30'
      }`}
      title={isMerchant ? "Install SkipQ Partner" : "Download / Install SkipQ"}
      aria-label="Download / Install"
    >
      <Download className="w-4 h-4 animate-bounce text-white shrink-0" />
      <span className="hidden sm:inline font-bold">
        {isMerchant ? 'Install Partner' : 'Install'}
      </span>
    </button>
  );
}

// 2. DEDICATED NATIVE SHARE BUTTON
export function ShareAppButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const isMerchant = typeof window !== 'undefined' && window.location.pathname.startsWith('/merchant');
    const shareData = {
      title: isMerchant ? 'SkipQ Partner | Store Manager' : 'SkipQ | Skip the Wait. Own Your Time.',
      text: isMerchant 
        ? 'Manage counters and live customer tokens with SkipQ Partner:' 
        : 'Skip physical lines! Book your live token on SkipQ:',
      url: typeof window !== 'undefined' ? window.location.href : 'https://skipq-smoky.vercel.app/',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // user closed native share tray
        return;
      }
    }

    // Fallback: Copy URL to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.warn('Clipboard error:', err);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center justify-center p-2 sm:px-2.5 sm:py-2 rounded-2xl bg-white hover:bg-[#DCE9E3]/50 text-[#176B65] border border-[#DCE9E3] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
      title="Share SkipQ App with friends or customers"
      aria-label="Share App"
    >
      <Share2 className="w-4 h-4 text-[#176B65]" />
      <span className="hidden sm:inline ml-1 text-xs font-bold text-[#283B3D]">
        {copied ? 'Copied!' : 'Share'}
      </span>
    </button>
  );
}

// 3. BOTTOM FOOTER BUTTON
export function PwaInstallBottomButton() {
  const { isStandalone, isMerchant, triggerInstall } = usePwaInstall();

  if (isStandalone) return null;

  return (
    <button
      type="button"
      onClick={triggerInstall}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#DCE9E3] hover:text-white border border-white/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
    >
      <Download className="w-4 h-4 text-emerald-400" />
      <span>{isMerchant ? 'Install SkipQ Partner' : 'Install SkipQ'}</span>
    </button>
  );
}
