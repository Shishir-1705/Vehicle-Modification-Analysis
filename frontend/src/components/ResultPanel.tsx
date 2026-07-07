"use client";

import React, { useState } from 'react';
import { ScanResult } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Cpu, FileText,
  Download, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { generateAndDownloadReport } from '@/lib/api';

interface ResultPanelProps {
  result: ScanResult;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const isModified = result.status === 'modified';

  const [owner,    setOwner]    = useState(result.vehicle_owner    || '');
  const [plate,    setPlate]    = useState(result.plate_number     || '');
  const [model,    setModel]    = useState(result.vehicle_model    || '');
  const [location, setLocation] = useState('Main Entrance Checkpoint');

  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownloadReport = async () => {
    setDownloading(true);
    setDownloadMsg(null);
    try {
      await generateAndDownloadReport({
        detections:        result.detections,
        plate_number:      plate || result.plate_number,
        owner_name:        owner || result.vehicle_owner,
        vehicle_model:     model || result.vehicle_model,
        location,
        status:            result.status,
        binary_confidence: result.binary_confidence,
        ocr_output:        result.plate_number,
        scan_id:           result.id,
      });
      setDownloadMsg({ type: 'success', text: 'Report downloaded successfully!' });
    } catch (e: any) {
      setDownloadMsg({ type: 'error', text: e?.message || 'Download failed. Check backend.' });
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadMsg(null), 4000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      {/* Status Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`lg:col-span-1 p-8 rounded-3xl flex flex-col items-center justify-center text-center ${
          isModified
            ? 'bg-red-500/10 border border-red-500/20 text-red-100'
            : 'bg-green-500/10 border border-green-500/20 text-green-100'
        }`}
      >
        <div className={`p-4 rounded-full mb-6 ${isModified ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {isModified ? <ShieldAlert className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest opacity-60 mb-1">AI Verdict</h2>
        <h1 className="text-4xl font-black mb-4 tracking-tight">{result.status.toUpperCase()}</h1>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.binary_confidence * 100}%` }}
            className={`h-full ${isModified ? 'bg-red-500' : 'bg-green-500'}`}
          />
        </div>
        <p className="mt-2 text-xs font-medium opacity-60">
          Confidence: {(result.binary_confidence * 100).toFixed(1)}%
        </p>
      </motion.div>

      {/* Details + Report */}
      <div className="lg:col-span-2 glass-card p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Cpu className="text-primary w-6 h-6" />
          <h3 className="text-xl font-bold">Scan Details & Report</h3>
        </div>

        {/* Modification Scores */}
        <div className="space-y-4 mb-8">
          {Object.entries(result.modification_scores || {}).map(([label, score], idx) => (
            <div key={label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-300">
                  {label.replace('_', ' ').replace('modified', '').toUpperCase()}
                </span>
                <span className={`text-xs font-bold ${score > 0.5 ? 'text-primary' : 'text-slate-500'}`}>
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score * 100}%` }}
                  transition={{ delay: idx * 0.1 }}
                  className={`h-full bg-primary ${score > 0.7 ? 'shadow-[0_0_10px_var(--primary-glow)]' : ''}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Report form */}
        <div className="border-t border-white/5 pt-6">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Report Details</span>
            {(plate || result.plate_number) && (
              <span className="ml-auto font-mono text-primary text-[10px]">
                AUTO-FILLED ✓
              </span>
            )}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Owner Name',    value: owner,    set: setOwner,    placeholder: 'Auto-filled from OCR' },
              { label: 'Plate Number',  value: plate,    set: setPlate,    placeholder: 'e.g. KA01AB1234' },
              { label: 'Vehicle Model', value: model,    set: setModel,    placeholder: 'Auto-filled from RC data' },
              { label: 'Location',      value: location, set: setLocation, placeholder: 'Checkpoint name' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary/50 outline-none transition-all"
                />
              </div>
            ))}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="w-full py-3.5 bg-primary text-black font-black uppercase tracking-[0.15em] rounded-xl
                       hover:shadow-[0_0_20px_var(--primary-glow)] disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Compliance Report</span>
              </>
            )}
          </button>

          {/* Status message */}
          {downloadMsg && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded-xl flex items-center space-x-2 text-sm font-medium ${
                downloadMsg.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {downloadMsg.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle   className="w-4 h-4 flex-shrink-0" />}
              <span>{downloadMsg.text}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
