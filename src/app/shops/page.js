"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, MapPin, Ticket, Star, ArrowRight, ArrowLeft,
  Store, ShieldCheck, Heart, Clock, Scissors, Activity, Utensils, Wrench, Pill, Stethoscope,
  ChevronRight, Sparkles, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopApi } from '@/lib/api';
import { getFavoriteShopSlugs, toggleFavoriteShopSlug } from '@/lib/favorites';
import { enforceCleanSlate } from '@/lib/storageSync';

// Standard 6 business categories
const CATEGORIES = [
  { id: 'salon', name: 'Salons & Parlours', icon: Scissors, desc: 'Haircut, styling, grooming & spa', keywords: ['salon', 'barber', 'parlour', 'hair', 'beauty', 'spa'] },
  { id: 'clinic', name: 'Doctor Clinics', icon: Stethoscope, desc: 'Consultations, dental & checkups', keywords: ['doctor', 'clinic', 'consultation', 'dental', 'health'] },
  { id: 'medical', name: 'Medical & Pharmacy', icon: Pill, desc: 'Medicines, chemist & health supplies', keywords: ['medical', 'pharmacy', 'chemist', 'drug', 'medicine'] },
  { id: 'auto-repair', name: 'Auto Repair & Garage', icon: Wrench, desc: 'Bike & car service, puncture repair', keywords: ['auto', 'repair', 'garage', 'mechanic', 'bike', 'car', 'puncture'] },
  { id: 'food', name: 'Food & Chaat Points', icon: Utensils, desc: 'Snacks, chaat, cafe & takeaways', keywords: ['food', 'chaat', 'sweets', 'restaurant', 'cafe', 'tea', 'bites'] },
  { id: 'retail', name: 'General Retail & Stores', icon: Store, desc: 'Kirana, apparel & essentials', keywords: ['store', 'retail', 'grocery', 'market', 'shop', 'kirana'] }
];

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
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(null); // null = Categories Overview, string = Dedicated Category View
  const [search, setSearch] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSlugs, setFavoriteSlugs] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    enforceCleanSlate();
    setFavoriteSlugs(getFavoriteShopSlugs());
    const onFavUpdate = () => setFavoriteSlugs(getFavoriteShopSlugs());
    window.addEventListener('ak_favorites_updated', onFavUpdate);
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
        }
      } catch (err) {
        console.warn('API shops fetch error:', err);
      }

      setShops(loadedShops);
      setLoading(false);
    };

    fetchShops();
  }, []);

  const handleToggleFav = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteShopSlug(slug);
    setFavoriteSlugs(getFavoriteShopSlugs());
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
  const currentCatObj = CATEGORIES.find(c => c.id === activeCategory);
  const currentCategoryShops = activeCategory ? (shopsByCategory[activeCategory] || []) : [];

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* SCENARIO A: DEDICATED CATEGORY VIEW (NO OTHER CATEGORIES BELOW) */}
      {/* ============================================================== */}
      {activeCategory && currentCatObj ? (
        <div className="space-y-6">
          {/* Back Button */}
          <div>
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#176B65] hover:text-[#125550] bg-white border border-[#DCE9E3] hover:border-[#176B65]/40 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Categories</span>
            </button>
          </div>

          {/* Dedicated Category Header */}
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
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="px-5 py-2.5 rounded-xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Explore Other Categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentCategoryShops.map(shop => {
                const isFav = favoriteSlugs.includes(shop.slug);
                return (
                  <Link
                    key={shop.id || shop.slug}
                    href={`/book/${shop.slug}`}
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
                          <span className="truncate">{shop.address || 'Lucknow, Uttar Pradesh'}</span>
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B65] hover:underline mb-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </Link>
              <h1 className="text-3xl sm:text-4xl font-black text-[#283B3D]">Explore Places & Queues</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Browse verified local business categories in Lucknow. Select a category to see its available shops.
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

          {/* Favorites Pill Filter */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(false)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                showFavoritesOnly 
                  ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
                  : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>My Favorites ({favoriteSlugs.length})</span>
            </button>
          </div>

          {/* Clean Category Cards Grid (NO IMAGES) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = (shopsByCategory[cat.id] || []).length;
              const hasShops = count > 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className="bg-white rounded-3xl p-6 border border-[#DCE9E3] shadow-xs hover:shadow-xl hover:border-[#176B65] transition-all text-left flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon & Availability Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-[#DCE9E3]/80 group-hover:bg-[#176B65] text-[#176B65] group-hover:text-white flex items-center justify-center shrink-0 border border-[#176B65]/20 transition-colors shadow-2xs">
                        <Icon className="w-6 h-6" />
                      </div>

                      {hasShops ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          {count} Available
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          0 Places
                        </span>
                      )}
                    </div>

                    {/* Category Title & Desc */}
                    <div>
                      <h2 className="text-xl font-black text-[#283B3D] group-hover:text-[#176B65] transition-colors flex items-center gap-2">
                        <span>{cat.name}</span>
                        {hasShops && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        )}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {cat.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Link indicator */}
                  <div className="mt-6 pt-4 border-t border-[#DCE9E3]/60 flex items-center justify-between text-xs font-bold text-[#176B65]">
                    <span>{hasShops ? `View ${count} ${count === 1 ? 'Shop' : 'Shops'}` : 'Browse Category'}</span>
                    <div className="w-7 h-7 rounded-xl bg-[#F8FAF9] group-hover:bg-[#176B65] group-hover:text-white flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
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
