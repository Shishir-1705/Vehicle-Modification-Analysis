"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LayoutDashboard, History, Settings, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export const ProfileDropdown: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = (name: string) => {
    if (!name) return 'AX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl bg-[#0d0d0d] border border-white/10 hover:border-white/20 transition-all text-xs font-mono-tech group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] flex items-center justify-center text-[#050505] font-extrabold text-xs shadow-[0_0_15px_rgba(0,229,168,0.3)]">
          {getInitials(user.full_name)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="font-bold text-white leading-none">{user.full_name}</p>
          <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[130px]">{user.email}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
      </button>

      {/* Profile Dropdown Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-60 bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.9)] p-2 z-50 space-y-1 font-mono-tech text-xs"
          >
            {/* Header User Card */}
            <div className="p-3 border-b border-white/10 space-y-0.5">
              <p className="font-bold text-white">{user.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold text-[#00e5a8] bg-[#00e5a8]/10 px-2 py-0.5 rounded">
                VERIFIED OFFICER
              </span>
            </div>

            {/* Menu Links */}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User className="w-4 h-4 text-[#00e5a8]" />
              <span>Profile</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#3b82f6]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <History className="w-4 h-4 text-emerald-400" />
              <span>Inspection History</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Link>

            {/* Logout Action */}
            <div className="pt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                  router.push('/login');
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
