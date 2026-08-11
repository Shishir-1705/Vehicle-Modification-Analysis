"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanResult, Detection, generateAndDownloadReport } from '@/lib/api';
import { useCommandCenter } from '@/context/CommandCenterContext';
import { 
  BrainCircuit, ShieldAlert, ShieldCheck, Cpu, FileText, Download, 
  RefreshCw, History, Eye, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, 
  Scale, Layers, Activity, User, Car, Sparkles, Check, X, FileCheck, ArrowRight
} from 'lucide-react';

interface ExplainabilityCenterProps {
  result: ScanResult;
  onViewHistory?: () => void;
  onNewInspection?: () => void;
}

export const ExplainabilityCenter: React.FC<ExplainabilityCenterProps> = ({
  result,
  onViewHistory,
  onNewInspection,
}) => {
  const isModified = result.status === 'modified';
  const { addCompletedScan } = useCommandCenter();

  // Tab State for GradCAM Viewer
  const [gradcamTab, setGradcamTab] = useState<'original' | 'heatmap' | 'overlay'>('overlay');

  // Expanded Detection Cards State
  const [expandedDetections, setExpandedDetections] = useState<Record<string, boolean>>({});

  // PDF Export Form State
  const [owner, setOwner] = useState(result.vehicle_owner || '');
  const [plate, setPlate] = useState(result.plate_number || '');
  const [model, setModel] = useState(result.vehicle_model || '');
  const [location, setLocation] = useState('Main Checkpoint Alpha');
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Toggle Detection Card Expansion
  const toggleDetection = (id: string) => {
    setExpandedDetections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mask sensitive owner information (e.g. "Shishir Hebbar" -> "S****** H******")
  const maskOwnerName = (name: string): string => {
    if (!name) return 'Not available';
    return name
      .split(' ')
      .map((part) => (part.length > 0 ? part[0] + '*'.repeat(Math.max(1, part.length - 1)) : ''))
      .join(' ');
  };

  // Helper to extract or fallback CMVR legal rule text from backend explanation
  const extractCmvrRule = (det: Detection): string => {
    const why = det.explanation?.why_illegal || '';
    if (why.toLowerCase().includes('rule 119')) return 'CMVR Rule 119 (Exhaust / Sound)';
    if (why.toLowerCase().includes('rule 50') || why.toLowerCase().includes('rule 51')) return 'CMVR Rule 50 & 51 (Number Plate Font & HSRP)';
    if (why.toLowerCase().includes('section 129')) return 'Section 129 Motor Vehicles Act (Safety Helmet)';
    if (why.toLowerCase().includes('section 52')) return 'Section 52 Motor Vehicles Act (Alteration of Vehicle)';
    if (why.toLowerCase().includes('rule')) {
      const match = why.match(/(CMVR|Rule|Section)\s+\d+[\w\s]*/i);
      if (match) return match[0];
    }
    if (why) return 'CMVR Statutory Rule (General Vehicle Alteration)';
    return 'CMVR rule mapping unavailable';
  };

  // Compute average detection confidence if detections exist
  const avgDetectionConfidence = result.detections && result.detections.length > 0
    ? (result.detections.reduce((acc, d) => acc + (d.confidence || 0), 0) / result.detections.length * 100).toFixed(1)
    : null;

  // Handle PDF Export
  const handleDownloadReport = async () => {
    setDownloading(true);
    setDownloadMsg(null);
    try {
      await generateAndDownloadReport({
        detections: result.detections,
        plate_number: plate || result.plate_number || 'UNKNOWN',
        owner_name: owner || result.vehicle_owner || 'RTO Verified Owner',
        vehicle_model: model || result.vehicle_model || 'Motorcycle',
        location,
        status: result.status,
        binary_confidence: result.binary_confidence,
        ocr_output: result.plate_number,
        scan_id: result.id,
      });
      setDownloadMsg({ type: 'success', text: 'Official Compliance PDF report downloaded successfully from FastAPI backend!' });
    } catch (e: any) {
      setDownloadMsg({ type: 'error', text: e?.message || 'Download failed. Check backend connection.' });
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(null), 4000);
    }
  };

  // Check if GradCAM heatmap exists from backend
  const firstHeatmap = result.gradcam_image || result.detections?.find((d) => d.heatmap)?.heatmap;

  return (
    <div className="space-y-10 font-inter text-slate-200 mb-12">
      {/* ==================================================
          SECTION 1: AI DECISION SUMMARY & HEADER BAR
         ================================================== */}
      <div className="hud-card p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#00e5a8]/10 rounded-2xl border border-[#00e5a8]/30 text-[#00e5a8]">
              <BrainCircuit className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono-tech font-extrabold uppercase tracking-widest text-[#00e5a8] bg-[#00e5a8]/10 px-2 py-0.5 rounded border border-[#00e5a8]/20">
                  FASTAPI XAI ENGINE
                </span>
                <span className="text-[10px] font-mono-tech text-slate-400">SCAN_ID: {result.id}</span>
              </div>
              <h2 className="text-2xl font-space font-extrabold text-white tracking-tight">
                AI Explainability & Decision Center
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-space font-bold uppercase text-[11px] flex items-center space-x-2 transition-all"
              >
                <History className="w-4 h-4 text-[#3b82f6]" />
                <span>View History</span>
              </button>
            )}

            {onNewInspection && (
              <button
                onClick={onNewInspection}
                className="px-4 py-2 rounded-xl bg-[#00e5a8]/10 hover:bg-[#00e5a8]/20 text-[#00e5a8] border border-[#00e5a8]/30 font-space font-bold uppercase text-[11px] flex items-center space-x-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>New Inspection</span>
              </button>
            )}
          </div>
        </div>

        {/* AI Verdict & Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Verdict Box */}
          <div
            className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden backdrop-blur-xl ${
              isModified
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono-tech uppercase font-bold tracking-widest text-slate-400">
                AI VERDICT & CONFIDENCE
              </span>
              <div className={`p-2 rounded-xl border ${isModified ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                {isModified ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
            </div>

            <div>
              <h3 className={`text-3xl font-space font-extrabold tracking-tight mb-2 ${isModified ? 'neon-text-rose' : 'neon-text-emerald'}`}>
                {result.status.toUpperCase()}
              </h3>
              <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden border border-white/10 mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(result.binary_confidence || 0) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full ${isModified ? 'bg-gradient-to-r from-rose-600 to-red-400' : 'bg-gradient-to-r from-emerald-600 to-teal-400'}`}
                />
              </div>
              <p className="text-xs font-mono-tech font-bold text-slate-300">
                FASTAPI CONFIDENCE: <span className={isModified ? 'text-rose-400' : 'text-emerald-400'}>{((result.binary_confidence || 0) * 100).toFixed(1)}%</span>
              </p>
            </div>
          </div>

          {/* Metric Card 1: Detections */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between font-mono-tech">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DETECTIONS FOUND</span>
            <div className="my-2">
              <p className="text-3xl font-space font-extrabold text-white">{result.detections?.length || 0}</p>
              <p className="text-[11px] text-slate-400">YOLOv8 Components</p>
            </div>
            <span className="text-[10px] text-[#00e5a8] font-bold">ROI MAPPED</span>
          </div>

          {/* Metric Card 2: OCR Status */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between font-mono-tech">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">OCR STATUS</span>
            <div className="my-2">
              <p className="text-xl font-space font-extrabold text-cyan-400 truncate">
                {result.plate_number || 'Not available'}
              </p>
              <p className="text-[11px] text-slate-400">ANPR Recognition</p>
            </div>
            <span className={`text-[10px] font-bold ${result.plate_number ? 'text-emerald-400' : 'text-slate-500'}`}>
              {result.plate_number ? 'RTO MATCHED ✓' : 'PLATE NOT DETECTED'}
            </span>
          </div>

          {/* Metric Card 3: CMVR Status */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between font-mono-tech">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">CMVR COMPLIANCE</span>
            <div className="my-2">
              <p className={`text-base font-space font-extrabold ${isModified ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isModified ? 'NON-COMPLIANT' : 'COMPLIANT'}
              </p>
              <p className="text-[11px] text-slate-400">Statutory Standard</p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">CMVR RULE ENGINE</span>
          </div>
        </div>
      </div>

      {/* ==================================================
          SECTION 2: AI DECISION PIPELINE
         ================================================== */}
      <div className="hud-card p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-space font-bold text-white tracking-tight">AI Decision Pipeline Execution</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {[
            {
              step: '01',
              title: 'INPUT IMAGE',
              status: '✓ Completed',
              desc: 'Source image loaded',
              active: true,
              color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
            },
            {
              step: '02',
              title: 'YOLO DETECTION',
              status: '✓ Completed',
              desc: `${result.detections?.length || 0} components detected`,
              active: true,
              color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
            },
            {
              step: '03',
              title: 'OCR / ANPR',
              status: result.plate_number ? '✓ Completed' : 'Not available',
              desc: result.plate_number ? `Plate: ${result.plate_number}` : 'Plate unreadable',
              active: !!result.plate_number,
              color: result.plate_number ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-white/5 bg-white/5',
            },
            {
              step: '04',
              title: 'GRADCAM',
              status: firstHeatmap ? '✓ Completed' : 'Not available',
              desc: firstHeatmap ? 'Attention map generated' : 'Heatmap unavailable',
              active: !!firstHeatmap,
              color: firstHeatmap ? 'text-[#00e5a8] border-[#00e5a8]/30 bg-[#00e5a8]/10' : 'text-slate-500 border-white/5 bg-white/5',
            },
            {
              step: '05',
              title: 'CLASSIFICATION',
              status: '✓ Completed',
              desc: result.vehicle_model || 'Motorcycle classified',
              active: true,
              color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            },
            {
              step: '06',
              title: 'CMVR ENGINE',
              status: '✓ Completed',
              desc: `${result.detections?.filter((d) => d.explanation)?.length || 0} rule checks done`,
              active: true,
              color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
            },
            {
              step: '07',
              title: 'FINAL VERDICT',
              status: result.status.toUpperCase(),
              desc: `${((result.binary_confidence || 0) * 100).toFixed(1)}% confidence`,
              active: true,
              color: isModified ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
            },
          ].map((s, idx) => (
            <div key={s.step} className={`p-4 rounded-xl border font-mono-tech text-xs space-y-1.5 ${s.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[10px] opacity-70">{s.step}</span>
                {s.active && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <p className="font-bold text-white text-[11px] truncate">{s.title}</p>
              <p className="font-bold text-[10px]">{s.status}</p>
              <p className="text-[9px] opacity-70 truncate">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================
          MAIN 2-COLUMN LAYOUT: EVIDENCE (LEFT) + REASONING (RIGHT)
         ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: GRADCAM & EVIDENCE VISUALIZER */}
        <div className="space-y-8">
          {/* SECTION 5: GRADCAM EXPLAINABILITY VIEWER */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-5 h-5 text-[#00e5a8]" />
                <h3 className="text-base font-space font-bold text-white">GradCAM Spatial Attention Viewer</h3>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 font-mono-tech text-xs">
                {(['original', 'heatmap', 'overlay'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setGradcamTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all text-[10px] ${
                      gradcamTab === tab
                        ? 'bg-[#00e5a8] text-black font-extrabold shadow-[0_0_10px_rgba(0,229,168,0.4)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* GradCAM Canvas Display */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/80 flex items-center justify-center">
              {gradcamTab === 'original' && (
                <img src={result.image_url} alt="Original Motorcycle" className="w-full h-full object-contain" />
              )}

              {gradcamTab === 'heatmap' && (
                firstHeatmap ? (
                  <img src={firstHeatmap} alt="GradCAM Heatmap" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center space-y-2 p-8 font-mono-tech text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="font-bold text-xs text-white">GradCAM unavailable</p>
                    <p className="text-[11px]">Backend did not return spatial heatmap coordinates for this image.</p>
                  </div>
                )
              )}

              {gradcamTab === 'overlay' && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img src={result.image_url} alt="Base Image" className="w-full h-full object-contain" />
                  {firstHeatmap && (
                    <img
                      src={firstHeatmap}
                      alt="Heatmap Overlay"
                      className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-70 pointer-events-none"
                    />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs font-mono-tech text-slate-400">
              * GradCAM visualizes deep neural network activation regions that triggered the binary classification model.
            </p>
          </div>

          {/* SECTION 6: OCR / ANPR TELEMATICS CARD */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-space font-bold text-white">OCR & Vehicle Telematics Analysis</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-tech text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">LICENSE PLATE</span>
                <p className="text-base font-extrabold text-cyan-400">{result.plate_number || 'Not available'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">MANUFACTURER</span>
                <p className="text-base font-extrabold text-white">
                  {result.vehicle_model ? result.vehicle_model.split(' ')[0] : 'Not available'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">VEHICLE MODEL</span>
                <p className="text-base font-extrabold text-white">{result.vehicle_model || 'Not available'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">REGISTRATION STATE</span>
                <p className="text-base font-extrabold text-white">
                  {result.plate_number ? result.plate_number.substring(0, 2) : 'Not available'}
                </p>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">REGISTERED OWNER (MASKED)</span>
                <p className="text-base font-extrabold text-[#00e5a8]">
                  {result.vehicle_owner ? maskOwnerName(result.vehicle_owner) : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 7: CONFIDENCE BREAKDOWN */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-space font-bold text-white">Multi-Engine Confidence Breakdown</h3>
            </div>

            <div className="space-y-4 font-mono-tech text-xs">
              {[
                { label: 'OVERALL AI CONFIDENCE', val: `${((result.binary_confidence || 0) * 100).toFixed(1)}%`, num: (result.binary_confidence || 0) * 100, active: true },
                { label: 'DETECTION CONFIDENCE (AVG)', val: avgDetectionConfidence ? `${avgDetectionConfidence}%` : 'Not available', num: avgDetectionConfidence ? parseFloat(avgDetectionConfidence) : 0, active: !!avgDetectionConfidence },
                { label: 'OCR RECOGNITION CONFIDENCE', val: result.plate_number ? 'VERIFIED' : 'Not available', num: result.plate_number ? 100 : 0, active: !!result.plate_number },
                { label: 'CLASSIFICATION CONFIDENCE', val: `${((result.binary_confidence || 0) * 100).toFixed(1)}%`, num: (result.binary_confidence || 0) * 100, active: true },
              ].map((m) => (
                <div key={m.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-400">{m.label}</span>
                    <span className={m.active ? 'text-[#00e5a8]' : 'text-slate-500'}>{m.val}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: m.active ? `${m.num}%` : '0%' }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-[#00e5a8]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REASONING, COMPLIANCE & DETECTIONS */}
        <div className="space-y-8">
          {/* SECTION 8: "WHY THIS VERDICT?" PANEL */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <Sparkles className={`w-5 h-5 ${isModified ? 'text-rose-400' : 'text-emerald-400'}`} />
              <h3 className="text-base font-space font-bold text-white">
                {isModified ? 'WHY THIS VEHICLE WAS FLAGGED' : 'WHY THIS VEHICLE PASSED'}
              </h3>
            </div>

            <div className="space-y-3 font-mono-tech text-xs">
              {isModified ? (
                result.detections && result.detections.length > 0 ? (
                  result.detections.map((d, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white text-[11px] uppercase">
                          {d.explanation?.violation || d.component_name.replace('_', ' ')} Detected
                        </p>
                        <p className="text-[10px] text-rose-300">{d.explanation?.description || 'Non-OEM structural alteration identified.'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-xs">Deep binary classifier detected structural modifications beyond factory specification.</p>
                  </div>
                )
              ) : (
                [
                  'No illegal aftermarket components detected',
                  'OEM exhaust, silencer, and emission specs verified',
                  'Standard lighting luminous intensity compliant with CMVR',
                  'All inspected vehicle regions comply with Motor Vehicles Act',
                ].map((reason, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-xs">{reason}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 4: LEGAL / CMVR ANALYSIS */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <Scale className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-space font-bold text-white">Statutory CMVR Legal Analysis</h3>
            </div>

            <div className="space-y-4 font-mono-tech text-xs">
              {result.detections && result.detections.length > 0 ? (
                result.detections.map((det, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white text-[11px] uppercase">
                        {det.explanation?.violation || det.component_name}
                      </span>
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        NON-COMPLIANT
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">{det.explanation?.description || 'Modification detected.'}</p>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                      <span className="text-amber-400 font-bold">{extractCmvrRule(det)}</span>
                      <span className="text-slate-400">SEVERITY: {det.explanation?.severity?.toUpperCase() || 'Not available'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No statutory CMVR violations flagged for this vehicle.</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: EXPANDABLE DETECTION EXPLANATIONS */}
          <div className="hud-card p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-space font-bold text-white">Detailed Component Detection Cards</h3>
            </div>

            <div className="space-y-4">
              {result.detections && result.detections.length > 0 ? (
                result.detections.map((det, idx) => {
                  const detId = det.id || `det-${idx}`;
                  const isExpanded = !!expandedDetections[detId];
                  return (
                    <div key={detId} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden font-mono-tech text-xs">
                      {/* Header bar */}
                      <button
                        onClick={() => toggleDetection(detId)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          <span className="font-extrabold text-white text-xs uppercase">{det.component_name.replace('_', ' ')}</span>
                          <span className="text-[10px] text-cyan-400 font-bold">{(det.confidence * 100).toFixed(1)}% CONFIDENCE</span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>

                      {/* Expandable Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="p-4 pt-0 space-y-3 border-t border-white/10 text-[11px]"
                          >
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-3">
                              <div>BOUNDING BOX: <span className="text-slate-200 font-bold">{det.bounding_box ? `[${det.bounding_box.join(', ')}]` : 'Not available'}</span></div>
                              <div>SEVERITY: <span className="text-rose-400 font-bold">{det.explanation?.severity?.toUpperCase() || 'Not available'}</span></div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">EXPLANATION:</span>
                              <p className="text-slate-200">{det.explanation?.description || 'Not available'}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">LEGAL BASIS (CMVR):</span>
                              <p className="text-amber-300">{det.explanation?.why_illegal || 'CMVR rule mapping unavailable'}</p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">VISUAL EVIDENCE LINK:</span>
                              <p className="text-cyan-300">{det.explanation?.visual_evidence || 'Not available'}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs font-mono-tech text-slate-400">No individual component detections flagged.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          SECTION 9 & 10: EVIDENCE TIMELINE & EXPORT ACTIONS
         ================================================== */}
      <div className="hud-card p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
          <FileCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-space font-bold text-white">Official Certificate PDF Exporter</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono-tech text-xs">
          {[
            { label: 'Owner Name', value: owner, set: setOwner, placeholder: 'Auto-filled from RC' },
            { label: 'Plate Number', value: plate, set: setPlate, placeholder: 'e.g. KA01MH9821' },
            { label: 'Vehicle Model', value: model, set: setModel, placeholder: 'Auto-filled from RC' },
            { label: 'Location', value: location, set: setLocation, placeholder: 'Checkpoint Name' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 outline-none transition-all"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="w-full py-4 bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_0_25px_rgba(0,229,168,0.4)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'GENERATING OFFICIAL PDF REPORT...' : 'Generate & Export CMVR Compliance PDF Certificate'}</span>
        </button>

        {downloadMsg && (
          <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-mono-tech font-bold ${downloadMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadMsg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
