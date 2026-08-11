"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email Gmail-only Validation
  const isGmailValid = email.length > 0 && email.toLowerCase().endsWith('@gmail.com');
  const showGmailCheck = email.length > 0;

  // Password Strength
  const isPasswordStrong = password.length >= 8;
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isGmailValid) {
      setError('Only Gmail addresses ending with @gmail.com are allowed.');
      return;
    }
    if (!isPasswordStrong) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!isPasswordMatch) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms and Privacy Policy.');
      return;
    }

    setLoading(true);
    const success = await signup(fullName, email, password);
    setLoading(false);

    if (success) {
      router.push('/login?registered=true');
    } else {
      setError('Registration failed. Email may already be registered.');
    }
  };



  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#00e5a8]/10 via-[#3b82f6]/5 to-transparent blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111111] p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 space-y-6"
      >
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5 group mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] p-[1px] shadow-[0_0_20px_rgba(0,229,168,0.3)]">
              <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#00e5a8]" />
              </div>
            </div>
            <span className="font-space font-extrabold text-xl tracking-tight text-white flex items-center space-x-1">
              <span>AXION</span>
              <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
            </span>

          </Link>
          <h1 className="text-2xl font-space font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 font-mono-tech">ENTER YOUR GMAIL ADDRESS TO REGISTER</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-tech flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-mono-tech uppercase text-slate-300 text-[10px] font-bold">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-inter outline-none focus:border-[#00e5a8] transition-colors"
              />
            </div>
          </div>

          {/* Email with Gmail Validation */}
          <div className="space-y-1.5">
            <label className="font-mono-tech uppercase text-slate-300 text-[10px] font-bold">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"

                className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border text-white font-inter outline-none transition-colors ${
                  showGmailCheck 
                    ? isGmailValid 
                      ? 'border-emerald-500/60 focus:border-emerald-500' 
                      : 'border-rose-500/60 focus:border-rose-500'
                    : 'border-white/10 focus:border-[#00e5a8]'
                }`}
              />
            </div>

            {/* Real-Time Gmail Validation Status */}
            {showGmailCheck && (
              <div className="pt-1">
                {isGmailValid ? (
                  <p className="text-[11px] font-mono-tech text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>✓ Valid Gmail address</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-mono-tech text-rose-400 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Only Gmail addresses are allowed.</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="font-mono-tech uppercase text-slate-300 text-[10px] font-bold">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-inter outline-none focus:border-[#00e5a8] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="font-mono-tech uppercase text-slate-300 text-[10px] font-bold">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-inter outline-none focus:border-[#00e5a8] transition-colors"
              />
            </div>
            {confirmPassword.length > 0 && !isPasswordMatch && (
              <p className="text-[11px] font-mono-tech text-rose-400">Passwords do not match.</p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded accent-[#00e5a8] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="terms" className="text-slate-400 text-xs cursor-pointer select-none">
              I agree to the <span className="text-white underline">Terms and Privacy Policy</span>
            </label>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,168,0.35)] hover:shadow-[0_0_35px_rgba(0,229,168,0.6)] transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-white/10 text-center font-mono-tech text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00e5a8] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
