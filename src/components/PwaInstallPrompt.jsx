"use client";

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Global shared state for install prompt
let globalDeferredPrompt = null;

export default function PwaInstallPrompt() {
  return null;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as installed standalone app
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(checkStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

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

    // Fallback: Show visual helper modal (especially for iOS Safari or manual instruction)
    setModalOpen(true);
  };

  return {
    isStandalone,
    isIOS,
    modalOpen,
    setModalOpen,
    installedSuccess,
    triggerInstall,
  };
}

// 1. TOP NAVBAR BUTTON
export function PwaInstallTopButton() {
  const { isStandalone, modalOpen, setModalOpen, isIOS, triggerInstall } = usePwaInstall();

  // Hide if already running in standalone app mode
  if (isStandalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-[#176B65] hover:from-emerald-500 hover:to-[#125550] text-white text-xs font-black shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border border-emerald-400/30 shrink-0"
        title="Install SkipQ App directly to your Mobile Home Screen"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">App</span>
        <span className="text-[9px] uppercase font-bold bg-amber-400 text-slate-900 px-1 py-0.2 rounded-md">
          Free
        </span>
      </button>

      {/* Guide Modal */}
      <InstallGuideModal isOpen={modalOpen} onClose={() => setModalOpen(false)} isIOS={isIOS} />
    </>
  );
}

// 2. BOTTOM FOOTER BUTTON
export function PwaInstallBottomButton() {
  const { isStandalone, modalOpen, setModalOpen, isIOS, triggerInstall } = usePwaInstall();

  if (isStandalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#DCE9E3] hover:text-white border border-white/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>📲 Install SkipQ Mobile App</span>
      </button>

      <InstallGuideModal isOpen={modalOpen} onClose={() => setModalOpen(false)} isIOS={isIOS} />
    </>
  );
}

// 3. VISUAL GUIDE MODAL (FOR IOS & MANUAL INSTALL)
function InstallGuideModal({ isOpen, onClose, isIOS }) {
  if (!isOpen) return null;

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
          className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#DCE9E3] space-y-4 z-10"
        >
          <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-[#176B65] flex items-center justify-center shadow-2xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#283B3D]">Install SkipQ App</h3>
                <span className="text-[10px] text-slate-500 font-semibold">1-Tap Fast Mobile Access</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isIOS ? (
            <div className="space-y-3 py-1">
              <p className="text-xs text-[#283B3D] font-bold">
                iPhone / iPad Par Install Karne Ke Liye (2 Steps):
              </p>
              
              <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0 text-[#176B65]">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong>Step 1:</strong> Neeche Safari me <strong>Share button (⬆)</strong> dabayein.
                </div>
              </div>

              <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0 text-[#176B65]">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <strong>Step 2:</strong> Menu me <strong>"Add to Home Screen" (+)</strong> select karein.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              <p className="text-xs text-[#283B3D] font-bold">
                Android / Computer Par Install Karne Ke Liye:
              </p>

              <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0 text-[#176B65]">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  Screen par <strong>"Install / Add to Home screen"</strong> ka pop-up aayega, uspe <strong>"Install"</strong> dabayein.
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                App aapke phone ke home screen par save ho jayega aur bina browser ke direct khulega!
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-black text-xs shadow-md transition-all cursor-pointer text-center"
          >
            Samajh Gaya (Close)
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
