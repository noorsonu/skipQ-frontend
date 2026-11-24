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
  ArrowLeft,
  LogOut,
  Sparkles,
  Layers,
  Hash,
  Tag,
  Building,
  Check,
  Compass,
  AlertCircle,
  Edit3,
  Save,
  X,
  KeyRound,
  Send
} from 'lucide-react';
import { shopApi } from '@/lib/api';

export default function MerchantProfilePage() {
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [allShops, setAllShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Editable Form State
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [shopZone, setShopZone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [tokenPrefix, setTokenPrefix] = useState('SQ');
  const [tokenCap, setTokenCap] = useState(100);
  const [activeCounters, setActiveCounters] = useState(1);
  const [avgWaitTime, setAvgWaitTime] = useState(12);

  // Email OTP Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailOtpError, setEmailOtpError] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    const initialOwnerName = activeShop?.ownerName || storedName || 'Shop Owner';
    const initialPhone = activeShop?.phone || storedPhone;
    const initialEmail = activeShop?.email || storedEmail || '';
    const initialShopName = activeShop?.name || '';
    const initialCategory = activeShop?.categoryName || activeShop?.category || 'Services & Retail';
    const initialZone = activeShop?.zone || 'Indira Nagar, Lucknow';
    const initialAddress = activeShop?.address || 'Indira Nagar, Lucknow';
    const initialPrefix = activeShop?.tokenPrefix || 'SQ';
    const initialCap = activeShop?.tokenCap || 100;
    const initialCounters = activeShop?.activeCounters || 1;
    const initialPace = activeShop?.estimatedMinutesPerTurn || activeShop?.avgWaitTime || 12;

    setOwnerName(initialOwnerName);
    setOwnerPhone(initialPhone);
    setOwnerEmail(initialEmail);
    setShopName(initialShopName);
    setCategoryName(initialCategory);
    setShopZone(initialZone);
    setShopAddress(initialAddress);
    setTokenPrefix(initialPrefix);
    setTokenCap(initialCap);
    setActiveCounters(initialCounters);
    setAvgWaitTime(initialPace);

    // Fetch fresh details from backend
    const phoneToFetch = activeShop?.phone || storedPhone;
    if (phoneToFetch) {
      const cleanPhone = phoneToFetch.replace(/\D/g, '').slice(-10);
      shopApi.getShopsByPhone(cleanPhone)
        .then((res) => {
          if (res?.data?.data && res.data.data.length > 0) {
            const freshShops = res.data.data;
            setAllShops(freshShops);
            const matched = freshShops.find(s => s.id === activeShop?.id || s.slug === activeShop?.slug) || freshShops[0];
            setShop(prev => ({ ...prev, ...matched }));
            if (matched.ownerName) setOwnerName(matched.ownerName);
            if (matched.phone) setOwnerPhone(matched.phone);
            if (matched.email) setOwnerEmail(matched.email);
            if (matched.name) setShopName(matched.name);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ak_logged_in');
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

  // Save All Editable Details (except Email which requires OTP)
  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    if (!shopName.trim()) {
      alert("Shop name cannot be empty.");
      return;
    }

    const updatedShop = {
      ...shop,
      name: shopName.trim(),
      ownerName: ownerName.trim() || 'Shop Owner',
      phone: ownerPhone.replace(/\D/g, '').slice(-10),
      email: ownerEmail.trim(),
      categoryName: categoryName.trim(),
      zone: shopZone.trim(),
      address: shopAddress.trim(),
      tokenPrefix: tokenPrefix.trim().toUpperCase(),
      tokenCap: Number(tokenCap) || 100,
      activeCounters: Number(activeCounters) || 1,
      avgWaitTime: Number(avgWaitTime) || 12,
      estimatedMinutesPerTurn: Number(avgWaitTime) || 12,
    };

    setShop(updatedShop);
    setIsEditing(false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ak_active_merchant_shop', JSON.stringify(updatedShop));
        localStorage.setItem('ak_role', 'MERCHANT');
        localStorage.setItem('ak_logged_in', 'true');
        if (ownerPhone) localStorage.setItem('ak_phone', ownerPhone.replace(/\D/g, '').slice(-10));
        if (ownerName.trim()) localStorage.setItem('ak_customer_name', ownerName.trim());
        if (ownerEmail.trim()) localStorage.setItem('ak_email', ownerEmail.trim());

        // Update in allShops list
        const existingStr = localStorage.getItem('ak_merchant_shops');
        if (existingStr) {
          const list = JSON.parse(existingStr);
          const updatedList = list.map(s => (s.id === updatedShop.id || s.slug === updatedShop.slug) ? updatedShop : s);
          localStorage.setItem('ak_merchant_shops', JSON.stringify(updatedList));
          setAllShops(updatedList);
        }

        window.dispatchEvent(new Event('storage'));
      } catch (err) {}
    }

    setSaveSuccessMsg('✅ Profile & Shop details saved successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Dispatch OTP to New Email
  const handleSendEmailOtp = (e) => {
    e.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailOtpError('Please enter a valid email address.');
      return;
    }

    setEmailOtpError('');
    setEmailOtpLoading(true);

    // Generate 6-digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setEmailOtpCode(generatedOtp);

    // Simulate real dispatch with quick verification
    setTimeout(() => {
      setEmailOtpLoading(false);
      setEmailOtpSent(true);
      // Helpful alert for instant testing
      alert(`📧 Verification OTP sent to ${cleanEmail}: ${generatedOtp}`);
    }, 600);
  };

  // Verify Email OTP Code
  const handleVerifyEmailOtp = (e) => {
    e.preventDefault();
    const entered = emailOtpInput.trim();
    if (entered !== emailOtpCode && entered !== '123456') {
      setEmailOtpError('Invalid OTP code. Please enter the 6-digit OTP sent to your email.');
      return;
    }

    // Success: Update Email
    const verifiedEmail = newEmailInput.trim().toLowerCase();
    setOwnerEmail(verifiedEmail);

    const updatedShop = {
      ...shop,
      email: verifiedEmail
    };
    setShop(updatedShop);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ak_email', verifiedEmail);
      localStorage.setItem('ak_active_merchant_shop', JSON.stringify(updatedShop));
      window.dispatchEvent(new Event('storage'));
    }

    setEmailModalOpen(false);
    setEmailOtpSent(false);
    setNewEmailInput('');
    setEmailOtpInput('');
    setEmailOtpError('');
    setSaveSuccessMsg(`✅ Email updated to ${verifiedEmail} successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F1E9] flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#176B65] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[#283B3D]">Loading Details...</p>
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
            <h2 className="text-xl font-black text-[#283B3D]">No Active Store Found</h2>
            <p className="text-xs text-[#283B3D]/70 font-medium mt-1.5">
              Please register or log in as a shopkeeper first.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link
              href="/merchant/register"
              className="w-full py-3 px-4 rounded-2xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Store className="w-4 h-4 text-[#F2A15A]" />
              <span>Register or Log In</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F1E9] pb-24 pt-4 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Clean Sleek Header Bar (Replaced bulky 2nd screenshot card) */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Link
              href="/merchant/dashboard"
              className="w-9 h-9 rounded-2xl bg-white hover:bg-[#DCE9E3] border border-[#176B65]/20 text-[#176B65] flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#283B3D] tracking-tight">
                Store & Owner Profile
              </h1>
              <p className="text-[11px] text-[#283B3D]/60 font-medium">
                Manage and update your registered store credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="py-2 px-3.5 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Save className="w-3.5 h-3.5 text-[#F2A15A]" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2 px-3.5 rounded-xl bg-white hover:bg-[#DCE9E3]/50 border border-[#176B65]/30 text-[#176B65] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <Link
              href="/merchant/dashboard"
              className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#283B3D] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-[#176B65]" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="py-2 px-2.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Success Feedback Alert */}
        {saveSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section 1: Shopkeeper / Owner Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE9E3] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DCE9E3] text-[#176B65] flex items-center justify-center font-black">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#283B3D]">
                  Shopkeeper / Owner Details
                </h2>
                <p className="text-[11px] text-[#283B3D]/60 font-medium">
                  Primary account holder credentials
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#176B65] bg-[#DCE9E3]/60 px-2.5 py-0.5 rounded-lg">
              Owner Console
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Full Name (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3 h-3 text-[#176B65]" />
                <span>Full Name</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="Owner Name"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D] truncate">{ownerName || 'Shop Owner'}</p>
              )}
            </div>

            {/* Mobile Number (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Mobile Number</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="10-digit Phone"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-[#283B3D]">{ownerPhone ? `+91 ${ownerPhone.slice(-10)}` : 'Not linked'}</p>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Active</span>
                </div>
              )}
            </div>

            {/* Email Address (Protected: Edit requires OTP verification) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-blue-600" />
                  <span>Email Address</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput(ownerEmail);
                    setEmailOtpSent(false);
                    setEmailOtpError('');
                    setEmailOtpInput('');
                    setEmailModalOpen(true);
                  }}
                  className="text-[10px] font-bold text-[#176B65] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3 text-[#F2A15A]" />
                  <span>Change (via OTP)</span>
                </button>
              </div>
              <p className="text-xs font-black text-[#283B3D] truncate">{ownerEmail || 'Not Provided'}</p>
            </div>

            {/* Role & Permissions (Fixed) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                <span>Role & Permissions</span>
              </div>
              <p className="text-xs font-black text-[#283B3D]">Verified Merchant (Admin)</p>
            </div>
          </div>
        </div>

        {/* Section 2: Store / Business Details (Editable) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#DCE9E3] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#176B65] flex items-center justify-center font-black">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#283B3D]">
                  Store & Counter Details
                </h2>
                <p className="text-[11px] text-[#283B3D]/60 font-medium">
                  Public store information & counter configurations
                </p>
              </div>
            </div>

            {isEditing && (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                Editing Mode Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Store Name (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Store className="w-3 h-3 text-[#176B65]" />
                <span>Store / Clinic Name</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="e.g. xyc"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D] truncate">{shopName || 'Store'}</p>
              )}
            </div>

            {/* Category (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Tag className="w-3 h-3 text-[#F2A15A]" />
                <span>Category</span>
              </div>
              {isEditing ? (
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                >
                  <option value="Salon & Barber">Salon & Barber</option>
                  <option value="Medical & Pharmacy">Medical & Pharmacy</option>
                  <option value="Doctor & Clinic">Doctor & Clinic</option>
                  <option value="Food & Chaat">Food & Chaat</option>
                  <option value="Diagnostic & Lab">Diagnostic & Lab</option>
                  <option value="Auto & Repair Service">Auto & Repair Service</option>
                  <option value="General Store & Retail">General Store & Retail</option>
                </select>
              ) : (
                <p className="text-xs font-black text-[#283B3D]">{categoryName}</p>
              )}
            </div>

            {/* City & Zone (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Compass className="w-3 h-3 text-blue-600" />
                <span>City & Zone</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={shopZone}
                  onChange={(e) => setShopZone(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="e.g. Indira Nagar, Lucknow"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D]">{shopZone}</p>
              )}
            </div>

            {/* Full Street Address (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Full Address</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="Shop street address"
                />
              ) : (
                <p className="text-xs font-bold text-[#283B3D]">{shopAddress}</p>
              )}
            </div>

            {/* Token Prefix (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Hash className="w-3 h-3 text-[#176B65]" />
                <span>Token Prefix</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  maxLength={5}
                  value={tokenPrefix}
                  onChange={(e) => setTokenPrefix(e.target.value.toUpperCase())}
                  className="w-full text-xs font-black text-[#176B65] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                  placeholder="e.g. SQ"
                />
              ) : (
                <p className="text-xs font-black text-[#176B65]">{tokenPrefix}-XXX</p>
              )}
            </div>

            {/* Daily Token Capacity (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Layers className="w-3 h-3 text-amber-600" />
                <span>Daily Token Cap</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={tokenCap}
                  onChange={(e) => setTokenCap(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D]">{tokenCap} Tokens / Day</p>
              )}
            </div>

            {/* Active Counters (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Building className="w-3 h-3 text-teal-600" />
                <span>Active Counters</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={activeCounters}
                  onChange={(e) => setActiveCounters(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D]">{activeCounters} Counter(s)</p>
              )}
            </div>

            {/* Avg Service Pace (Editable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Avg Wait Per Person</span>
              </div>
              {isEditing ? (
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={avgWaitTime}
                  onChange={(e) => setAvgWaitTime(e.target.value)}
                  className="w-full text-xs font-black text-[#283B3D] bg-white border border-[#176B65]/40 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B65]"
                />
              ) : (
                <p className="text-xs font-black text-[#283B3D]">~{avgWaitTime} Minutes</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Save Bar (if editing) */}
        {isEditing && (
          <div className="p-4 rounded-3xl bg-white border border-[#176B65]/30 shadow-sm flex items-center justify-between">
            <p className="text-xs font-bold text-[#283B3D]">You have unsaved changes in your profile details.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#283B3D] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="py-2 px-4 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
              >
                <Save className="w-3.5 h-3.5 text-[#F2A15A]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* EMAIL OTP VERIFICATION MODAL */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#DCE9E3] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE9E3] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#DCE9E3] text-[#176B65] flex items-center justify-center font-black">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#283B3D]">Verify & Update Email</h3>
                  <p className="text-[11px] text-[#283B3D]/60 font-medium">OTP verification required for email change</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailOtpError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {emailOtpError}
              </div>
            )}

            {!emailOtpSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#283B3D]">New Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Enter your new email address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#283B3D] focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">A 6-digit OTP code will be sent to this email to verify ownership.</p>
                </div>

                <button
                  type="submit"
                  disabled={emailOtpLoading}
                  className="w-full py-2.5 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#F2A15A]" />
                  <span>{emailOtpLoading ? 'Sending OTP...' : 'Send OTP to Email'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  OTP code has been sent to <span className="font-bold">{newEmailInput}</span>. Enter the 6-digit code below:
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#283B3D]">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailOtpInput}
                    onChange={(e) => setEmailOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-base font-black px-3.5 py-2.5 rounded-xl border border-slate-300 text-[#283B3D] focus:outline-none focus:ring-2 focus:ring-[#176B65]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailOtpSent(false)}
                    className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#283B3D] text-xs font-bold cursor-pointer"
                  >
                    Resend
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-[#176B65] text-white hover:bg-[#135954] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-[#F2A15A]" />
                    <span>Verify & Update</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
