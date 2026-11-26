"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Users, Store, UserCheck, Trash2, Search, 
  RefreshCw, AlertCircle, CheckCircle2, Lock, Key, ArrowRight,
  Phone, Mail, Calendar, Eye, ShieldAlert, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

const ADMIN_SECRET = 'SKIPQ_PURGE_2026';
const PASSKEY_KEY = 'ak_admin_access_unlocked';

export default function AdminUsersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'CUSTOMER' | 'SHOP_OWNER'
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem(PASSKEY_KEY);
      if (unlocked === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Fetch users when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [isAuthenticated]);

  const handleUnlock = (e) => {
    e.preventDefault();
    const input = passkeyInput.trim();
    if (input === 'Noormd870@' || input === ADMIN_SECRET) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PASSKEY_KEY, 'true');
      }
      setIsAuthenticated(true);
      setPasskeyError('');
    } else {
      setPasskeyError('Invalid Admin Passkey. Please enter the correct key.');
    }
  };

  const handleLockConsole = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PASSKEY_KEY);
    }
    setIsAuthenticated(false);
    setPasskeyInput('');
  };

  const loadUsers = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await adminApi.getUsers(ADMIN_SECRET);
      if (res?.data?.data) {
        setUsers(res.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      setFetchError(err?.response?.data?.message || err?.message || 'Failed to fetch users from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user || !user.userId) return;
    setIsDeleting(true);
    setActionError('');
    setSuccessMsg('');

    try {
      await adminApi.deleteUser(user.userId, ADMIN_SECRET);
      
      // Remove from client state
      setUsers(prev => prev.filter(u => u.userId !== user.userId));

      // Also clean up from local profiles if present
      if (typeof window !== 'undefined' && user.phone) {
        try {
          const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
          const profiles = JSON.parse(localStorage.getItem('ak_customer_profiles') || '{}');
          if (profiles[cleanPhone]) {
            delete profiles[cleanPhone];
            localStorage.setItem('ak_customer_profiles', JSON.stringify(profiles));
          }
          if (localStorage.getItem('ak_phone') === cleanPhone) {
            localStorage.removeItem('ak_logged_in');
            localStorage.removeItem('ak_role');
            localStorage.removeItem('ak_token');
          }
        } catch (e) {}
      }

      setSuccessMsg(`User "${user.name || user.phone}" was permanently deleted from the database.`);
      setUserToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      setActionError(err?.response?.data?.message || err?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered users calculation
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const totalCustomers = users.filter(u => u.role === 'CUSTOMER').length;
  const totalOwners = users.filter(u => u.role === 'SHOP_OWNER').length;

  // -------------------------------------------------------------
  // VIEW A: PASSKEY LOCK SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE9E3] shadow-xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#176B65]/10 text-[#176B65] flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7 text-[#176B65]" />
            </div>
            <h1 className="text-xl font-black text-[#283B3D]">SkipQ Admin Console</h1>
            <p className="text-xs text-[#283B3D]/70 font-medium">
              Private platform operations & governance portal.
            </p>
          </div>

          {passkeyError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{passkeyError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#283B3D] mb-1.5">
                Admin Passkey / Secret Key
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter admin passkey"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full bg-[#F3F1E9]/60 border border-[#DCE9E3] rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-[#283B3D] focus:outline-none focus:border-[#176B65]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Unlock Admin Panel</span>
              <ArrowRight className="w-4 h-4 text-[#F2A15A]" />
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/" className="text-xs font-bold text-slate-400 hover:text-[#176B65]">
              ← Return to SkipQ Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: AUTHENTICATED ADMIN OPERATIONS PORTAL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#283B3D] pb-16">
      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

        {/* Admin Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE9E3]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-[#283B3D]">
                Customer & Worker Database Governance
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#176B65] text-white px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap shrink-0 inline-block">
                Super Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-[#DCE9E3] bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh users"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#176B65] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLockConsole}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Lock Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Console</span>
            </button>
          </div>
        </div>

        {/* Notification Toasts */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#DCE9E3] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Registered</span>
              <span className="text-2xl font-black text-[#283B3D]">{users.length}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">In PostgreSQL DB</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#DCE9E3]/50 text-[#176B65] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#DCE9E3] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Customers</span>
              <span className="text-2xl font-black text-emerald-700">{totalCustomers}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Token seekers & guests</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#DCE9E3] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Workers / Shop Owners</span>
              <span className="text-2xl font-black text-[#176B65]">{totalOwners}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Counter desk merchants</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#176B65]/10 text-[#176B65] flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#DCE9E3] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, phone (+91), or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3F1E9]/50 border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-[#283B3D] focus:outline-none focus:border-[#176B65]"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'ALL'
                    ? 'bg-white text-[#176B65] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('CUSTOMER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'CUSTOMER'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Customers ({totalCustomers})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('SHOP_OWNER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'SHOP_OWNER'
                    ? 'bg-white text-[#176B65] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Workers ({totalOwners})
              </button>
            </div>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="bg-white rounded-3xl border border-[#DCE9E3] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DCE9E3] flex items-center justify-between">
            <h2 className="text-sm font-black text-[#283B3D]">
              Registered Database Accounts ({filteredUsers.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Click Red Delete button to remove permanently</span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#176B65] mx-auto" />
              <p className="text-xs font-bold text-slate-500">Connecting to PostgreSQL database...</p>
            </div>
          ) : fetchError ? (
            <div className="p-12 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-600">{fetchError}</p>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-[#176B65] text-white text-xs font-bold rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-600">No users match your criteria</h3>
              <p className="text-xs text-slate-400">Try changing the search query or role filter above.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => {
                const isOwner = user.role === 'SHOP_OWNER';
                return (
                  <div
                    key={user.userId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F3F1E9]/30 transition-colors"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isOwner ? 'bg-[#176B65]/10 text-[#176B65]' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.name ? user.name.slice(0, 2).toUpperCase() : (isOwner ? 'WK' : 'CU')}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#283B3D]">
                            {user.name || 'Unnamed Account'}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isOwner 
                              ? 'bg-[#176B65] text-white' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOwner ? 'Worker / Owner' : 'Customer'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                          {user.phone && (
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              +91 {user.phone}
                            </span>
                          )}
                          {user.email && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {user.email}
                            </span>
                          )}
                          {user.createdAt && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200/60 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete User</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Confirmation Modal for Delete User */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-[#283B3D]">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Are you sure you want to delete <span className="font-bold text-rose-700">{userToDelete.name || userToDelete.phone}</span> ({userToDelete.role}) from the PostgreSQL database?
                </p>
                <p className="text-[11px] text-slate-400">
                  {userToDelete.role === 'SHOP_OWNER'
                    ? "This action cannot be undone. The owner's shop, counter settings, and issued tokens will also be permanently deleted."
                    : "This action cannot be undone. User history will be cleaned and anonymized."}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(userToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
