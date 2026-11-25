"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  History, Store, Calendar, Clock, Ticket, ArrowRight, RotateCw, 
  MapPin, CheckCircle2, ChevronRight, X, Sparkles, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { queueApi } from '@/lib/api';
import { enforceCleanSlate } from '@/lib/storageSync';

export default function ServiceHistoryPage() {
  const router = useRouter();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    enforceCleanSlate();

    const loadHistory = async () => {
      setLoading(true);
      let items = [];

      // 1. Try fetching from Backend API
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ak_token') : null;
        if (token) {
          const res = await queueApi.getMyTokenHistory();
          if (res?.data?.data && Array.isArray(res.data.data)) {
            items = res.data.data.filter(t => t.status === 'COMPLETED' || t.status === 'SERVED');
          }
        }
      } catch (err) {
        console.warn('Backend history fetch error:', err);
      }

      // 2. Also check LocalStorage history for guest/offline completed tokens
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('ak_my_tokens');
          if (raw) {
            const localTokens = JSON.parse(raw);
            if (Array.isArray(localTokens)) {
              localTokens.forEach(lt => {
                if ((lt.status === 'COMPLETED' || lt.status === 'SERVED') && !items.some(it => String(it.id) === String(lt.id))) {
                  items.push(lt);
                }
              });
            }
          }
        } catch (e) {}
      }

      // Sort newest first
      items.sort((a, b) => {
        const tA = new Date(a.completedAt || a.servedAt || a.createdAt || 0).getTime();
        const tB = new Date(b.completedAt || b.servedAt || b.createdAt || 0).getTime();
        return tB - tA;
      });

      setHistoryList(items);
      setLoading(false);
    };

    loadHistory();
  }, []);

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE9E3] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE9E3] text-[#176B65] text-xs font-bold">
            <History className="w-3.5 h-3.5" />
            <span>Customer Service Log</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#283B3D]">Service History</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review your past shop visits, completed services, and re-book with 1 click.
          </p>
        </div>

        <Link
          href="/shops"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Browse Places & Queues</span>
        </Link>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-[#176B65] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading your service history...</p>
        </div>
      ) : historyList.length === 0 ? (
        /* Empty State: No Service History Found */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#DCE9E3] space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#DCE9E3]/70 text-[#176B65] flex items-center justify-center mx-auto border border-[#176B65]/20 shadow-2xs">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-[#283B3D]">No Service History Found</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              You haven't completed any visits yet. When you book a token and complete your visit at a salon, clinic, or store, your history will appear here.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#F2A15A]" />
              <span>Explore Places & Book Token</span>
              <ArrowRight className="w-4 h-4 text-[#F2A15A]" />
            </Link>
          </div>
        </div>
      ) : (
        /* History Items List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {historyList.map((item, idx) => {
            const dateStr = item.completedAt || item.servedAt || item.createdAt
              ? new Date(item.completedAt || item.servedAt || item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent Visit';

            const shopSlug = item.shopSlug || (item.shopName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedVisit(item)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE9E3] shadow-xs hover:shadow-md hover:border-[#176B65] transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3">
                  {/* Top Bar: Token & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-[#176B65] bg-[#DCE9E3] px-2.5 py-1 rounded-xl">
                      {item.tokenNumber || `TK-${item.tokenSequence || (idx + 1)}`}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Service Completed</span>
                    </span>
                  </div>

                  {/* Shop Name & Category */}
                  <div>
                    <h3 className="text-lg font-black text-[#283B3D] group-hover:text-[#176B65] transition-colors">
                      {item.shopName || 'Registered Outlet'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <Store className="w-3 h-3 text-slate-400" />
                      <span>{item.categoryName || 'General Service'}</span>
                    </p>
                  </div>

                  {/* Visit Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-[#DCE9E3]/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#176B65] group-hover:underline flex items-center gap-1">
                    <span>View Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/book/${shopSlug}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <RotateCw className="w-3 h-3 text-[#F2A15A]" />
                    <span>Book Again</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Popup Modal */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#DCE9E3] relative"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#176B65] bg-[#DCE9E3] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Visit Details
                </span>
                <h2 className="text-2xl font-black text-[#283B3D]">
                  {selectedVisit.shopName || 'Registered Outlet'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedVisit.categoryName || 'General Service'}
                </p>
              </div>

              {/* Info Grid */}
              <div className="p-4 bg-[#F3F1E9]/60 rounded-2xl border border-[#DCE9E3] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Token Number:</span>
                  <span className="font-mono font-black text-[#176B65]">
                    {selectedVisit.tokenNumber || `TK-${selectedVisit.tokenSequence || 1}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Service Completed
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date & Time:</span>
                  <span className="font-semibold text-[#283B3D]">
                    {selectedVisit.completedAt || selectedVisit.servedAt || selectedVisit.createdAt
                      ? new Date(selectedVisit.completedAt || selectedVisit.servedAt || selectedVisit.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'Recent Visit'}
                  </span>
                </div>

                {selectedVisit.address && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-[#DCE9E3]">
                    <span className="text-slate-500 font-medium shrink-0">Location:</span>
                    <span className="font-semibold text-[#283B3D] text-right">
                      {selectedVisit.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Action: Book Again */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const slug = selectedVisit.shopSlug || (selectedVisit.shopName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    router.push(`/book/${slug}`);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <RotateCw className="w-4 h-4 text-[#F2A15A]" />
                  <span>Book Again at {selectedVisit.shopName || 'This Shop'}</span>
                  <ArrowRight className="w-4 h-4 text-[#F2A15A]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
