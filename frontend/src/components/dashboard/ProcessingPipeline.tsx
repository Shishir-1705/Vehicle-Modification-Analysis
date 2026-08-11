"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Cpu, Scan, FileText, Eye, CheckCircle2, Loader2, Sparkles 
} from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, label: 'Uploading Image', sub: 'Streaming payload to FastAPI gateway...', icon: Upload },
  { id: 2, label: 'Initializing AI Engine', sub: 'Loading YOLOv8 + Sigmoid weights...', icon: Cpu },
  { id: 3, label: 'YOLO Detection', sub: 'Segmenting component ROI bounding boxes...', icon: Scan },
  { id: 4, label: 'OCR Processing', sub: 'Extracting ANPR license plate telematics...', icon: FileText },
  { id: 5, label: 'GradCAM Generation', sub: 'Computing visual XAI saliency heatmaps...', icon: Eye },
  { id: 6, label: 'Vehicle Classification', sub: 'Matching baseline against CMVR statutes...', icon: CheckCircle2 },
  { id: 7, label: 'Generating Report', sub: 'Compiling court-ready PDF certificate...', icon: Sparkles },
];

interface ProcessingPipelineProps {
  isAnalyzing: boolean;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ isAnalyzing }) => {
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isAnalyzing) {
      setCurrentStep(1);
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= PIPELINE_STEPS.length) {
            return PIPELINE_STEPS.length;
          }
          return prev + 1;
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  const progressPercentage = Math.round((currentStep / PIPELINE_STEPS.length) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto glass-luxury p-8 rounded-3xl border border-white/10 space-y-6">
      {/* Header & Overall Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#00e5a8]/10 border border-[#00e5a8]/30">
            <Loader2 className="w-5 h-5 text-[#00e5a8] animate-spin" />
          </div>
          <div>
            <h3 className="font-space font-extrabold text-lg text-white">AXION Neural Pipeline</h3>
            <p className="text-xs text-slate-400 font-mono-tech">EXECUTING 7-STAGE INFERENCE PASS</p>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono-tech font-extrabold text-2xl text-[#00e5a8]">
            {progressPercentage}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono-tech block">INFERENCE PROGRESS</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
        <motion.div 
          className="bg-gradient-to-r from-[#00e5a8] via-[#3b82f6] to-emerald-400 h-full"
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Pipeline Steps List */}
      <div className="space-y-3 pt-2">
        {PIPELINE_STEPS.map((step) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isCurrent 
                  ? 'bg-[#00e5a8]/10 border-[#00e5a8]/40 shadow-[0_0_15px_rgba(0,229,168,0.15)]' 
                  : isCompleted
                  ? 'bg-white/[0.02] border-emerald-500/20 text-slate-300'
                  : 'bg-white/[0.01] border-white/5 opacity-40'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className={`p-2 rounded-xl border ${
                  isCurrent
                    ? 'bg-[#00e5a8]/20 border-[#00e5a8]/50 text-[#00e5a8]'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}>
                  <StepIcon className="w-4 h-4" />
                </div>

                <div>
                  <p className={`font-space font-bold text-xs ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] font-mono-tech text-slate-400">
                    {step.sub}
                  </p>
                </div>
              </div>

              {/* Status Indicator */}
              <div>
                {isCompleted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono-tech font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PASSED</span>
                  </span>
                ) : isCurrent ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#00e5a8]/20 text-[#00e5a8] text-[10px] font-mono-tech font-bold border border-[#00e5a8]/40 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>RUNNING</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-tech text-slate-600">
                    QUEUED
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
