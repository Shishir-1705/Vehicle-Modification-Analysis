"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, ScanLine, BarChart3, Eye, Video, 
  ShieldAlert, FileSpreadsheet, History, ArrowUpRight, Sparkles 
} from 'lucide-react';

interface BentoGridProps {
  onOpenPlatform?: () => void;
}


export const BentoGrid: React.FC<BentoGridProps> = ({ onOpenPlatform }) => {
  const features = [
    {
      id: 'ai-det',
      size: 'lg:col-span-2 lg:row-span-2',
      icon: BrainCircuit,
      badge: 'SIGMOID CORE',
      title: 'AI Multi-Label Modification Engine',
      description: 'Concurrent detection of overlapping structural alterations, custom exhausts, altered handlebars, and non-compliant chassis geometries with precision confidence scoring.',
      graphic: (
        <div className="mt-6 p-4 rounded-2xl bg-black/50 border border-white/10 font-mono-tech text-xs space-y-2">
          <div className="flex justify-between items-center text-[#00e5a8]">
            <span>EXHAUST_AFTERMARKET</span>
            <span>98.7% MATCH</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00e5a8] h-full w-[98.7%]" />
          </div>
          <div className="flex justify-between items-center text-[#3b82f6]">
            <span>HANDLEBAR_CLIPON</span>
            <span>94.2% MATCH</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#3b82f6] h-full w-[94.2%]" />
          </div>
        </div>
      ),
    },
    {
      id: 'ocr',
      size: 'lg:col-span-1',
      icon: ScanLine,
      badge: 'OCR ENGINE',
      title: 'Automatic License Plate Extraction',
      description: 'High-speed OCR reads license plates under challenging lighting, angles, and rain conditions to query RTO registries.',
      graphic: null,
    },
    {
      id: 'xai',
      size: 'lg:col-span-1',
      icon: Eye,
      badge: 'GRAD-CAM XAI',
      title: 'Explainable AI Saliency Heatmaps',
      description: 'Visual evidence maps highlighting the exact pixel clusters that triggered the neural classification verdict for auditability.',
      graphic: null,
    },
    {
      id: 'rtsp',
      size: 'lg:col-span-1',
      icon: Video,
      badge: 'RTSP STREAMING',
      title: 'Real-Time Camera Integration',
      description: 'Connect live CCTV checkpoint streams to continuously inspect passing motorcycles at speed.',
      graphic: null,
    },
    {
      id: 'compliance',
      size: 'lg:col-span-2',
      icon: ShieldAlert,
      badge: 'LEGAL VERIFIER',
      title: 'Automated CMVR Compliance Rule Check',
      description: 'Maps detected alterations against Central Motor Vehicle Rules (CMVR) and automatically calculates penalty amounts and legal violation statutes.',
      graphic: (
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono-tech">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">RULE 120 (NOISE) — ₹2,000 FINE</span>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">RULE 102 (LIGHTING) — ₹1,000 FINE</span>
        </div>
      ),
    },
    {
      id: 'analytics',
      size: 'lg:col-span-1',
      icon: BarChart3,
      badge: 'BI DASHBOARD',
      title: 'Strategic Analytics',
      description: 'Track enforcement trends, violation distribution heatmaps, and peak checkpoint hours.',
      graphic: null,
    },
    {
      id: 'reports',
      size: 'lg:col-span-1',
      icon: FileSpreadsheet,
      badge: 'EXPORT ENGINE',
      title: 'PDF Report Generation',
      description: 'Generate court-ready, stamped PDF compliance reports containing bounding boxes and owner data in one click.',
      graphic: null,
    },
    {
      id: 'history',
      size: 'lg:col-span-1',
      icon: History,
      badge: 'AUDIT DB',
      title: 'Historical Record Search',
      description: 'Query historical database records by license plate number, date range, or violation severity.',
      graphic: null,
    },
  ];

  return (
    <div className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 text-[#00e5a8] text-xs font-mono-tech font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-space font-extrabold tracking-tight text-white mb-4">
            Powered by Next-Gen <span className="gradient-mint-text">AI Architecture</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl font-inter">
            An end-to-end computer vision ecosystem built specifically for transportation authorities, police enforcement, and fleet security.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={onOpenPlatform}
                className={`${feat.size} glass-luxury p-8 flex flex-col justify-between cursor-pointer group relative overflow-hidden rounded-3xl border border-white/10 hover:border-[#00e5a8]/50 transition-all shadow-lg hover:shadow-[0_10px_30px_rgba(0,229,168,0.15)]`}
              >
                {/* Glow Backdrop */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00e5a8]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#00e5a8]/40 group-hover:bg-[#00e5a8]/10 transition-all">
                      <Icon className="w-6 h-6 text-[#00e5a8] group-hover:rotate-6 transition-transform" />
                    </div>

                    <span className="text-[10px] font-mono-tech font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 group-hover:border-[#00e5a8]/30 group-hover:text-[#00e5a8] transition-colors">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-space font-bold text-white mb-2 group-hover:text-[#00e5a8] transition-colors flex items-center justify-between">
                    <span>{feat.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#00e5a8]" />
                  </h3>

                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-inter">
                    {feat.description}
                  </p>

                  {feat.graphic}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

