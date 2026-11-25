"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Lock, Mail, Phone, Calendar, ArrowRight,
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, ShieldCheck,
  LogIn, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi, userApi } from '@/lib/api';
import { signInWithGoogle } from '@/lib/googleAuth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const rawReturnUrl = searchParams.get('returnUrl');
  const returnUrl = (rawReturnUrl && rawReturnUrl !== '/tokens') ? rawReturnUrl : '/';

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Login Method: 'phone' | 'email'
  const [loginMethod, setLoginMethod] = useState('phone');
  const [loginEmail, setLoginEmail] = useState('');

  // Common Fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  // Google Link Mobile Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleModalPhone, setGoogleModalPhone] = useState('');
  const [googleModalLoading, setGoogleModalLoading] = useState(false);
  const [tempGoogleUser, setTempGoogleUser] = useState(null);

  // Forgot Password State
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Keep backend warm / wake up if in standby mode on Render free tier
    try {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://skipq-backend-vyd7.onrender.com'}/api/categories`, { method: 'GET' }).catch(() => {});
    } catch (e) {}

    // If already logged in, redirect to returnUrl
    if (typeof window !== 'undefined') {
      const loggedIn = localStorage.getItem('ak_logged_in') === 'true';
      const role = localStorage.getItem('ak_role');
      if (loggedIn && role === 'CUSTOMER') {
        router.push(returnUrl);
      }
    }
  }, [router, returnUrl]);

  // 1-Click Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      const res = await authApi.googleLogin({
        email: googleUser.email,
        name: googleUser.displayName,
        phone: googleUser.phoneNumber,
        role: 'CUSTOMER'
      });
      const token = res?.data?.data?.token || 'mock-customer-jwt-' + Date.now();
      const name = res?.data?.data?.name || googleUser.displayName || 'Customer';
      const userAge = res?.data?.data?.age ? String(res.data.data.age) : '';
      const userPhone = res?.data?.data?.phone || '';

      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_logged_in', 'true');
        localStorage.setItem('ak_token', token);
        localStorage.setItem('ak_customer_name', name);
        localStorage.setItem('ak_role', 'CUSTOMER');
        if (googleUser.email) localStorage.setItem('ak_email', googleUser.email);
        if (userAge) localStorage.setItem('ak_customer_age', userAge);
        if (userPhone) localStorage.setItem('ak_phone', userPhone);
      }

      // If user has no phone linked yet, open modal to link mobile number (or skip)
      if (!userPhone) {
        setTempGoogleUser({ token, name, email: googleUser.email });
        setGoogleModalOpen(true);
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      setSuccessMsg(`Welcome, ${name}! Redirecting...`);
      setTimeout(() => router.push(returnUrl), 800);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setErrorMsg(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  // Google Link Mobile Number Save Handler
  const handleSaveGooglePhone = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = googleModalPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    setGoogleModalLoading(true);
    try {
      await userApi.updateProfile({ phone: clean });
      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_phone', clean);
        window.dispatchEvent(new Event('storage'));
      }
      setSuccessMsg("Mobile number linked successfully!");
      setGoogleModalOpen(false);
      setTimeout(() => router.push(returnUrl), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not link mobile number.';
      setErrorMsg(msg);
    } finally {
      setGoogleModalLoading(false);
    }
  };

  // Skip Linking Mobile Number for Google User
  const handleSkipGooglePhone = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
    setGoogleModalOpen(false);
    router.push(returnUrl);
  };

  // Submit Handler for Both Login (Phone or Email) and Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password || password.trim().length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    const payload = {
      action: activeTab === 'login' ? 'login' : 'register',
      password: password.trim(),
      role: 'CUSTOMER'
    };

    if (activeTab === 'login') {
      if (loginMethod === 'phone') {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        if (cleanPhone.length !== 10) {
          setErrorMsg("Please enter a valid 10-digit mobile number.");
          return;
        }
        payload.phone = cleanPhone;
      } else {
        if (!loginEmail.trim() || !loginEmail.includes('@')) {
          setErrorMsg("Please enter a valid registered email address.");
          return;
        }
        payload.email = loginEmail.trim().toLowerCase();
      }
    } else {
      // Register Mode - Strictly validate Name, Mobile Number, Email, Age, and Password
      if (!fullName.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        setErrorMsg("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      payload.name = fullName.trim();
      payload.phone = cleanPhone;
      payload.email = email.trim().toLowerCase();

      // Age is optional
      if (age && age.trim()) {
        const parsedAge = parseInt(age, 10);
        if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 115) {
          setErrorMsg("Please enter a valid age (between 5 and 115 years).");
          return;
        }
        payload.age = parsedAge;
      }
    }

    setLoading(true);
    try {
      const res = await authApi.directLogin(payload);
      const token = res?.data?.data?.token;
      if (!token) {
        throw new Error(res?.data?.message || 'Authentication failed: No token returned from server.');
      }
      const returnedPhone = res?.data?.data?.phone || payload.phone || '';
      const returnedEmail = res?.data?.data?.email || payload.email || '';
      const rawResName = res?.data?.data?.name;
      const isResNameDigits = /^\+?\d{6,}$/.test((rawResName || '').replace(/[\s\-\(\)]/g, ''));
      let finalName = '';
      if (rawResName && !isResNameDigits && !rawResName.toLowerCase().startsWith('customer (')) {
        finalName = rawResName.trim();
      } else if (activeTab === 'register' && fullName.trim()) {
        finalName = fullName.trim();
      } else if (returnedEmail && returnedEmail.includes('@')) {
        const cleanEmailName = returnedEmail.split('@')[0].replace(/[0-9._-]+$/, '');
        finalName = cleanEmailName ? (cleanEmailName.charAt(0).toUpperCase() + cleanEmailName.slice(1)) : 'Customer';
      } else {
        finalName = 'Customer';
      }
      const finalAge = res?.data?.data?.age ? String(res.data.data.age) : age;

      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_logged_in', 'true');
        localStorage.setItem('ak_token', token);
        if (returnedPhone) localStorage.setItem('ak_phone', returnedPhone);
        if (returnedEmail) localStorage.setItem('ak_email', returnedEmail);
        localStorage.setItem('ak_role', 'CUSTOMER');
        localStorage.setItem('ak_customer_name', finalName);
        if (finalAge) localStorage.setItem('ak_customer_age', finalAge);
        window.dispatchEvent(new Event('storage'));
      }

      setSuccessMsg(activeTab === 'register' ? `Account created! Welcome, ${finalName}!` : `Welcome back, ${finalName}!`);
      setTimeout(() => router.push(returnUrl), 800);
    } catch (err) {
      console.error("Auth error:", err);
      let rawMsg = err.response?.data?.message || err.message || 'Authentication failed. Please verify your credentials.';
      let msg = rawMsg;
      const lower = String(rawMsg).toLowerCase();
      if (lower.includes('not found') || lower.includes('no account') || lower.includes('user not found')) {
        msg = 'Account not found with this mobile number or email.';
      } else if (lower.includes('bad credentials') || lower.includes('invalid password') || lower.includes('wrong password') || lower.includes('unauthorized')) {
        msg = 'Incorrect password. Please try again.';
      } else if (lower.includes('already exists') || lower.includes('already registered')) {
        msg = 'An account is already registered with this mobile number.';
      } else if (err.code === 'ECONNABORTED' || lower.includes('timeout')) {
        msg = 'Connection timed out. Please try again.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanPhone = forgotPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMsg("Please enter your registered email address.");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.trim().length < 4) {
      setErrorMsg("New password must be at least 4 characters long.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authApi.resetPassword({
        phone: cleanPhone,
        email: forgotEmail.trim(),
        newPassword: forgotNewPassword.trim(),
        role: 'CUSTOMER'
      });

      const token = res?.data?.data?.token || 'mock-jwt-' + Date.now();
      const name = res?.data?.data?.name || 'Customer';
      if (typeof window !== 'undefined') {
        localStorage.setItem('ak_logged_in', 'true');
        localStorage.setItem('ak_token', token);
        localStorage.setItem('ak_phone', cleanPhone);
        localStorage.setItem('ak_role', 'CUSTOMER');
        localStorage.setItem('ak_customer_name', name);
        localStorage.setItem('ak_email', forgotEmail.trim());
        window.dispatchEvent(new Event('storage'));
      }

      setSuccessMsg(`Password reset successfully! Welcome, ${name}!`);
      setTimeout(() => router.push(returnUrl), 800);
    } catch (err) {
      console.error("Reset error:", err);
      const msg = err.response?.data?.message || err.message || 'Reset failed. Please verify your details.';
      setErrorMsg(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pt-2 sm:pt-5 pb-10 px-3 sm:px-6 flex flex-col items-center relative">
      {/* Background Ambience */}
      <div className="fixed top-10 left-1/4 w-[450px] h-[450px] bg-[#DCE9E3]/60 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[400px] h-[400px] bg-[#176B65]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Auth Page Card */}
      <div className="w-full bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-[#DCE9E3] space-y-5">

        {/* Card Header */}
        <div className="text-center space-y-1 border-b border-[#DCE9E3] pb-4">
          <h2 className="text-2xl font-black text-[#283B3D]">
            {isForgotView
              ? 'Reset Password'
              : activeTab === 'login'
                ? 'Customer Sign In'
                : 'Create Customer Account'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isForgotView
              ? 'Recover your account using your registered email'
              : activeTab === 'login'
                ? 'Sign in to track tokens and view queue history'
                : 'Register in seconds to book live tokens'}
          </p>
        </div>

        {/* Tab Switcher (Log In vs Register) - Hidden in Forgot View */}
        {!isForgotView && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'login'
                ? 'bg-white text-[#176B65] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'register'
                ? 'bg-white text-[#176B65] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium flex items-center gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="flex-1 leading-snug">{errorMsg}</p>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {isForgotView ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#283B3D] block mb-1">
                Registered 10-Digit Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-[#176B65]">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-12 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#283B3D] block mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="noor786@gmail.com"
                  className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#283B3D] block mb-1">
                Create New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showForgotNewPassword ? "text" : "password"}
                  required
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full py-3.5 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {forgotLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Reset & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsForgotView(false)}
              className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#176B65] py-1 cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        ) : (
          /* LOGIN & REGISTER FORMS */
          <div className="space-y-4">

            {/* 1-Click Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#283B3D] border border-slate-300 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#DCE9E3] w-full"></div>
              <span className="bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 absolute">
                {activeTab === 'login' ? 'OR SIGN IN WITH PASSWORD' : 'OR CREATE PASSWORD ACCOUNT'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">

              {/* LOGIN MODE: METHOD SELECTOR (PHONE OR EMAIL) */}
              {activeTab === 'login' ? (
                <div>
                  <label className="text-xs font-bold text-[#283B3D] block mb-1.5">
                    Sign In Using
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('phone'); setErrorMsg(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${loginMethod === 'phone'
                        ? 'bg-white text-[#176B65] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Mobile Number</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('email'); setErrorMsg(''); }}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${loginMethod === 'email'
                        ? 'bg-white text-[#176B65] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Address</span>
                    </button>
                  </div>

                  {loginMethod === 'phone' ? (
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-[#176B65]">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-12 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="noor786@gmail.com"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* REGISTER MODE FIELDS */
                <>
                  <div>
                    <label className="text-xs font-bold text-[#283B3D] block mb-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Noor Mohammad"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#283B3D] block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. noor786@gmail.com"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#283B3D] block mb-1">
                      10-Digit Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-bold text-[#176B65]">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-12 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#283B3D] block mb-1">
                      Your Age (in years) <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="number"
                        min={5}
                        max={115}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 25"
                        className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#283B3D]">
                    {activeTab === 'register' ? 'Create Password' : 'Password'}
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPhone(phone);
                        setIsForgotView(true);
                      }}
                      className="text-[11px] font-bold text-[#176B65] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'register' ? 'Choose a password' : 'Enter your password'}
                    className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{activeTab === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'register' ? 'Create Account & Continue' : 'Sign In & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Bottom Quick Switch */}
              <div className="text-center pt-2">
                {activeTab === 'login' ? (
                  <p className="text-xs text-slate-500 font-medium">
                    New to SkipQ?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="font-bold text-[#176B65] hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('login')}
                      className="font-bold text-[#176B65] hover:underline cursor-pointer"
                    >
                      Log in here
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Link to Merchant Register / Login */}
        <div className="text-center pt-1 border-t border-[#DCE9E3]/70">
          <Link
            href="/merchant/register?tab=login"
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1"
          >
            <span>Are you a shop owner? Go to Partner Console</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* GOOGLE LINK MOBILE NUMBER MODAL */}
      <AnimatePresence>
        {googleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#176B65] flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-[#283B3D]">
                  Link Mobile Number
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Add your 10-digit number to receive live turn SMS alerts and sign in with either Mobile or Email in the future.
                </p>
              </div>

              <form onSubmit={handleSaveGooglePhone} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[#283B3D] block mb-1">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-[#176B65]">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={googleModalPhone}
                      onChange={(e) => setGoogleModalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      className="w-full bg-[#F3F1E9] border border-[#DCE9E3] rounded-2xl pl-12 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#176B65]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={googleModalLoading}
                  className="w-full py-3 rounded-2xl bg-[#176B65] hover:bg-[#125550] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {googleModalLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Linking Number...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipGooglePhone}
                  className="w-full py-1 text-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Skip for Now
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm font-semibold text-[#176B65]">Loading Sign In...</div>}>
      <LoginContent />
    </Suspense>
  );
}
