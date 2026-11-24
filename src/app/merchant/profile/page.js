'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ArrowLeft,
  LogOut,
  Sparkles,
  Layers,
  Activity,
  Hash,
  Lock,
  Tag,
  Building,
  Check,
  Compass,
  AlertCircle
} from 'lucide-react';
import { shopApi, authApi } from '@/lib/api';

export default function MerchantProfilePage() {
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [allShops, setAllShops] = useState([]);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load local storage session details
    const role = localStorage.getItem('ak_role');
    const storedPhone = localStorage.getItem('ak_phone') || '';
    const storedName = localStorage.getItem('ak_customer_name') || '';
    const storedEmail = localStorage.getItem('ak_email') || '';
    
    let activeShop = null;
    try {
      const activeStr = localStorage.getItem('ak_active_merchant_shop');
      if (activeStr) activeShop = JSON.parse(activeStr);
    } catch (e) {}

    let merchantShops = [];
    try {
      const allStr = localStorage.getItem('ak_merchant_shops');
      if (allStr) merchantShops = JSON.parse(allStr);
    } catch (e) {}

    setShop(activeShop);
    setAllShops(merchantShops);
    setOwnerPhone(activeShop?.phone || storedPhone);
    setOwnerName(activeShop?.ownerName || storedName || 'Store Owner');
    setOwnerEmail(activeShop?.email || storedEmail || '');

    // Fetch fresh details from backend if phone exists
    const phoneToFetch = activeShop?.phone || storedPhone;
    if (phoneToFetch) {
      const cleanPhone = phoneToFetch.replace(/\D/g, '').slice(-10);
      shopApi.getShopsByPhone(cleanPhone)
        .then((res) => {
          if (res?.data?.data && res.data.data.length > 0) {
            const freshShops = res.data.data;
            setAllShops(freshShops);
            // If activeShop is not set or matches one of the shops
            const matched = freshShops.find(s => s.id === activeShop?.id || s.slug === activeShop?.slug) || freshShops[0];
            setShop(prev => ({ ...prev, ...matched }));
            localStorage.setItem('ak_active_merchant_shop', JSON.stringify({ ...activeShop, ...matched }));
            if (matched.ownerName) setOwnerName(matched.ownerName);
            if (matched.phone) setOwnerPhone(matched.phone);
            if (matched.email) setOwnerEmail(matched.email);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleCopySlug = () => {
    if (!shop?.slug) return;
    const url = `${window.location.origin}/book/${shop.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ak_role');
      localStorage.removeItem('ak_phone');
      localStorage.removeItem('ak_email');
      localStorage.removeItem('ak_token');
      localStorage.removeItem('ak_customer_name');
      localStorage.removeItem('ak_customer_age');
      localStorage.removeItem('ak_active_merchant_shop');
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/';
    }
  };

  const handleSwitchShop = (selectedShop) => {
    setShop(selectedShop);
    localStorage.setItem('ak_active_merchant_shop', JSON.stringify(selectedShop));
    window.dispatchEvent(new Event('storage'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F1E9] flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#176B65] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#283B3D]">Loading Shopkeeper Details...</p>
        </div>
      </div>
    );
  }

  if (!shop && !ownerPhone) {
    return (
      <div className="min-h-screen bg-[#F3F1E9] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#DCE9E3] shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#283B3D]">No Active Shopkeeper Found</h2>
            <p className="text-xs text-[#283B3D]/70 font-medium mt-1.5">
              You are not logged in as a registered shopkeeper or worker yet.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link
              href="/merchant/register"
              className="w-full py-3 px-4 rounded-2xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Store className="w-4 h-4 text-[#F2A15A]" />
              <span>Register or Log In to Shop</span>
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#283B3D] text-xs font-bold block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryLabel = shop?.categoryName || shop?.category || 'Services & Retail';
  const shopAddress = shop?.address || 'Lucknow, Uttar Pradesh';
  const shopZone = shop?.zone || 'Indira Nagar, Lucknow';
  const activeCounters = shop?.activeCounters || 1;
  const avgWaitTime = shop?.estimatedMinutesPerTurn || shop?.avgWaitTime || 15;
  const tokenPrefix = shop?.tokenPrefix || 'TK';
  const tokenCap = shop?.tokenCap || 100;
  const status = shop?.status || 'OPEN';
  const isOpen = status.toUpperCase() === 'OPEN';

  return (
    <div className="min-h-screen bg-[#F3F1E9] pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE9E3] shadow-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/merchant/dashboard"
              className="w-10 h-10 rounded-2xl bg-[#DCE9E3]/70 hover:bg-[#DCE9E3] border border-[#176B65]/20 text-[#176B65] flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Back to Live Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#283B3D] tracking-tight">
                  Shopkeeper & Store Profile
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-[#283B3D]/70 font-medium mt-0.5">
                Complete account & business details registered on SkipQ
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/merchant/dashboard"
              className="py-2.5 px-4 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#F2A15A]" />
              <span>Live Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-3.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Log Out as Shopkeeper"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Section 1: Shopkeeper Personal Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DCE9E3] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#DCE9E3] text-[#176B65] flex items-center justify-center font-black">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#283B3D]">
                  Shopkeeper / Owner Details
                </h2>
                <p className="text-xs text-[#283B3D]/60 font-medium">
                  Primary account holder credentials & contact information
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#176B65] bg-[#DCE9E3]/60 px-3 py-1 rounded-xl">
              Owner Console
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Owner Full Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-[#176B65]" />
                <span>Full Name</span>
              </div>
              <p className="text-sm font-black text-[#283B3D] truncate">
                {ownerName || 'Shop Owner'}
              </p>
            </div>

            {/* Mobile Number */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mobile Number</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-[#283B3D]">
                  {ownerPhone ? `+91 ${ownerPhone.slice(-10)}` : 'Not linked'}
                </p>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>

            {/* Email Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email Address</span>
              </div>
              <p className="text-sm font-black text-[#283B3D] truncate">
                {ownerEmail || 'Not Provided / Google Auth'}
              </p>
            </div>

            {/* Role & Access */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Role & Permissions</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                Verified Merchant (Admin)
              </p>
            </div>

            {/* Security & Password */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Password Security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-slate-600">••••••••</span>
                <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  End-to-End Encrypted
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Account Status</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-black text-emerald-700">Live & Operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Shop / Store Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DCE9E3] shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#DCE9E3] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#176B65] flex items-center justify-center font-black">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#283B3D]">
                  {shop?.name || 'Active Shop Details'}
                </h2>
                <p className="text-xs text-[#283B3D]/60 font-medium">
                  {categoryLabel} • {shopZone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span>Status: {status}</span>
              </span>
            </div>
          </div>

          {/* Grid of Business Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Shop Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 text-[#176B65]" />
                <span>Store / Clinic Name</span>
              </div>
              <p className="text-sm font-black text-[#283B3D] truncate">
                {shop?.name || 'Store'}
              </p>
            </div>

            {/* Business Category */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-[#F2A15A]" />
                <span>Category</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                {categoryLabel}
              </p>
            </div>

            {/* City / Zone */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>City & Zone</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                {shopZone}
              </p>
            </div>

            {/* Full Street Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Full Address</span>
              </div>
              <p className="text-xs font-bold text-[#283B3D]">
                {shopAddress}
              </p>
            </div>

            {/* Coordinates / GPS */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-purple-600" />
                <span>GPS Location</span>
              </div>
              <p className="text-xs font-bold text-[#283B3D]">
                {shop?.lat && shop?.lng ? `${Number(shop.lat).toFixed(4)}° N, ${Number(shop.lng).toFixed(4)}° E` : 'Lucknow (26.8861° N, 80.9951° E)'}
              </p>
            </div>

            {/* Token Prefix */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Hash className="w-3.5 h-3.5 text-[#176B65]" />
                <span>Token Prefix</span>
              </div>
              <p className="text-sm font-black text-[#176B65]">
                {tokenPrefix}-XXX
              </p>
            </div>

            {/* Daily Token Capacity */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Daily Token Cap</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                {tokenCap} Tokens / Day
              </p>
            </div>

            {/* Active Counters */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-teal-600" />
                <span>Active Counters</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                {activeCounters} Operational Counter(s)
              </p>
            </div>

            {/* Estimated Turn Time */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Avg Wait Per Person</span>
              </div>
              <p className="text-sm font-black text-[#283B3D]">
                ~{avgWaitTime} Minutes
              </p>
            </div>

            {/* Current Serving */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Counter Turn</span>
              </div>
              <p className="text-sm font-black text-emerald-700">
                {shop?.currentServing || `${tokenPrefix}-001`}
              </p>
            </div>

            {/* WhatsApp Integration */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Alerts</span>
              </div>
              <p className="text-sm font-black text-emerald-700">
                Enabled & Connected
              </p>
            </div>
          </div>

          {/* Public Booking Link Card */}
          {shop?.slug && (
            <div className="mt-4 p-4 rounded-2xl bg-[#DCE9E3]/40 border border-[#176B65]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-[#176B65] tracking-wider">
                  Public Customer Token Booking URL
                </span>
                <p className="text-xs font-bold text-[#283B3D] break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/book/${shop.slug}` : `/book/${shop.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySlug}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#283B3D] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
                <Link
                  href={`/book/${shop.slug}`}
                  target="_blank"
                  className="py-2 px-3 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Page</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Multi-Branch & Other Registered Shops (if any) */}
        {allShops.length > 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#DCE9E3] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-3">
              <div>
                <h3 className="text-base font-black text-[#283B3D]">
                  All Registered Branches ({allShops.length})
                </h3>
                <p className="text-xs text-[#283B3D]/60 font-medium">
                  Switch between multiple stores or branches managed by your number
                </p>
              </div>
              <Link
                href="/merchant/register?new=true"
                className="py-2 px-3 rounded-xl bg-[#DCE9E3]/70 hover:bg-[#DCE9E3] text-[#176B65] text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Add Branch</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {allShops.map((s) => {
                const isCurrent = (s.id && s.id === shop?.id) || (s.slug && s.slug === shop?.slug);
                return (
                  <div
                    key={s.id || s.slug}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-50/60 border-[#176B65] shadow-xs ring-1 ring-[#176B65]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-black text-[#283B3D]">{s.name}</h4>
                      <p className="text-xs text-[#283B3D]/70 font-medium mt-0.5">
                        {s.categoryName || s.category} • {s.zone || 'Lucknow'}
                      </p>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2 py-1 rounded-lg">
                        Active Console
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchShop(s)}
                        className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-[#176B65] hover:text-white text-xs font-bold transition-all text-[#283B3D] cursor-pointer"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 4: Bottom Navigation & Quick Links */}
        <div className="bg-white rounded-3xl p-6 border border-[#DCE9E3] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-[#283B3D]">Shopkeeper Quick Navigation</h4>
            <p className="text-xs text-[#283B3D]/60 font-medium">Manage counter live, register branches, or exit session</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/merchant/dashboard"
              className="py-2.5 px-4 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Store className="w-4 h-4 text-[#F2A15A]" />
              <span>Open Live Dashboard</span>
            </Link>
            <Link
              href="/merchant/register?new=true"
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-[#DCE9E3]/50 text-[#283B3D] text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#176B65]" />
              <span>Register Another Branch</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
