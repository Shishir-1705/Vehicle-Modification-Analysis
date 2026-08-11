"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Cpu, Scan, Database, Brain, ShieldCheck, MonitorPlay, ArrowRight } from 'lucide-react';

export const PipelineDiagram: React.FC = () => {
  const steps = [
    { id: 'cam', icon: Camera, title: 'RTSP Camera Stream', detail: '1080p 60fps Input' },
    { id: 'yolo', icon: Cpu, title: 'YOLOv8 ROI Detection', detail: 'Bounding Box Extraction' },
    { id: 'ocr', icon: Scan, title: 'EasyOCR Engine', detail: 'License Plate Text' },
    { id: 'api', icon: Database, title: 'RTO Metadata API', detail: 'Vehicle Registration' },
    { id: 'fusion', icon: Brain, title: 'AI Fusion Core', detail: 'Multi-Label Sigmoid' },
    { id: 'rules', icon: ShieldCheck, title: 'Compliance Engine', detail: 'CMVR Penalty Mapping' },
    { id: 'hud', icon: MonitorPlay, title: 'Dashboard HUD', detail: 'PDF & Real-time Alerts' },
  ];

  return (
    <section id="pipeline" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-xs font-mono-tech font-bold uppercase tracking-widest text-[#00e5a8] px-3.5 py-1 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 mb-3">
            DEEP TECH ARCHITECTURE
          </span>
          <h2 className="text-4xl md:text-6xl font-space font-extrabold text-white tracking-tight mb-4">
            End-to-End <span className="gradient-mint-text">AI Inference Pipeline</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl font-inter">
            Sub-120ms multi-stage computer vision workflow powering high-throughput vehicle inspection.
          </p>
        </div>

        {/* Pipeline Flow Diagram Container */}
        <div className="glass-luxury p-8 border border-white/10 rounded-3xl overflow-x-auto">
          <div className="min-w-[800px] flex items-center justify-between relative py-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  {/* Step Node */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex flex-col items-center text-center group cursor-pointer relative z-10"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-black/80 border border-white/10 group-hover:border-[#00e5a8] group-hover:bg-[#00e5a8]/10 group-hover:shadow-[0_0_25px_rgba(0,229,168,0.3)] transition-all flex items-center justify-center mb-3">
                      <Icon className="w-7 h-7 text-[#00e5a8]" />
                    </div>
                    <h5 className="font-space font-bold text-white text-xs mb-0.5">{step.title}</h5>
                    <span className="text-[10px] font-mono-tech text-slate-400">{step.detail}</span>
                  </motion.div>

                  {/* Connecting Connector Line (except for last item) */}
                  {idx < steps.length - 1 && (
                    <div className="flex-1 relative flex items-center justify-center px-2">
                      <div className="w-full h-[2px] bg-gradient-to-r from-white/10 via-[#00e5a8]/40 to-white/10" />
                      <motion.div
                        animate={{ x: [0, 40, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute w-2 h-2 rounded-full bg-[#00e5a8] shadow-[0_0_8px_#00e5a8]"
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
