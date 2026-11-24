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
  const [isMerchant, setIsMerchant] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
    isMerchant,
    modalOpen,
    setModalOpen,
    installedSuccess,
    triggerInstall,
  };
}

// 1. TOP NAVBAR BUTTON
export function PwaInstallTopButton() {
  const { isStandalone, isMerchant, modalOpen, setModalOpen, isIOS, triggerInstall } = usePwaInstall();

  // Hide if already running in standalone app mode
  if (isStandalone) return null;

  return (
    <>
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

      {/* Guide Modal */}
      <InstallGuideModal isOpen={modalOpen} onClose={() => setModalOpen(false)} isIOS={isIOS} isMerchant={isMerchant} />
    </>
  );
}

// 2. BOTTOM FOOTER BUTTON
export function PwaInstallBottomButton() {
  const { isStandalone, isMerchant, modalOpen, setModalOpen, isIOS, triggerInstall } = usePwaInstall();

  if (isStandalone) return null;

  return (
    <>
      <button
        type="button"
        onClick={triggerInstall}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#DCE9E3] hover:text-white border border-white/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        <span>{isMerchant ? 'Install SkipQ Partner' : 'Install SkipQ'}</span>
      </button>

      <InstallGuideModal isOpen={modalOpen} onClose={() => setModalOpen(false)} isIOS={isIOS} isMerchant={isMerchant} />
    </>
  );
}

// 3. VISUAL GUIDE MODAL (FOR IOS & MANUAL INSTALL)
function InstallGuideModal({ isOpen, onClose, isIOS, isMerchant }) {
  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : 'android');

  useEffect(() => {
    setActiveTab(isIOS ? 'ios' : 'android');
  }, [isIOS]);

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
          className="relative w-full max-w-[330px] bg-white rounded-3xl p-5 shadow-2xl border border-[#DCE9E3] space-y-3.5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DCE9E3]/70 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                isMerchant ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-[#176B65]'
              }`}>
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#283B3D] leading-tight">
                  {isMerchant ? 'Install SkipQ Partner' : 'Install SkipQ'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Quick 1-tap mobile access</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* OS Switcher */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'android' ? 'bg-white text-[#283B3D] shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'ios' ? 'bg-white text-[#283B3D] shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              iPhone / iPad
            </button>
          </div>

          {/* Clean 2-step Instructions in English */}
          {activeTab === 'ios' ? (
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F3F1E9] border border-[#DCE9E3] text-xs text-[#283B3D]">
                <Share2 className="w-4 h-4 text-[#176B65] shrink-0" />
                <span><strong>1.</strong> Tap <strong>Share ( ⬆ )</strong> in Safari</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F3F1E9] border border-[#DCE9E3] text-xs text-[#283B3D]">
                <PlusSquare className="w-4 h-4 text-[#176B65] shrink-0" />
                <span><strong>2.</strong> Choose <strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F3F1E9] border border-[#DCE9E3] text-xs text-[#283B3D]">
                <Download className="w-4 h-4 text-[#176B65] shrink-0" />
                <span><strong>1.</strong> Tap <strong>Install</strong> on browser prompt</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F3F1E9] border border-[#DCE9E3] text-xs text-[#283B3D]">
                <PlusSquare className="w-4 h-4 text-[#176B65] shrink-0" />
                <span><strong>2.</strong> Or Chrome menu <strong>( ⋮ ) → Install app</strong></span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-white font-black text-xs shadow-sm transition-all cursor-pointer text-center ${
              isMerchant ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#176B65] hover:bg-[#125550]'
            }`}
          >
            Got It
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
