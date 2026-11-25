"use client";

import React, { useState, useEffect } from 'react';
import { Download, Share2, Smartphone, X, CheckCircle2, User, Store, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global shared state for install prompt
let globalDeferredPrompt = null;

export default function PwaInstallPrompt() {
  return null;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register Service Worker immediately for PWA installability
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW register failed:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    setIsMerchant(window.location.pathname.startsWith('/merchant'));

    // Check if running in standalone mode
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(checkStandalone);

    const triggerIfRequested = (promptObj) => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('install') === 'true' && promptObj) {
          setTimeout(() => {
            try {
              promptObj.prompt();
            } catch (err) {}
          }, 700);
        }
      }
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      triggerIfRequested(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    if (typeof window !== 'undefined' && window.__pwaPrompt) {
      globalDeferredPrompt = window.__pwaPrompt;
      setDeferredPrompt(window.__pwaPrompt);
      triggerIfRequested(window.__pwaPrompt);
    }

    const onPromptReady = () => {
      if (typeof window !== 'undefined' && window.__pwaPrompt) {
        globalDeferredPrompt = window.__pwaPrompt;
        setDeferredPrompt(window.__pwaPrompt);
        triggerIfRequested(window.__pwaPrompt);
      }
    };
    window.addEventListener('pwa-prompt-ready', onPromptReady);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      triggerIfRequested(globalDeferredPrompt);
    }

    return () => {
      window.removeEventListener('pwa-prompt-ready', onPromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    // 1. Trigger native browser install prompt if available
    let promptEvent = deferredPrompt || globalDeferredPrompt;
    if (typeof window !== 'undefined' && window.__pwaPrompt) {
      promptEvent = window.__pwaPrompt;
    }

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') window.__pwaPrompt = null;
          return 'installed';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // 2. Clean device fallback instructions
    const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      return 'ios_safari';
    }

    return 'browser_menu';
  };

  const triggerShare = async () => {
    const shareUrl = 'https://skipq-smoky.vercel.app/';
    const shareTitle = 'SkipQ Mobile App';
    const shareText = '📲 Install SkipQ Mobile App — Book live queue tokens & manage shop counters without waiting:\n';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return true;
      } catch (err) {
        return false;
      }
    }

    // Clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
        return 'copied';
      } catch (err) {
        console.warn('Clipboard error:', err);
      }
    }
    return false;
  };

  return {
    isStandalone,
    isMerchant,
    triggerInstall,
    triggerShare,
  };
}

// 1. UNIVERSAL SINGLE APP FOOTER (BOTTOM OF EVERY PAGE FOR ALL USERS)
export function UniversalDualAppFooter() {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [copied, setCopied] = useState(false);
  const [installMsg, setInstallMsg] = useState('');

  const handleInstall = async () => {
    const res = await triggerInstall();
    if (res === 'ios_safari') {
      setInstallMsg('Safari: tap Share (⎋) → "Add to Home Screen"');
      setTimeout(() => setInstallMsg(''), 6000);
    } else if (res === 'browser_menu') {
      setInstallMsg('Tap browser menu (⋮) → "Install app"');
      setTimeout(() => setInstallMsg(''), 6000);
    } else if (res === 'installed') {
      setInstallMsg('✅ SkipQ App installed on home screen!');
      setTimeout(() => setInstallMsg(''), 5000);
    }
  };

  const handleShare = async () => {
    const res = await triggerShare();
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full bg-[#1e2f31] border border-slate-700/70 rounded-3xl p-5 sm:p-7 text-[#DCE9E3] shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* App Info */}
        <div className="flex items-center gap-3.5 sm:gap-4 text-center md:text-left">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#176B65] border border-emerald-400/30 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <h4 className="text-base sm:text-lg font-black text-white">
                SkipQ Mobile App
              </h4>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Book live tokens, track queue waiting radar & manage shop counters — Zero wait.
            </p>
          </div>
        </div>

        {/* 2 Clean Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download & Install App</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{copied ? 'Link Copied!' : 'Share App'}</span>
          </button>
        </div>

      </div>

      {installMsg && (
        <p className="text-xs font-bold text-emerald-300 text-center animate-pulse pt-3 border-t border-slate-700/60 mt-4">
          {installMsg}
        </p>
      )}
    </div>
  );
}

// 2. SINGLE APP SECTION (FOR EMBEDDED MENUS)
export function DualAppMenuSection({ title = "SkipQ Mobile App" }) {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [copied, setCopied] = useState(false);
  const [installMsg, setInstallMsg] = useState('');

  const handleInstall = async () => {
    const res = await triggerInstall();
    if (res === 'ios_safari') {
      setInstallMsg('Safari: tap Share (⎋) → "Add to Home Screen"');
      setTimeout(() => setInstallMsg(''), 5000);
    } else if (res === 'browser_menu') {
      setInstallMsg('Tap browser menu (⋮) → "Install app"');
      setTimeout(() => setInstallMsg(''), 5000);
    } else if (res === 'installed') {
      setInstallMsg('✅ Installed on home screen!');
      setTimeout(() => setInstallMsg(''), 4000);
    }
  };

  const handleShare = async () => {
    const res = await triggerShare();
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3.5 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] space-y-2.5">
      <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-2">
        <span className="text-xs font-black text-[#176B65] flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" /> {title}
        </span>
        <span className="text-[9px] font-bold bg-[#176B65] text-white px-2 py-0.5 rounded-md">
          Official
        </span>
      </div>

      <p className="text-[11px] text-slate-500 font-medium">
        Install app for instant token booking & counter live calling
      </p>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleInstall}
          className="py-2 px-2.5 rounded-xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Download</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE9E3] text-[#283B3D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5 text-[#176B65] shrink-0" />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {installMsg && (
        <p className="text-[10px] font-bold text-[#176B65] text-center pt-1 animate-pulse">
          {installMsg}
        </p>
      )}
    </div>
  );
}

// Aliases for clean backward compatibility
export const CustomerAppMenuSection = DualAppMenuSection;
export const MerchantAppMenuSection = DualAppMenuSection;
export const PwaInstallBottomButton = UniversalDualAppFooter;
