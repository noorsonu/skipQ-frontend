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

    // Register Service Worker for PWA installability
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW register failed:', err);
        });
      });
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

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      triggerIfRequested(globalDeferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (forMerchant = false) => {
    const isCurrentlyMerchant = typeof window !== 'undefined' && window.location.pathname.startsWith('/merchant');

    // 1. If user wants to install Worker App but is currently on Customer pages (/ or /login or /shops):
    // The browser needs the Worker App manifest & scope (/merchant/*) to install it!
    if (forMerchant && !isCurrentlyMerchant) {
      if (typeof window !== 'undefined') {
        window.location.href = '/merchant/register?install=true';
      }
      return 'redirecting';
    }

    // 2. If user wants to install Customer App but is currently on Merchant pages:
    if (!forMerchant && isCurrentlyMerchant) {
      if (typeof window !== 'undefined') {
        window.location.href = '/?install=true';
      }
      return 'redirecting';
    }

    // 3. Trigger native browser prompt if captured
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          return 'installed';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // 4. Clean device fallback instructions (NEVER trigger navigator.share on a Download button!)
    const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      return 'ios_safari';
    }

    return 'browser_menu';
  };

  const triggerShare = async (forMerchant = false) => {
    const shareUrl = forMerchant 
      ? 'https://skipq-smoky.vercel.app/merchant/dashboard' 
      : 'https://skipq-smoky.vercel.app/';
    const shareTitle = forMerchant ? 'SkipQ Partner App' : 'SkipQ App';
    const shareText = forMerchant 
      ? '📲 Install SkipQ Partner App — Store Queue & Counter Calling Dashboard:\n' 
      : '📲 Install SkipQ App — Book digital tokens and skip waiting:\n';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return true;
      } catch (err) {
        // user cancelled share
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

// 1. UNIVERSAL DUAL APP FOOTER (BOTTOM OF EVERY PAGE FOR ALL USERS)
export function UniversalDualAppFooter() {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [customerCopied, setCustomerCopied] = useState(false);
  const [merchantCopied, setMerchantCopied] = useState(false);
  const [customerInstallMsg, setCustomerInstallMsg] = useState('');
  const [merchantInstallMsg, setMerchantInstallMsg] = useState('');

  const handleCustomerInstall = async () => {
    const res = await triggerInstall(false);
    if (res === 'redirecting') {
      setCustomerInstallMsg('Opening Customer App to Install...');
    } else if (res === 'ios_safari') {
      setCustomerInstallMsg('Safari: tap Share (⎋) → "Add to Home Screen"');
      setTimeout(() => setCustomerInstallMsg(''), 5000);
    } else if (res === 'browser_menu') {
      setCustomerInstallMsg('Tap browser menu (⋮) → "Install app"');
      setTimeout(() => setCustomerInstallMsg(''), 5000);
    } else if (res === 'installed') {
      setCustomerInstallMsg('App Installed Successfully!');
      setTimeout(() => setCustomerInstallMsg(''), 4000);
    }
  };

  const handleMerchantInstall = async () => {
    const res = await triggerInstall(true);
    if (res === 'redirecting') {
      setMerchantInstallMsg('Opening Worker App to Install...');
    } else if (res === 'ios_safari') {
      setMerchantInstallMsg('Safari: tap Share (⎋) → "Add to Home Screen"');
      setTimeout(() => setMerchantInstallMsg(''), 5000);
    } else if (res === 'browser_menu') {
      setMerchantInstallMsg('Tap browser menu (⋮) → "Install app"');
      setTimeout(() => setMerchantInstallMsg(''), 5000);
    } else if (res === 'installed') {
      setMerchantInstallMsg('Worker App Installed Successfully!');
      setTimeout(() => setMerchantInstallMsg(''), 4000);
    }
  };

  const handleCustomerShare = async () => {
    const res = await triggerShare(false);
    if (res === 'copied') {
      setCustomerCopied(true);
      setTimeout(() => setCustomerCopied(false), 2500);
    }
  };

  const handleMerchantShare = async () => {
    const res = await triggerShare(true);
    if (res === 'copied') {
      setMerchantCopied(true);
      setTimeout(() => setMerchantCopied(false), 2500);
    }
  };

  return (
    <div className="w-full bg-[#1e2f31] border border-slate-700/70 rounded-3xl p-5 sm:p-7 text-[#DCE9E3] space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </span>
            <h4 className="text-sm sm:text-base font-black text-white">
              Install & Share SkipQ Mobile Apps (Customer & Worker)
            </h4>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Install directly on your phone home screen or share the direct app link with friends & store owners.
          </p>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full w-fit shrink-0">
          Zero Play Store Download Needed
        </span>
      </div>

      {/* 2 Dedicated App Cards: Customer App & Worker App */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: CUSTOMER APP */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>SkipQ Customer App</span>
                  <span className="text-[9px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md">
                    Customer
                  </span>
                </h5>
                <p className="text-[11px] text-slate-400">Book live queue passes & track waiting time from home</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCustomerInstall}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download & Install</span>
            </button>

            <button
              type="button"
              onClick={handleCustomerShare}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{customerCopied ? 'Link Copied!' : 'Share Customer App'}</span>
            </button>
          </div>
          {customerInstallMsg && (
            <p className="text-[11px] font-bold text-emerald-300 text-center animate-pulse pt-0.5">
              {customerInstallMsg}
            </p>
          )}
        </div>

        {/* CARD 2: WORKER / MERCHANT PARTNER APP */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>SkipQ Partner App</span>
                  <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md">
                    Worker / Store
                  </span>
                </h5>
                <p className="text-[11px] text-slate-400">Live counter operations, chair calling & store billing</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleMerchantInstall}
              className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download & Install</span>
            </button>

            <button
              type="button"
              onClick={handleMerchantShare}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{merchantCopied ? 'Link Copied!' : 'Share Worker App'}</span>
            </button>
          </div>
          {merchantInstallMsg && (
            <p className="text-[11px] font-bold text-amber-300 text-center animate-pulse pt-0.5">
              {merchantInstallMsg}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

// 2. DUAL APP SECTION (EMBEDDED IN CUSTOMER & WORKER DROPDOWNS & LOGIN PAGE)
export function DualAppMenuSection({ title = "Install & Share Mobile Apps" }) {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [customerCopied, setCustomerCopied] = useState(false);
  const [merchantCopied, setMerchantCopied] = useState(false);

  const handleCustomerShare = async () => {
    const res = await triggerShare(false);
    if (res === 'copied') {
      setCustomerCopied(true);
      setTimeout(() => setCustomerCopied(false), 2000);
    }
  };

  const handleMerchantShare = async () => {
    const res = await triggerShare(true);
    if (res === 'copied') {
      setMerchantCopied(true);
      setTimeout(() => setMerchantCopied(false), 2000);
    }
  };

  return (
    <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] space-y-3">
      <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-2">
        <span className="text-[10px] font-black uppercase text-[#176B65] tracking-wider flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5" /> {title}
        </span>
        <span className="text-[9px] font-bold bg-[#176B65] text-white px-1.5 py-0.2 rounded-md">
          Dual PWA
        </span>
      </div>

      {/* Customer App Row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#283B3D] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Customer App
          </span>
          <span className="text-[10px] text-slate-500">For booking tokens</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => triggerInstall(false)}
            className="py-1.5 px-2 rounded-xl bg-[#176B65] hover:bg-[#125550] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3 h-3 shrink-0" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleCustomerShare}
            className="py-1.5 px-2 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE9E3] text-[#283B3D] text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Share2 className="w-3 h-3 text-[#176B65] shrink-0" />
            <span>{customerCopied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Worker App Row */}
      <div className="space-y-1.5 pt-2 border-t border-[#DCE9E3]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#283B3D] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Worker / Partner App
          </span>
          <span className="text-[10px] text-slate-500">For counter desks</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => triggerInstall(true)}
            className="py-1.5 px-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download className="w-3 h-3 shrink-0" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleMerchantShare}
            className="py-1.5 px-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-[#283B3D] text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Share2 className="w-3 h-3 text-amber-700 shrink-0" />
            <span>{merchantCopied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Aliases for clean backward compatibility
export const CustomerAppMenuSection = DualAppMenuSection;
export const MerchantAppMenuSection = DualAppMenuSection;
export const PwaInstallBottomButton = UniversalDualAppFooter;
