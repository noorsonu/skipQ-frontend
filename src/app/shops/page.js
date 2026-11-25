"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, MapPin, Ticket, Star, ArrowRight, ArrowLeft,
  Store, ShieldCheck, Heart, Clock, Scissors, Activity, Utensils, Wrench, Pill, Stethoscope,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfficialBrandLogo from '@/components/OfficialBrandLogo';
import { shopApi } from '@/lib/api';
import { getFavoriteShopSlugs, toggleFavoriteShopSlug } from '@/lib/favorites';
import { enforceCleanSlate } from '@/lib/storageSync';

// Standard 6 business categories
const CATEGORIES = [
  { id: 'salon', name: 'Salons & Parlours', icon: Scissors, keywords: ['salon', 'barber', 'parlour', 'hair', 'beauty', 'spa'] },
  { id: 'clinic', name: 'Doctor Clinics', icon: Stethoscope, keywords: ['doctor', 'clinic', 'consultation', 'dental', 'health'] },
  { id: 'medical', name: 'Medical & Pharmacy', icon: Pill, keywords: ['medical', 'pharmacy', 'chemist', 'drug', 'medicine'] },
  { id: 'auto-repair', name: 'Auto Repair & Garage', icon: Wrench, keywords: ['auto', 'repair', 'garage', 'mechanic', 'bike', 'car', 'puncture'] },
  { id: 'food', name: 'Food & Chaat Points', icon: Utensils, keywords: ['food', 'chaat', 'sweets', 'restaurant', 'cafe', 'tea', 'bites'] },
  { id: 'retail', name: 'General Retail & Stores', icon: Store, keywords: ['store', 'retail', 'grocery', 'market', 'shop', 'kirana'] }
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
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSlugs, setFavoriteSlugs] = useState([]);
  const [openCategories, setOpenCategories] = useState({});

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

  const toggleCategoryDropdown = (catId) => {
    setOpenCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
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

    if (selectedCat === 'favorites' && !favoriteSlugs.includes(shop.slug)) return;

    const catId = getShopCategoryId(shop);
    if (!shopsByCategory[catId]) shopsByCategory[catId] = [];
    shopsByCategory[catId].push(shop);
  });

  // Filter categories to display
  const categoriesToDisplay = CATEGORIES.filter(cat => {
    if (selectedCat === 'all') return true;
    if (selectedCat === 'favorites') return (shopsByCategory[cat.id] || []).length > 0;
    return cat.id === selectedCat;
  });

  const totalMatchingShops = Object.values(shopsByCategory).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#176B65] hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-[#283B3D]">Explore Places & Queues</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Browse verified local business categories in Lucknow. Click any category to view its live shops.
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

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCat('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
            selectedCat === 'all' 
              ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
              : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>All Places</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCat('favorites')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
            selectedCat === 'favorites' 
              ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
              : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>My Favorites ({favoriteSlugs.length})</span>
        </button>

        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCat === cat.id;
          const shopCount = (shopsByCategory[cat.id] || []).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCat(cat.id);
                setOpenCategories(prev => ({ ...prev, [cat.id]: true }));
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                isActive 
                  ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
                  : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              {shopCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-[#DCE9E3] text-[#176B65]'}`}>
                  {shopCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Categories Accordion / Dropdown Directory */}
      {totalMatchingShops === 0 && query ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#DCE9E3] space-y-4 max-w-md mx-auto shadow-sm my-6">
          <div className="w-14 h-14 rounded-2xl bg-[#DCE9E3]/70 text-[#176B65] flex items-center justify-center mx-auto border border-[#176B65]/20">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#283B3D]">No Shops Found</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No places matched &quot;{query}&quot;. Try a different name or browse categories below.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="px-5 py-2.5 rounded-xl bg-[#176B65] text-white font-bold text-xs"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriesToDisplay.map(cat => {
            const Icon = cat.icon;
            const categoryShops = shopsByCategory[cat.id] || [];
            const hasShops = categoryShops.length > 0;
            // Open if explicitly toggled OR if filtered directly to this category OR if searching and has matches
            const isOpen = openCategories[cat.id] !== undefined
              ? openCategories[cat.id]
              : (selectedCat === cat.id || (query && hasShops));

            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-[#DCE9E3] shadow-xs overflow-hidden transition-all"
              >
                {/* Category Header Bar (CLEAN, NO IMAGE) */}
                <button
                  type="button"
                  onClick={() => toggleCategoryDropdown(cat.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F3F1E9]/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#DCE9E3]/80 text-[#176B65] flex items-center justify-center shrink-0 border border-[#176B65]/20 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#283B3D] truncate flex items-center gap-2">
                        <span>{cat.name}</span>
                        {hasShops && (
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {hasShops
                          ? `${categoryShops.length} ${categoryShops.length === 1 ? 'place' : 'places'} registered • Tap to view details`
                          : 'No shops currently registered in this category'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {hasShops ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        {categoryShops.length} Available
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                        0 Places
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform duration-200 ${
                      isOpen ? 'bg-[#176B65] text-white border-[#176B65]' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Dropdown Content with Shop Details */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#DCE9E3] bg-[#F8FAF9]/50 p-4 sm:p-6"
                    >
                      {categoryShops.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 space-y-1">
                          <p className="text-xs font-semibold">No registered shops in {cat.name} right now.</p>
                          <p className="text-[11px] text-slate-400">Are you a business owner? Register your store on SkipQ to receive customer tokens.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryShops.map(shop => {
                            const isFav = favoriteSlugs.includes(shop.slug);
                            return (
                              <div
                                key={shop.id || shop.slug}
                                className="bg-white rounded-3xl overflow-hidden border border-[#DCE9E3] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                              >
                                <div>
                                  {/* Shop Image Cover */}
                                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                                    <img
                                      src={shop.photo || shop.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'}
                                      alt={shop.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    
                                    {/* Category Badge */}
                                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs text-[#176B65] font-black text-[10px] uppercase shadow-xs">
                                      {shop.categoryName || cat.name}
                                    </span>

                                    {/* Favorite Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleFav(shop.slug, e)}
                                      className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-xs text-slate-700 hover:text-rose-600 transition-colors cursor-pointer shadow-xs"
                                    >
                                      <Heart className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : ''}`} />
                                    </button>

                                    {/* Shop Name on Cover */}
                                    <div className="absolute bottom-3 left-4 right-4 text-white">
                                      <h3 className="text-xl font-black drop-shadow-md truncate">{shop.name}</h3>
                                      <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5">
                                        <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                                        <span className="truncate">{shop.address || 'Lucknow'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Body Info */}
                                  <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                        <span>{shop.rating ? Number(shop.rating).toFixed(1) : 'New'}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">({shop.reviewCount || 0})</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>Verified Store</span>
                                      </div>
                                    </div>

                                    {/* Queue Status Box */}
                                    <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] flex items-center justify-between text-xs">
                                      <div className="space-y-0.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Wait</span>
                                        <div className="flex items-center gap-1 font-black text-[#176B65] text-sm">
                                          <Clock className="w-3.5 h-3.5" />
                                          <span>~{shop.avgWaitMin !== undefined ? shop.avgWaitMin : (shop.estimatedMinutesPerTurn || 0)} Mins</span>
                                        </div>
                                      </div>

                                      <div className="text-right space-y-0.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">In Line Now</span>
                                        <span className="font-token font-bold text-sm text-[#283B3D]">
                                          {shop.activeQueueCount !== undefined ? shop.activeQueueCount : (shop.queueLength || 0)} People
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-5 pt-0">
                                  <Link
                                    href={`/book/${shop.slug}`}
                                    className="w-full py-3 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                                  >
                                    <Ticket className="w-4 h-4 text-amber-300" />
                                    <span>Get Token & View Queue</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
