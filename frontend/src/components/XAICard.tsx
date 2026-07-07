"use client";

import React from 'react';
import { XAIEvaluation } from '@/lib/api';
import { ShieldAlert, AlertCircle, Info, CheckCircle2, MapPin, Scale, Eye, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

interface XAICardProps {
  data: XAIEvaluation;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
}

const severityConfig = {
  low: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Info, label: 'Low Severity' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertCircle, label: 'Moderate' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: ShieldAlert, label: 'High Severity' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', icon: ShieldAlert, label: 'CRITICAL' },
};

export const XAICard: React.FC<XAICardProps> = ({ data, showHeatmap, onToggleHeatmap }) => {
  const config = severityConfig[data.severity] || severityConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card p-6 mb-6 overflow-hidden relative group"
    >
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl font-bold text-xs uppercase ${config.bg} ${config.color}`}>
        {config.label}
      </div>

      <div className="flex items-start space-x-5">
        <div className={`${config.bg} ${config.color} p-4 rounded-2xl`}>
          <Icon className="w-8 h-8" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-xl font-bold mb-2 group-hover:primary-gradient-text transition-all">
            {data.violation}
          </h4>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            {data.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center space-x-2 text-primary mb-2 text-xs font-bold uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Legal Reasoning (RTO/CMVR)</span>
              </div>
              <p className="text-slate-300 text-sm italic">"{data.why_illegal}"</p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center space-x-2 text-accent mb-2 text-xs font-bold uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>AI Visual Evidence</span>
              </div>
              <p className="text-slate-300 text-sm">{data.visual_evidence}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs pt-4 border-t border-white/5">
            <div className="flex items-center space-x-2 text-slate-500">
              <MapPin className="w-3 h-3" />
              <span>Location: {data.location}</span>
            </div>
            <div className="font-bold text-primary flex items-center space-x-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHeatmap();
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all ${
                  showHeatmap 
                    ? 'bg-primary text-black border-primary shadow-[0_0_15px_var(--primary-glow)]' 
                    : 'bg-white/5 text-primary border-primary/30 hover:bg-primary/10'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {showHeatmap ? "Focus On" : "Show AI Focus"}
                </span>
              </button>
              <span>{data.confidence}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
