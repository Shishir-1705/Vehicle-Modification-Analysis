"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, ShieldCheck, ShieldAlert, Cpu, BarChart3, 
  Search, SlidersHorizontal, RefreshCw, Eye, Download, Layers 
} from 'lucide-react';

interface DashboardPreviewProps {
  onOpenPlatform: () => void;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ onOpenPlatform }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'live' | 'heatmaps' | 'rto'>('overview');

  const mockVehicles = [
    { plate: 'KA01MH9821', model: 'Yamaha YZF-R15', status: 'MODIFIED', score: '98.4%', violations: ['Aftermarket Exhaust', 'Aggressive Clip-ons'] },
    { plate: 'MH12AB4321', model: 'KTM RC 390', status: 'MODIFIED', score: '94.2%', violations: ['Custom Projector Light'] },
    { plate: 'DL04XY8890', model: 'Royal Enfield Interceptor', status: 'STOCK', score: '12.1%', violations: [] },
  ];

  return (
    <div className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-mono-tech font-bold uppercase tracking-widest text-[#00e5a8] px-3.5 py-1 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 mb-3">
            COMMAND CENTER HUD
          </span>
          <h2 className="text-4xl md:text-6xl font-space font-extrabold text-white tracking-tight mb-4">
            Interactive Enforcement <span className="gradient-mint-text">Dashboard</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl font-inter">
            Real-time multi-channel monitoring console designed for high-density checkpoint control.
          </p>
        </div>

        {/* Dashboard Mockup Container */}
        <div className="glass-luxury p-4 md:p-8 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,229,168,0.1)] relative">
          {/* Top Window Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono-tech text-slate-400 ml-2">axion_console_v5.2.exe</span>

            </div>

            {/* Interactive Mode Tabs */}
            <div className="flex items-center space-x-2 bg-black/60 p-1.5 rounded-xl border border-white/10 text-xs font-space">
              {(['overview', 'live', 'heatmaps', 'rto'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-[#00e5a8] text-[#050505] shadow-[0_0_15px_rgba(0,229,168,0.4)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono-tech">
              <span className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#00e5a8]/10 text-[#00e5a8] border border-[#00e5a8]/30">
                <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
                <span>FPS: 60.0</span>
              </span>
            </div>
          </div>

          {/* Main Dashboard Grid Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Main View (Interactive Mockup Canvas) */}
            <div className="lg:col-span-2 bg-[#080808] p-6 rounded-2xl border border-white/5 relative flex flex-col justify-between min-h-[380px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-space font-bold text-white text-lg">Active AI Inspection Canvas</h4>
                  <p className="text-slate-400 text-xs font-mono-tech">FRAME_ID: #889210 • SENSOR: MAIN_GATE_CAM_01</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono-tech font-bold">
                  MODIFIED VERDICT (98.4%)
                </span>
              </div>

              {/* Mock Bike Silhouette Canvas Area */}
              <div className="relative w-full h-56 rounded-xl bg-gradient-to-r from-slate-900 via-black to-slate-900 flex items-center justify-center border border-white/5 overflow-hidden group">
                <div className="text-center">
                  <Cpu className="w-12 h-12 text-[#00e5a8] mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-mono-tech text-slate-300">YOLOv8 SEGMENTATION & XAI GRAD-CAM ACTIVE</p>
                </div>

                {/* Floating Mock Bounding Box 1 */}
                <div className="absolute top-8 left-12 p-2 border border-[#00e5a8] bg-[#00e5a8]/10 rounded font-mono-tech text-[10px] text-[#00e5a8]">
                  [ROI_01: EXHAUST 98.7%]
                </div>
                {/* Floating Mock Bounding Box 2 */}
                <div className="absolute bottom-10 right-16 p-2 border border-[#3b82f6] bg-[#3b82f6]/10 rounded font-mono-tech text-[10px] text-[#3b82f6]">
                  [ROI_02: HANDLEBAR 94.2%]
                </div>
              </div>

              {/* Bottom Quick Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono-tech">
                  <Layers className="w-4 h-4 text-[#00e5a8]" />
                  <span>HEATMAP: GRAD-CAM V2</span>
                </div>
                <button
                  onClick={onOpenPlatform}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#00e5a8] hover:text-[#050505] text-white font-space font-bold text-xs transition-all flex items-center space-x-2"
                >
                  <span>Launch Live Scanner</span>
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Telemetry Column */}
            <div className="space-y-6">
              {/* Compliance Gauge Ring */}
              <div className="bg-[#080808] p-6 rounded-2xl border border-white/5 flex items-center space-x-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                    <circle cx="40" cy="40" r="32" stroke="#00e5a8" strokeWidth="6" fill="transparent" strokeDasharray="200" strokeDashoffset="20" strokeLinecap="round" />
                  </svg>
                  <span className="absolute font-space font-extrabold text-sm text-white">98.4%</span>
                </div>
                <div>
                  <h5 className="font-space font-bold text-white text-sm">Violation Score</h5>
                  <p className="text-slate-400 text-xs font-inter mb-1">High Severity Alert</p>
                  <span className="text-[10px] font-mono-tech text-[#00e5a8]">CMVR ARTICLE 120 CITED</span>
                </div>
              </div>

              {/* Recent Scan Queue */}
              <div className="bg-[#080808] p-6 rounded-2xl border border-white/5 space-y-3">
                <h5 className="font-space font-bold text-white text-xs uppercase tracking-wider text-slate-400">Live Detection Queue</h5>
                {mockVehicles.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs font-mono-tech">
                    <div>
                      <p className="font-bold text-white">{v.plate}</p>
                      <p className="text-[10px] text-slate-400">{v.model}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'MODIFIED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

