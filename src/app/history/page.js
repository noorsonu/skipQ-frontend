"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  History, Store, Calendar, Clock, Ticket, ArrowRight, RotateCw, 
  MapPin, CheckCircle2, ChevronRight, X, Sparkles, Star, AlertTriangle,
  Receipt, CreditCard, Banknote, ShieldAlert, Search, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { queueApi } from '@/lib/api';
import { enforceCleanSlate } from '@/lib/storageSync';
import { getFavoriteShopSlugs } from '@/lib/favorites';

function getPaymentInfo(item) {
  const total = Number(item.amount || item.billAmount || item.totalAmount || 0);
  const mode = String(item.paymentMode || item.billPaymentMode || '').toUpperCase();
  
  // Check if shop khata ledger has pending due for this customer
  let khataDue = 0;
  if (typeof window !== 'undefined') {
    const slug = (item.shopSlug || (item.shopName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')).toLowerCase();
    const phone = (item.customerPhone || '').replace(/\D/g, '').slice(-10);
    if (slug && phone) {
      try {
        const saved = localStorage.getItem(`ak_shop_khata_${slug}`);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const match = list.find(c => c.customerPhone && c.customerPhone.replace(/\D/g, '').slice(-10) === phone);
            if (match && match.totalPending > 0) {
              khataDue = match.totalPending;
            }
          }
        }
      } catch (e) {}
    }
  }

  let paid = total;
  let due = 0;

  if (mode === 'PENDING') {
    paid = 0;
    due = total;
  } else if (mode === 'PARTIAL') {
    paid = item.paidAmount !== undefined ? Number(item.paidAmount) : (total > 0 ? Math.round(total / 2) : 0);
    due = Math.max(0, total - paid);
  } else if (khataDue > 0 && due === 0) {
    due = khataDue;
    if (total > 0) {
      paid = Math.max(0, total - due);
    }
  } else if (item.dueAmount !== undefined) {
    due = Number(item.dueAmount);
    paid = Math.max(0, total - due);
  } else if (item.paidAmount !== undefined) {
    paid = Number(item.paidAmount);
    due = Math.max(0, total - paid);
  }

  let statusLabel = 'Fully Paid';
  let statusBadge = 'FULL_PAID'; // 'FULL_PAID' | 'PARTIAL' | 'UDHAAR' | 'FREE'

  if (due > 0 && paid > 0) {
    statusLabel = 'Partially Paid (Udhaar)';
    statusBadge = 'PARTIAL';
  } else if (due > 0 && paid === 0) {
    statusLabel = 'Full Udhaar (Unpaid)';
    statusBadge = 'UDHAAR';
  } else if (total === 0) {
    statusLabel = 'Free / Included';
    statusBadge = 'FREE';
  }

  return { total, paid, due, mode, statusLabel, statusBadge };
}

export default function ServiceHistoryPage() {
  const router = useRouter();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [search, setSearch] = useState('');
  const [favoriteSlugs, setFavoriteSlugs] = useState([]);

  // Handle closing detail modal on mobile back button
  useEffect(() => {
    if (!selectedVisit) return;

    window.history.pushState({ modal_open: true }, '');

    const handleModalPop = () => {
      setSelectedVisit(null);
    };

    window.addEventListener('popstate', handleModalPop, { once: true });
    return () => {
      window.removeEventListener('popstate', handleModalPop);
    };
  }, [selectedVisit]);

  useEffect(() => {
    enforceCleanSlate();
    setFavoriteSlugs(getFavoriteShopSlugs());
    const onFavUpdate = () => setFavoriteSlugs(getFavoriteShopSlugs());
    window.addEventListener('ak_favorites_updated', onFavUpdate);

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

      // 2. Also check LocalStorage history: ak_customer_history and ak_my_tokens
      if (typeof window !== 'undefined') {
        try {
          const rawCust = localStorage.getItem('ak_customer_history');
          if (rawCust) {
            const parsed = JSON.parse(rawCust);
            if (Array.isArray(parsed)) {
              parsed.forEach(pt => {
                if (!items.some(it => String(it.id) === String(pt.id) || (it.tokenNumber && it.tokenNumber === pt.tokenNumber && it.shopName === pt.shopName))) {
                  items.push(pt);
                }
              });
            }
          }
        } catch (e) {}

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
    return () => window.removeEventListener('ak_favorites_updated', onFavUpdate);
  }, []);

  const filteredHistory = historyList.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const sName = (item.shopName || '').toLowerCase();
    const tokenNo = (item.tokenNumber || '').toLowerCase();
    const services = Array.isArray(item.servicesOpted) 
      ? item.servicesOpted.join(' ').toLowerCase() 
      : String(item.servicesOpted || '').toLowerCase();
    return sName.includes(q) || tokenNo.includes(q) || services.includes(q);
  });

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header - Clean, Identical to Favorites */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#283B3D]">
            My Service History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Review your past shop visits, payments, udhaar ledger, and re-book with 1 click.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in history..."
            className="w-full bg-white border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65] shadow-xs"
          />
        </div>
      </div>

      {/* Filter Pills: Exactly 3 Compact Buttons in 1 Line (No Scroll) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full py-1">
        <Link
          href="/shops"
          className="w-full py-2.5 px-1 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D] flex items-center justify-center gap-1 sm:gap-1.5 text-center truncate"
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">All Categories</span>
        </Link>

        <Link
          href="/shops?category=favorites"
          className="w-full py-2.5 px-1 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D] flex items-center justify-center gap-1 sm:gap-1.5 text-center truncate"
        >
          <Heart className="w-3.5 h-3.5 shrink-0 text-rose-500 fill-rose-500" />
          <span className="truncate">Favorites ({favoriteSlugs.length})</span>
        </Link>

        <button
          type="button"
          className="w-full py-2.5 px-1 sm:px-3 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer border bg-[#176B65] text-white border-[#176B65] shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 text-center truncate"
        >
          <History className="w-3.5 h-3.5 shrink-0 text-white" />
          <span className="truncate">History</span>
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-[#176B65] animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading your service history...</p>
        </div>
      ) : historyList.length === 0 ? (
        /* Empty State: Matching Favorite View Card Exactly */
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#DCE9E3] space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#DCE9E3]/60 text-[#176B65] flex items-center justify-center mx-auto border border-[#176B65]/20 shadow-2xs">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-[#283B3D]">No Service History Yet</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              Aapne abhi tak koi service visit complete nahi ki hai. Jab aap kisi shop ya clinic par token complete karwayenge to unki history yahan dikhegi.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/shops"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <Store className="w-4 h-4 text-[#F2A15A]" />
              <span>Browse All Categories →</span>
            </Link>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#DCE9E3] space-y-3 max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-[#283B3D]">No Matching Visits</h3>
          <p className="text-xs text-slate-500 font-medium">No past visits found matching &ldquo;{search}&rdquo;</p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setSearch('')}
              className="px-4 py-2 rounded-xl bg-[#DCE9E3] hover:bg-[#176B65] hover:text-white text-[#176B65] font-bold text-xs transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        </div>
      ) : (
        /* History Items List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredHistory.map((item, idx) => {
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
            const payment = getPaymentInfo(item);

            return (
              <div
                key={item.id || idx}
                onClick={() => setSelectedVisit(item)}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE9E3] shadow-xs hover:shadow-md hover:border-[#176B65] transition-all flex flex-col justify-between group cursor-pointer space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Token & Service Completed */}
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
                      <span>{item.serviceDetails || item.service || item.categoryName || 'General Service'}</span>
                    </p>
                  </div>

                  {/* Visit Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>

                  {/* Payment & Udhaar Status Box */}
                  <div className="p-3.5 rounded-2xl bg-[#F3F1E9]/70 border border-[#DCE9E3] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Total Bill:</span>
                      <span className="font-mono font-black text-sm text-[#283B3D]">
                        ₹{payment.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Amount Paid:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        ₹{payment.paid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {payment.due > 0 ? (
                      <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-rose-200 text-rose-800">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Udhaar / Due Remaining:</span>
                        </span>
                        <span className="font-mono text-sm bg-rose-100 text-rose-900 px-2 py-0.5 rounded-lg border border-rose-200">
                          ₹{payment.due.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-emerald-200/60 text-emerald-800">
                        <span>Payment Status:</span>
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg text-[11px] font-black">
                          ✓ Fully Paid
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-[#DCE9E3]/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#176B65] group-hover:underline flex items-center gap-1">
                    <span>View Bill & Details</span>
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
                  Service & Billing Details
                </span>
                <h2 className="text-2xl font-black text-[#283B3D]">
                  {selectedVisit.shopName || 'Registered Outlet'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedVisit.serviceDetails || selectedVisit.service || selectedVisit.categoryName || 'General Service'}
                </p>
              </div>

              {/* Token & Basic Info */}
              <div className="p-4 bg-[#F3F1E9]/60 rounded-2xl border border-[#DCE9E3] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Token Number:</span>
                  <span className="font-mono font-black text-sm text-[#176B65]">
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
                  <span className="text-slate-500 font-medium">Visit Date & Time:</span>
                  <span className="font-semibold text-[#283B3D]">
                    {selectedVisit.completedAt || selectedVisit.servedAt || selectedVisit.createdAt
                      ? new Date(selectedVisit.completedAt || selectedVisit.servedAt || selectedVisit.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'Recent Visit'}
                  </span>
                </div>

                {selectedVisit.assignedStation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Counter Served At:</span>
                    <span className="font-semibold text-[#283B3D]">
                      {selectedVisit.assignedStation}
                    </span>
                  </div>
                )}
              </div>

              {/* Detailed Payment Breakdown Box */}
              {(() => {
                const pay = getPaymentInfo(selectedVisit);
                return (
                  <div className="p-4 rounded-2xl border border-[#DCE9E3] bg-[#F8FAF9] space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#176B65] border-b border-[#DCE9E3] pb-2">
                      <Receipt className="w-4 h-4" />
                      <span>Payment & Udhaar Ledger Summary</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Total Bill Amount:</span>
                      <span className="font-mono font-black text-base text-[#283B3D]">
                        ₹{pay.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Amount Paid:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        ₹{pay.paid.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {pay.due > 0 ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                        <div className="flex items-center justify-between text-rose-900 font-black">
                          <span>Pending Udhaar (Due Amount):</span>
                          <span className="font-mono text-base">₹{pay.due.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium">
                          ⚠️ This pending balance is recorded under your registered mobile in the shop's Khata ledger. You can settle it at the shop counter on your next visit.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
                        <span>Payment Status:</span>
                        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                          ✓ Fully Paid (₹0 Due)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

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
