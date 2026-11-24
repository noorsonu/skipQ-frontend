"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, MapPin, Ticket, Star, ArrowRight, ArrowLeft,
  Store, ShieldCheck, Heart, Clock, Scissors, Activity, Utensils, Wrench, Pill, Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import OfficialBrandLogo from '@/components/OfficialBrandLogo';
import { shopApi } from '@/lib/api';
import { getFavoriteShopSlugs, toggleFavoriteShopSlug } from '@/lib/favorites';

// Standard 6 categories
const CATEGORIES = [
  { id: 'all', name: 'All Places', icon: Store, count: 6 },
  { id: 'favorites', name: 'My Favorites', icon: Heart, count: 0 },
  { id: 'salon', name: 'Salons & Parlours', icon: Scissors, count: 2 },
  { id: 'clinic', name: 'Doctor Clinics', icon: Stethoscope, count: 1 },
  { id: 'auto-repair', name: 'Auto Repair & Garage', icon: Wrench, count: 1 },
  { id: 'medical', name: 'Medical & Pharmacy', icon: Pill, count: 1 },
  { id: 'food', name: 'Food & Chaat Points', icon: Utensils, count: 1 }
];

function ShopsDirectoryContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category') || 'all';

  const [selectedCat, setSelectedCat] = useState(catParam);
  const [search, setSearch] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteSlugs, setFavoriteSlugs] = useState([]);

  useEffect(() => {
    setSelectedCat(catParam);
  }, [catParam]);

  useEffect(() => {
    setFavoriteSlugs(getFavoriteShopSlugs());
    const onFavUpdate = () => setFavoriteSlugs(getFavoriteShopSlugs());
    window.addEventListener('ak_favorites_updated', onFavUpdate);
    return () => window.removeEventListener('ak_favorites_updated', onFavUpdate);
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = await shopApi.getAll();
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setShops(res.data.data);
          return;
        }
      } catch (err) {
        console.warn('API shops fetch fallback to local:', err);
      }

      // Local fallback
      try {
        const local = JSON.parse(localStorage.getItem('ak_merchant_shops') || '[]');
        if (local.length > 0) {
          setShops(local);
          return;
        }
      } catch (e) {}

      // Default mock shops
      setShops([
        {
          id: 'shop-1',
          name: 'City Style Salon',
          slug: 'city-style-salon',
          category: 'salon',
          categoryName: 'Salons & Parlours',
          address: 'Hazratganj Main Market, Lucknow',
          phone: '+91 9876543210',
          rating: 4.8,
          reviewCount: 124,
          queueLength: 3,
          avgWaitMin: 12,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'shop-2',
          name: 'Dr. Verma Family Clinic',
          slug: 'dr-verma-clinic',
          category: 'clinic',
          categoryName: 'Doctor Clinics',
          address: 'Aliganj Sector B, Near Post Office, Lucknow',
          phone: '+91 9876543211',
          rating: 4.9,
          reviewCount: 88,
          queueLength: 5,
          avgWaitMin: 18,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'shop-3',
          name: 'Speedy Auto Bike Care',
          slug: 'speedy-auto-bike-care',
          category: 'auto-repair',
          categoryName: 'Auto Repair & Garage',
          address: 'Gomti Nagar, Near Manoj Pandey Chauraha, Lucknow',
          phone: '+91 9876543212',
          rating: 4.7,
          reviewCount: 65,
          queueLength: 2,
          avgWaitMin: 15,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'shop-4',
          name: 'Apollo Pharmacy & Diagnostic',
          slug: 'apollo-pharmacy-lucknow',
          category: 'medical',
          categoryName: 'Medical & Pharmacy',
          address: 'Indira Nagar, Ring Road, Lucknow',
          phone: '+91 9876543213',
          rating: 4.6,
          reviewCount: 92,
          queueLength: 1,
          avgWaitMin: 5,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1586015555751-63c26027a414?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'shop-5',
          name: 'Royal Hair Studio',
          slug: 'royal-hair-studio',
          category: 'salon',
          categoryName: 'Salons & Parlours',
          address: 'Mahanagar Gol Chauraha, Lucknow',
          phone: '+91 9876543214',
          rating: 4.8,
          reviewCount: 76,
          queueLength: 4,
          avgWaitMin: 14,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'shop-6',
          name: 'Shukla Chaat Bhandar',
          slug: 'shukla-chaat-bhandar',
          category: 'food',
          categoryName: 'Food & Chaat Points',
          address: 'Shahnajaf Road, Hazratganj, Lucknow',
          phone: '+91 9876543215',
          rating: 4.9,
          reviewCount: 210,
          queueLength: 6,
          avgWaitMin: 8,
          isAcceptingTokens: true,
          photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
        }
      ]);
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

  // Filter logic
  const filteredShops = shops.filter(shop => {
    const sName = (shop.name || '').toLowerCase();
    const sCat = (shop.category || '').toLowerCase();
    const sAddr = (shop.address || '').toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || sName.includes(query) || sCat.includes(query) || sAddr.includes(query);

    if (!matchesSearch) return false;

    if (selectedCat === 'all') return true;
    if (selectedCat === 'favorites') return favoriteSlugs.includes(shop.slug);
    return sCat === selectedCat || (shop.categoryName || '').toLowerCase().includes(selectedCat);
  });

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
            Browse verified local businesses in Lucknow with real-time queue wait radar.
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

      {/* Category Pills Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCat === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                isActive 
                  ? 'bg-[#176B65] text-white border-[#176B65] shadow-sm' 
                  : 'bg-white hover:bg-[#DCE9E3]/40 border-[#DCE9E3] text-[#283B3D]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#DCE9E3] space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-black text-[#283B3D]">No Shops Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for another service or choose "All Places" above.
          </p>
          <button
            type="button"
            onClick={() => { setSelectedCat('all'); setSearch(''); }}
            className="px-4 py-2 rounded-xl bg-[#176B65] text-white font-bold text-xs"
          >
            Show All Places
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map(shop => {
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
                      src={shop.photo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-xs text-[#176B65] font-black text-[10px] uppercase shadow-xs">
                      {shop.categoryName || 'Service'}
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
                        <span className="truncate">{shop.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{shop.rating || '4.8'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({shop.reviewCount || 45})</span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Lucknow Pilot</span>
                      </div>
                    </div>

                    {/* Queue Status Box */}
                    <div className="p-3 bg-[#F3F1E9] rounded-2xl border border-[#DCE9E3] flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Wait</span>
                        <div className="flex items-center gap-1 font-black text-[#176B65] text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          <span>~{shop.avgWaitMin || 10} Mins</span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">In Line Now</span>
                        <span className="font-token font-bold text-sm text-[#283B3D]">
                          {shop.queueLength || 2} People
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
