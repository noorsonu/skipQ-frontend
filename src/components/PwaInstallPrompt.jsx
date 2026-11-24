"use client";

import React, { useState, useEffect } from 'react';
import { Download, Share2, Smartphone, X, Check, CheckCircle2 } from 'lucide-react';
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

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
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
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (forMerchant = null) => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          return true;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }

    // Direct native system trigger (Safari iOS / Android)
    const isMerch = forMerchant !== null ? forMerchant : isMerchant;
    const shareUrl = isMerch ? 'https://skipq-smoky.vercel.app/merchant/dashboard' : 'https://skipq-smoky.vercel.app/';
    const shareTitle = isMerch ? 'SkipQ Partner App' : 'SkipQ App';
    const shareText = isMerch 
      ? '📲 Install SkipQ Partner App — Store Queue & Counter Dashboard:\n' 
      : '📲 Install SkipQ App — Book live tokens & avoid waiting:\n';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return true;
      } catch (err) {
        // user closed native sheet
        return false;
      }
    }
    return false;
  };

  const triggerShare = async (forMerchant = null) => {
    const isMerch = forMerchant !== null ? forMerchant : isMerchant;
    const shareUrl = isMerch 
      ? 'https://skipq-smoky.vercel.app/merchant/dashboard' 
      : 'https://skipq-smoky.vercel.app/';
    const shareTitle = isMerch ? 'SkipQ Partner App' : 'SkipQ App';
    const shareText = isMerch 
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

// 1. MODAL WITH [INSTALL] AND [SHARE] OPTIONS
export function AppActionModal({ isOpen, onClose, forMerchant = false }) {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    await triggerInstall(forMerchant);
    onClose();
  };

  const handleShareClick = async () => {
    const res = await triggerShare(forMerchant);
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-[320px] bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE9E3] space-y-4 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DCE9E3]/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                forMerchant ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-[#176B65]'
              }`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#283B3D] leading-tight">
                  {forMerchant ? 'SkipQ Partner App' : 'SkipQ App'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Select an action</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 2 Main Action Choices */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className={`w-full p-3 rounded-2xl text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-98 ${
                forMerchant ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#176B65] hover:bg-[#125550]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 shrink-0" />
                <span className="text-left font-black">Download & Install App</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">1-Tap</span>
            </button>

            <button
              type="button"
              onClick={handleShareClick}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-[#DCE9E3]/50 text-[#283B3D] border border-[#DCE9E3] font-bold text-xs flex items-center justify-between transition-all cursor-pointer active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-[#176B65] shrink-0" />
                <span className="text-left font-black">
                  {copied ? 'Link Copied to Clipboard!' : 'Share Direct App Link'}
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-[#176B65] px-2 py-0.5 rounded-md font-bold">Share</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// 2. EMBEDDED INSIDE CUSTOMER PROFILE / DROPDOWN
export function CustomerAppMenuSection() {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const res = await triggerShare(false);
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-[#176B65] tracking-wider flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5" /> SkipQ Mobile App
        </span>
        <span className="text-[9px] font-bold bg-[#176B65] text-white px-1.5 py-0.5 rounded-md">
          Official
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => triggerInstall(false)}
          className="py-2 px-2.5 rounded-xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
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
    </div>
  );
}

// 3. EMBEDDED INSIDE SHOPKEEPER / MERCHANT PROFILE / DROPDOWN
export function MerchantAppMenuSection() {
  const { triggerInstall, triggerShare } = usePwaInstall();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const res = await triggerShare(true);
    if (res === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-amber-700" /> SkipQ Partner App
        </span>
        <span className="text-[9px] font-bold bg-amber-700 text-white px-1.5 py-0.5 rounded-md">
          Worker
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => triggerInstall(true)}
          className="py-2 px-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2 px-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-[#283B3D] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </div>
  );
}

// 4. BOTTOM FOOTER BUTTON (OPENS THE 2-CHOICE MODAL)
export function PwaInstallBottomButton() {
  const { isStandalone, isMerchant } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);

  if (isStandalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#DCE9E3] hover:text-white border border-white/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>{isMerchant ? 'SkipQ Partner App' : 'SkipQ Mobile App'}</span>
      </button>

      <AppActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        forMerchant={isMerchant}
      />
    </>
  );
}
