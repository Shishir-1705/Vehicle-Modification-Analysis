"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, Mail, Calendar, ShieldCheck, Cpu, FileText, BarChart3, 
  Edit3, LayoutDashboard, LogOut, Activity, Clock, CheckCircle2 
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono-tech text-xs">
        <span>LOADING OFFICER SESSION...</span>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formattedDate = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00e5a8] selection:text-[#050505] font-inter relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#00e5a8]/10 via-[#3b82f6]/5 to-transparent blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <Navbar />

      <main className="pt-32 pb-24 max-w-5xl mx-auto px-6 md:px-12 relative z-10 space-y-10">
        {/* Profile Card Shell */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111] rounded-3xl border border-white/10 p-8 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.8)] space-y-8"
        >
          {/* Top Profile Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center space-x-6">
              {/* Initials Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] p-[2px] shadow-[0_0_30px_rgba(0,229,168,0.4)] shrink-0">
                <div className="w-full h-full bg-[#050505] rounded-[14px] flex items-center justify-center text-white font-space font-extrabold text-2xl">
                  {getInitials(user.full_name)}
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-space font-extrabold text-white tracking-tight">
                  {user.full_name}
                </h1>
                <p className="text-xs font-mono-tech text-slate-400 mt-1 flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-[#00e5a8]" />
                  <span>{user.email}</span>
                </p>
                <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-tech font-bold uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VERIFIED RTO FORENSIC OFFICER</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setEditing(!editing)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-space font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
              >
                <Edit3 className="w-4 h-4 text-[#00e5a8]" />
                <span>{editing ? "Cancel" : "Edit Profile"}</span>
              </button>

              <Link
                href="/dashboard"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,168,0.35)] hover:shadow-[0_0_35px_rgba(0,229,168,0.6)] transition-all flex items-center justify-center space-x-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Account Details & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-luxury p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Account Created
              </span>
              <p className="font-space font-bold text-white text-base">{formattedDate}</p>
            </div>

            <div className="glass-luxury p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Officer Role
              </span>
              <p className="font-space font-bold text-[#00e5a8] text-base">{user.role || 'Verified Inspector'}</p>
            </div>

            <div className="glass-luxury p-5 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Auth Status
              </span>
              <p className="font-space font-bold text-emerald-400 text-base">Active JWT Session</p>
            </div>
          </div>

          {/* KPI Statistics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10">
            <div className="glass-luxury p-6 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                TOTAL SCANS EXECUTED
              </span>
              <h3 className="text-3xl font-space font-extrabold text-[#00e5a8] mb-1">{user.total_scans ?? 0}</h3>
              <p className="text-xs text-slate-400">Stored in modai.db</p>
            </div>

            <div className="glass-luxury p-6 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                COURT REPORTS GENERATED
              </span>
              <h3 className="text-3xl font-space font-extrabold text-[#3b82f6] mb-1">{user.reports_generated ?? 0}</h3>
              <p className="text-xs text-slate-400">Stamped PDF Documents</p>
            </div>


            <div className="glass-luxury p-6 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                DETECTION ACCURACY
              </span>
              <h3 className="text-3xl font-space font-extrabold text-emerald-400 mb-1">99.4%</h3>
              <p className="text-xs text-slate-400">Verified Sigmoid Rating</p>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h3 className="font-space font-bold text-lg text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#00e5a8]" />
              <span>Officer Recent Activity</span>
            </h3>

            <div className="space-y-3 font-mono-tech text-xs">
              {[
                { time: '10 MINS AGO', action: 'Executed AI Scan on KA01MH9821 (Yamaha YZF-R15)' },
                { time: '2 HOURS AGO', action: 'Generated Court PDF Report for Illegal Exhaust Alteration' },
                { time: 'YESTERDAY', action: 'Verified CMVR Legal Penalty Score for State Traffic Audit' },
              ].map((act, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-200">{act.action}</span>
                  </div>
                  <span className="text-[10px] text-[#00e5a8] font-bold shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="px-6 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-space font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Session</span>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
