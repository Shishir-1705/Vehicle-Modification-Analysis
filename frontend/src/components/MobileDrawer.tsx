"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ArrowRight, LayoutDashboard, LogOut, Play } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ name: string; href: string; id: string }>;
  activeSection?: string;
  onOpenDemoVideo?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  navLinks,
  activeSection,
  onOpenDemoVideo,
}) => {
  const { user, logout } = useAuth();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    onClose();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Left Sliding Navigation Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#080808] border-r border-white/10 p-6 z-50 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.9)] font-inter"
          >
            <div>
              {/* Drawer Header with AXION Logo & Close Button */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <Link href="/" onClick={onClose} className="flex items-center space-x-2.5 group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] p-[1px] shadow-[0_0_20px_rgba(0,229,168,0.3)]">
                    <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#00e5a8]" />
                    </div>
                  </div>
                  <span className="font-space font-extrabold text-xl tracking-tight text-white flex items-center space-x-1.5">
                    <span>AXION</span>
                    <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
                  </span>
                </Link>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Banner (if logged in) */}
              {user && (
                <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] flex items-center justify-center text-[#050505] font-extrabold text-xs font-mono-tech">
                    {user.full_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-xs truncate">{user.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Watch Demo CTA Trigger inside Drawer */}
              <div className="mt-5 mb-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenDemoVideo) onOpenDemoVideo();
                  }}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-space font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Play className="w-4 h-4 text-[#00e5a8] fill-[#00e5a8]" />
                    <span>Watch Cinematic Demo</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00e5a8] group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Navigation Section Links */}
              <div className="space-y-1 mt-4">
                <span className="text-[10px] font-mono-tech font-bold uppercase text-slate-500 tracking-widest px-3 block mb-2">
                  LANDING SECTIONS
                </span>
                {navLinks.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all group ${
                        isActive
                          ? 'bg-[#00e5a8]/10 text-[#00e5a8] border border-[#00e5a8]/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-all ${
                        isActive ? 'text-[#00e5a8] translate-x-1' : 'text-slate-600 group-hover:text-[#00e5a8] group-hover:translate-x-1'
                      }`} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,168,0.3)] flex items-center justify-center space-x-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-space font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2.5">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-space font-bold text-xs uppercase tracking-wider text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider text-center shadow-[0_0_20px_rgba(0,229,168,0.3)]"
                  >
                    Try Platform
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
