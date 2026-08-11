"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Sparkles, Cpu, Eye, ShieldCheck, Zap, Layers, 
  CheckCircle2, FileText, Database, Radio, Maximize, Volume2, Sparkle
} from 'lucide-react';

interface DemoSectionProps {
  onOpenDemoVideo?: () => void;
}

export const DemoSection: React.FC<DemoSectionProps> = ({ onOpenDemoVideo }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handlePlayClick = () => {
    setHasStarted(true);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    setHasStarted(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  // Requirement 5: Animated Feature Badges
  const badges = [
    { label: 'YOLOv8 Detection', color: 'text-[#00e5a8] border-[#00e5a8]/30 bg-[#00e5a8]/10' },
    { label: 'OCR Plate Recognition', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
    { label: 'GradCAM Explainability', color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
    { label: 'CMVR Compliance', color: 'text-[#00e5a8] border-[#00e5a8]/30 bg-[#00e5a8]/10' },
    { label: 'SQLite Evidence Storage', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
    { label: 'PDF Report Generation', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
    { label: 'Real-time AI', color: 'text-rose-400 border-rose-400/30 bg-rose-400/10' },
  ];

  // Requirement 6: Four Feature Cards
  const featureCards = [
    {
      num: '01',
      title: 'Computer Vision',
      desc: 'Real-time component detection.',
      icon: Cpu,
      color: 'text-[#00e5a8]',
    },
    {
      num: '02',
      title: 'OCR',
      desc: 'Automatic number plate extraction.',
      icon: Eye,
      color: 'text-cyan-400',
    },
    {
      num: '03',
      title: 'Explainable AI',
      desc: 'GradCAM visualization.',
      icon: Layers,
      color: 'text-purple-400',
    },
    {
      num: '04',
      title: 'Report Generation',
      desc: 'Court-ready PDF reports.',
      icon: FileText,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div id="demo" className="py-24 relative overflow-hidden font-inter scroll-mt-24">
      {/* Requirement 2: Soft Emerald & Neon Cyan Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[300px] bg-[#00e5a8]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Requirement 1: Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-tech font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>NEURAL INSPECTION DEMO SHOWCASE</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-space font-extrabold text-white tracking-tight">
            See <span className="gradient-mint-text">AXION in Action</span>
          </h2>

          <p className="text-slate-300 text-sm md:text-base max-w-3xl font-inter leading-relaxed">
            Experience how AXION's AI-powered vehicle inspection system detects illegal motorcycle modifications, performs OCR, generates GradCAM explanations, and produces compliance reports in real time.
          </p>
        </motion.div>

        {/* Requirement 5: Animated Feature Badges Above Video */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {badges.map((badge, idx) => (
            <motion.span
              key={idx}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`px-4 py-2 rounded-2xl border text-xs font-mono-tech font-bold shadow-md transition-all cursor-default flex items-center space-x-1.5 ${badge.color}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{badge.label}</span>
            </motion.span>
          ))}
        </motion.div>

        {/* Requirement 2 & 3: Premium Glassmorphism Video Container (88-90% width, idle glow) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-[90%] mx-auto glass-luxury p-4 md:p-6 rounded-[24px] border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.2)] relative overflow-hidden bg-[#0d0d0d]/90 backdrop-blur-2xl transition-shadow hover:shadow-[0_0_100px_rgba(6,182,212,0.3)]"
        >
          {/* Top Video Header Status Bar */}
          <div className="flex items-center justify-between px-4 py-3 mb-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono-tech">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5a8] animate-pulse" />
              <span className="text-white font-bold tracking-wider">AXION SYSTEM DEMO • AXION-DEMO.MP4</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>1080P 60FPS • SUB-120MS</span>
            </div>
          </div>

          {/* HTML5 Video Player Container */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl group">
            <video
              ref={videoRef}
              controls
              autoPlay={false}
              muted={false}
              loop={false}
              preload="metadata"
              poster="/images/demo-poster.png"
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className="w-full h-full object-cover"
            >
              <source src="/videos/axion-demo.mp4" type="video/mp4" />
              <source src="/demo/demo.mp4" type="video/mp4" />
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
              Your browser does not support HTML5 video playback.
            </video>

            {/* Requirement 4: Before Playback Cinematic Overlay */}
            <AnimatePresence>
              {!hasStarted && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40 flex flex-col items-center justify-center p-6 text-center cursor-pointer z-10"
                  onClick={handlePlayClick}
                >
                  {/* Glowing Neon Play Button */}
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-[#00e5a8] via-cyan-400 to-[#3b82f6] p-1 shadow-[0_0_50px_rgba(0,229,168,0.7)] hover:shadow-[0_0_80px_rgba(6,182,212,0.9)] transition-all flex items-center justify-center mb-4"
                  >
                    <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center hover:bg-transparent transition-colors group/play">
                      <Play className="w-8 h-8 md:w-10 md:h-10 text-[#00e5a8] group-hover/play:text-[#050505] fill-[#00e5a8] group-hover/play:fill-[#050505] ml-1 transition-colors" />
                    </div>
                  </motion.div>

                  <div className="flex items-center space-x-2 text-xs font-mono-tech text-[#00e5a8] font-bold uppercase tracking-widest mb-1">
                    <span>AXION DEMO</span>
                    <span>•</span>
                    <span className="text-cyan-400">1080P • 60FPS</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-space font-extrabold text-white tracking-tight mb-1">
                    AXION Neural Inspection Demo
                  </h3>

                  <p className="text-slate-300 text-xs md:text-sm font-inter max-w-md">
                    Watch a real AI inspection workflow.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>


        {/* Requirement 6: Four Feature Cards Displayed Under Video */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {featureCards.map((card, idx) => {
            const IconComp = card.icon;
            return (
              <motion.div
                key={card.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="glass-luxury p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-space font-extrabold text-2xl text-[#00e5a8]">{card.num}</span>
                    <div className={`p-2.5 rounded-2xl bg-white/5 ${card.color} group-hover:bg-white/10 transition-colors`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-space font-extrabold text-lg text-white group-hover:text-[#00e5a8] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-400 font-inter leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center space-x-1 text-[10px] font-mono-tech text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OPERATIONAL MODULE</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
