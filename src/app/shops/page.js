"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, MapPin, Ticket, Star, ArrowRight,
  Store, ShieldCheck, Heart, Clock, Scissors, Activity, Utensils, Wrench, Pill, Stethoscope,
  ChevronRight, Sparkles, Building2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi } from '@/lib/api';
import { getFavoriteShopSlugs, toggleFavoriteShopSlug } from '@/lib/favorites';
import { enforceCleanSlate } from '@/lib/storageSync';

// Standard business categories with full aliases so home page & query params match perfectly
const CATEGORIES = [
  { 
    id: 'salon', 
    name: 'Salon & Barber', 
    icon: Scissors, 
    desc: 'Haircut, styling, grooming & spa', 
    aliases: ['salon', 'barber', 'parlour', 'parlours'],
    keywords: ['salon', 'barber', 'parlour', 'hair', 'beauty', 'spa'] 
  },
  { 
    id: 'pharmacy', 
    name: 'Medical & Pharmacy', 
    icon: Pill, 
    desc: 'Medicines, chemist & health supplies', 
    aliases: ['pharmacy', 'medical', 'chemist', 'medicine', 'health'],
    keywords: ['medical', 'pharmacy', 'chemist', 'drug', 'medicine'] 
  },
  { 
    id: 'clinic', 
    name: 'Doctor & Clinic', 
    icon: Stethoscope, 
    desc: 'Consultations, dental & checkups', 
    aliases: ['clinic', 'doctor', 'dental', 'hospital'],
    keywords: ['doctor', 'clinic', 'consultation', 'dental', 'health'] 
  },
  { 
    id: 'food', 
    name: 'Food & Chaat Points', 
    icon: Utensils, 
    desc: 'Snacks, chaat, cafe & takeaways', 
    aliases: ['food', 'chaat', 'restaurant', 'cafe', 'sweets'],
    keywords: ['food', 'chaat', 'sweets', 'restaurant', 'cafe', 'tea', 'bites'] 
  },
  { 
    id: 'diagnostic', 
    name: 'Diagnostic & Lab', 
    icon: Activity, 
    desc: 'Blood tests, pathology & scans', 
    aliases: ['diagnostic', 'lab', 'pathology', 'scans'],
    keywords: ['diagnostic', 'lab', 'blood', 'pathology', 'scan', 'test'] 
  },
  { 
    id: 'auto', 
    name: 'Auto & Repair Service', 
    icon: Wrench, 
    desc: 'Bike & car service, puncture repair', 
    aliases: ['auto', 'auto-repair', 'repair', 'garage', 'bike', 'car'],
    keywords: ['auto', 'repair', 'garage', 'mechanic', 'bike', 'car', 'puncture'] 
  },
  { 
    id: 'retail', 
    name: 'General Retail & Stores', 
    icon: Store, 
    desc: 'Kirana, apparel & essentials', 
    aliases: ['retail', 'store', 'shop', 'kirana'],
    keywords: ['store', 'retail', 'grocery', 'market', 'shop', 'kirana'] 
  }
];

function findCategory(catParam) {
  if (!catParam) return null;
  const p = catParam.toLowerCase().trim();
  return CATEGORIES.find(c => c.id === p || (c.aliases && c.aliases.includes(p))) || null;
}

function getShopCategoryId(shop) {
  const catName = (shop?.categoryName || '').toLowerCase();
  const catSlug = (shop?.category || shop?.slug || '').toLowerCase();
  const name = (shop?.name || '').toLowerCase();

  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => catName.includes(kw) || catSlug.includes(kw) || name.includes(kw))) {
      return cat.id;
    }
  }
  return 'retail';
}

function ShopsDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('cat') || null;

  const [search, setSearch] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSlugs, setFavoriteSlugs] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    enforceCleanSlate();
    setFavoriteSlugs(getFavoriteShopSlugs());
    const onFavUpdate = () => setFavoriteSlugs(getFavoriteShopSlugs());
    window.addEventListener('ak_favorites_updated', onFavUpdate);

    try {
      const raw = localStorage.getItem('ak_my_tokens');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setHistoryCount(arr.filter(t => ['COMPLETED', 'SERVED', 'CANCELLED', 'EXPIRED'].includes(t.status)).length);
        }
      }
    } catch (e) {}

    return () => window.removeEventListener('ak_favorites_updated', onFavUpdate);
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      let loadedShops = [];

      try {
        const res = await shopApi.getShops({ lat: 26.8861, lng: 80.9951 });
        if (res?.data?.data && Array.isArray(res.data.data)) {
          const DUMMY_SLUGS = [
            'royal-barber-indira-nagar', 'gupta-medical-indira-nagar', 'suresh-sweets-590',
            'city-style-salon', 'dr-verma-clinic', 'speedy-auto-bike-care',
            'apollo-pharmacy-lucknow', 'royal-hair-studio', 'shukla-chaat-bhandar'
          ];
          loadedShops = res.data.data.filter(s => {
            const slug = (s.slug || '').toLowerCase();
            const name = (s.name || '').toLowerCase();
            return (
              !DUMMY_SLUGS.includes(slug) &&
              !slug.includes('royal-barber') &&
              !slug.includes('gupta-medical') &&
              !name.includes('royal barber') &&
              !name.includes('gupta medical')
            );
          });

          // Sort shops with highest ratings on top as requested
          loadedShops.sort((a, b) => {
            const rA = Number(a.rating || a.averageRating) || 0;
            const rB = Number(b.rating || b.averageRating) || 0;
            return rB - rA;
          });
        }
      } catch (err) {
        console.warn('API shops fetch error:', err);
      }

      setShops(loadedShops);
      setLoading(false);
    };

    fetchShops();
  }, []);

  // Scroll restoration if returning from shop detail to category
  useEffect(() => {
    if (typeof window !== 'undefined' && activeCategory) {
      const lastShop = sessionStorage.getItem('ak_shops_last_shop');
      if (lastShop) {
        setTimeout(() => {
          const el = document.getElementById(`shop-card-${lastShop}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [activeCategory, shops]);

  const handleToggleFav = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteShopSlug(slug);
    setFavoriteSlugs(getFavoriteShopSlugs());
  };

  const handleSelectCategory = (catId) => {
    // Pushes category state into browser history so phone back button returns 1 step back to All Categories
    router.push(`/shops?cat=${catId}`, { scroll: false });
  };

  // Group shops by category
  const shopsByCategory = {};
  CATEGORIES.forEach(c => {
    shopsByCategory[c.id] = [];
  });

  const query = search.toLowerCase().trim();

  shops.forEach(shop => {
    const sName = (shop.name || '').toLowerCase();
    const sCat = (shop.category || '').toLowerCase();
    const sAddr = (shop.address || '').toLowerCase();
    const matchesSearch = !query || sName.includes(query) || sCat.includes(query) || sAddr.includes(query);

    if (!matchesSearch) return;
    if (showFavoritesOnly && !favoriteSlugs.includes(shop.slug)) return;

    const catId = getShopCategoryId(shop);
    if (!shopsByCategory[catId]) shopsByCategory[catId] = [];
    shopsByCategory[catId].push(shop);
  });

  // Current category details if activeCategory is selected
  const currentCatObj = findCategory(activeCategory);
  const currentCategoryShops = currentCatObj ? (shopsByCategory[currentCatObj.id] || []) : [];

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* SCENARIO A: DEDICATED CATEGORY VIEW (NO OTHER CATEGORIES BELOW) */}
      {/* ============================================================== */}
      {currentCatObj ? (
        <div className="space-y-6">
          {/* Dedicated Category Header - Clean, No On-screen Back Button */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE9E3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#DCE9E3]/80 text-[#176B65] flex items-center justify-center shrink-0 border border-[#176B65]/20 shadow-2xs">
                {React.createElement(currentCatObj.icon, { className: "w-7 h-7" })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#283B3D]">{currentCatObj.name}</h1>
                  {currentCategoryShops.length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {currentCategoryShops.length} {currentCategoryShops.length === 1 ? 'place' : 'places'} available in this category
                </p>
              </div>
            </div>

            {/* Quick Search in this Category */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${currentCatObj.name}...`}
                className="w-full bg-[#F8FAF9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#176B65] shadow-2xs"
              />
            </div>
          </div>

          {/* Shops List (NO IMAGES AS REQUESTED - CLEAN LIGHTWEIGHT CARDS) */}
          {currentCategoryShops.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-[#DCE9E3] space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-[#DCE9E3]/60 text-[#176B65] flex items-center justify-center mx-auto border border-[#176B65]/20">
                {React.createElement(currentCatObj.icon, { className: "w-8 h-8" })}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#283B3D]">No Shops Registered Yet</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Currently there are no registered shops in {currentCatObj.name}. New shops will appear here once registered by shopkeepers.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentCategoryShops.map(shop => {
                const isFav = favoriteSlugs.includes(shop.slug);
                return (
                  <Link
                    key={shop.id || shop.slug}
                    id={`shop-card-${shop.slug}`}
                    href={`/book/${shop.slug}`}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('ak_shops_last_shop', shop.slug);
                      }
                    }}
                    className="bg-white rounded-3xl p-6 border border-[#DCE9E3] shadow-xs hover:shadow-lg hover:border-[#176B65]/40 transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Category tag & Favorite Button */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-[#DCE9E3]/70 text-[#176B65] font-black text-[10px] uppercase tracking-wider">
                          {currentCatObj.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFav(shop.slug, e)}
                          className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Save to favorites"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
                        </button>
                      </div>

                      {/* Shop Name & Location (NO IMAGE) */}
                      <div>
                        <h3 className="text-xl font-black text-[#283B3D] group-hover:text-[#176B65] transition-colors truncate">
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{shop.address || 'Verified Location'}</span>
                        </div>
                      </div>

                      {/* Verification & Rating Badges */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>{shop.rating ? Number(shop.rating).toFixed(1) : 'New'}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({shop.reviewCount || 0})</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Store</span>
                        </div>
                      </div>

                      {/* Live Queue Radar Box */}
                      <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#DCE9E3] flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Wait</span>
                          <div className="flex items-center gap-1 font-black text-[#176B65] text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>~{shop.avgWaitMin !== undefined ? shop.avgWaitMin : (shop.estimatedMinutesPerTurn || 0)} Mins</span>
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">In Line Now</span>
                          <span className="font-token font-black text-sm text-[#283B3D]">
                            {shop.activeQueueCount !== undefined ? shop.activeQueueCount : (shop.queueLength || 0)} People
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-3 border-t border-[#DCE9E3]/70">
                      <div className="w-full py-2.5 rounded-xl bg-[#176B65] group-hover:bg-[#125550] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all">
                        <Ticket className="w-4 h-4 text-amber-300" />
                        <span>View Shop & Get Token</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* SCENARIO B: CATEGORIES LIST VIEW (NO SHOPS, PURE CATEGORIES)   */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Header - Clean, No On-screen Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#283B3D]">Explore Places & Queues</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Browse verified local business categories. Select a category to see its available shops.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops or services..."
                className="w-full bg-white border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65] shadow-xs"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                !showFavoritesOnly 
                  ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
                  : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>All Categories</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFavoritesOnly(true)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                showFavoritesOnly 
                  ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
                  : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>My Favorites ({favoriteSlugs.length})</span>
            </button>

            <Link
              href="/tokens?tab=history"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D] shadow-2xs hover:border-[#176B65]"
            >
              <History className="w-3.5 h-3.5 text-[#176B65]" />
              <span>Service History</span>
              {historyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black bg-[#DCE9E3] text-[#176B65]">
                  {historyCount}
                </span>
              )}
            </Link>
          </div>

          {/* Clean Single-Line Category Cards (Small Logo, Name & 0 Places in One Line) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = (shopsByCategory[cat.id] || []).length;
              const hasShops = count > 0;

              return (
                <button
                  key={cat.id}
                  id={`shops-cat-card-${cat.id}`}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE9E3] shadow-xs hover:shadow-md hover:border-[#176B65] transition-all text-left flex items-center justify-between group cursor-pointer active:scale-98"
                >
                  {/* Left: Small Logo & Name in One Single Line */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#DCE9E3]/80 group-hover:bg-[#176B65] text-[#176B65] group-hover:text-white flex items-center justify-center shrink-0 border border-[#176B65]/20 transition-colors shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-base sm:text-lg font-black text-[#283B3D] group-hover:text-[#176B65] transition-colors truncate">
                      {cat.name}
                    </span>
                  </div>

                  {/* Right: 0 Places Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {hasShops ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {count} {count === 1 ? 'Place' : 'Places'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                        0 Places
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176B65] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm font-semibold text-[#176B65]">Loading directory...</div>}>
      <ShopsDirectoryContent />
    </Suspense>
  );
}
