"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, AlertCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      router.push('/dashboard');
    } else {
      setError('Incorrect email or password. Please verify your credentials.');
    }
  };


  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#00e5a8]/10 via-[#3b82f6]/5 to-transparent blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111111] p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 space-y-6"
      >
        {/* Brand Header */}
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
          <h1 className="text-2xl font-space font-extrabold text-white tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-400 font-mono-tech">AUTHENTICATE TO ACCESS COMMAND CENTER</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-tech flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email */}
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

                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white font-inter outline-none focus:border-[#00e5a8] transition-colors"
              />
            </div>
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded accent-[#00e5a8] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-slate-400 text-xs cursor-pointer select-none">
                Remember Me
              </label>
            </div>

            <a href="#" className="text-xs font-mono-tech text-[#00e5a8] hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,168,0.35)] hover:shadow-[0_0_35px_rgba(0,229,168,0.6)] transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-white/10 text-center font-mono-tech text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#00e5a8] font-bold hover:underline">
            Create one
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
