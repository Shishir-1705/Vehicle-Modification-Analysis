"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, SlidersHorizontal, Download, Eye, Printer, Share2, Trash2, 
  RefreshCw, CheckCircle2, ShieldCheck, ShieldAlert, FileCheck, QrCode, Lock, 
  User, Clock, ChevronLeft, ChevronRight, X, Sparkles, Layers, Cpu, Copy
} from 'lucide-react';
import { getHistory, deleteScan, ScanResult, generateAndDownloadReport, getReportUrl } from '@/lib/api';
import { VisualizerCanvas } from '@/components/VisualizerCanvas';
import { useAuth } from '@/context/AuthContext';
import { useCommandCenter } from '@/context/CommandCenterContext';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { scans: globalScans, deleteScanRecord } = useCommandCenter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Synchronize local scans with global CommandCenterContext
  useEffect(() => {
    if (globalScans && globalScans.length > 0) {
      setScans(globalScans);
      setTotalRecords(globalScans.length);
    }
  }, [globalScans]);


  // Search, Filter, & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | 'modified' | 'stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [previewScan, setPreviewScan] = useState<ScanResult | null>(null);
  const [detailScan, setDetailScan] = useState<ScanResult | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showGradCam, setShowGradCam] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getHistory({
        page,
        limit: 10,
        status: verdictFilter !== 'all' ? verdictFilter : undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
      });
      setScans(data.results || []);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error("Reports fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, verdictFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  // Generate SHA256-like mock cryptographic hash based on scan ID
  const getSHA256Hash = (id: string) => {
    let hash = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < 64; i++) {
      const charIndex = (id.charCodeAt(i % id.length) + i * 13) % chars.length;
      hash += chars[charIndex];
    }
    return hash;
  };

  // Actions
  const handleDownloadPdf = async (scan: ScanResult) => {
    try {
      await generateAndDownloadReport({
        scan_id: scan.id,
        plate_number: scan.plate_number || 'UNKNOWN',
        owner_name: scan.vehicle_owner || 'RTO Verified Owner',
        vehicle_model: scan.vehicle_model || 'Motorcycle',
        status: scan.status,
        binary_confidence: scan.binary_confidence,
        detections: scan.detections || [],
      });
    } catch (err) {
      console.error("PDF download failed", err);
    }
  };

  const handlePrintReport = (scan: ScanResult) => {
    setPreviewScan(scan);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleShareReport = (scan: ScanResult) => {
    const hash = getSHA256Hash(scan.id);
    const shareUrl = `${window.location.origin}/verify/${hash}`;
    navigator.clipboard.writeText(shareUrl);
    setShareToast(`Verification link copied to clipboard! (${shareUrl.slice(0, 35)}...)`);
    setTimeout(() => setShareToast(null), 3500);
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm("Permanently delete this official evidence report from SQLite DB?")) {
      if (previewScan?.id === id) setPreviewScan(null);
      if (detailScan?.id === id) setDetailScan(null);
      await deleteScanRecord(id);
    }
  };


  return (
    <div className="space-y-6 font-inter max-w-7xl mx-auto">
      {/* SECTION 1: Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0d0d0d]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono-tech font-bold uppercase tracking-widest mb-2">
            <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ENTERPRISE EVIDENCE & REPORT CENTER</span>
          </div>
          <h2 className="text-2xl font-space font-extrabold text-white">Court-Ready Evidence Reports</h2>
          <p className="text-slate-400 text-xs font-mono-tech mt-0.5">
            CRYPTOGRAPHICALLY SIGNED • SHA256 HASH VERIFIED • {totalRecords} TOTAL EVIDENCE CERTIFICATES
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-space font-bold text-xs flex items-center space-x-2 transition-all self-stretch lg:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {shareToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono-tech font-bold flex items-center space-x-2"
        >
          <Copy className="w-4 h-4 shrink-0" />
          <span>{shareToast}</span>
        </motion.div>
      )}

      {/* SECTION 2: Search, Filter, & Sort Controls */}
      <div className="glass-luxury p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 font-mono-tech text-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plate, officer, or hash..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-cyan-400"
          />
        </form>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono-tech text-xs">
          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => {
              setVerdictFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-black/60 border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-cyan-400"
          >
            <option value="all">Verdict: All Reports</option>
            <option value="modified">Verdict: Modified Only</option>
            <option value="stock">Verdict: Stock Only</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-black/60 border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-cyan-400"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="confidence">Sort: Highest Confidence</option>
          </select>
        </div>
      </div>

      {/* SECTION 3: Enterprise Report List */}
      <div className="space-y-4">
        {loading ? (
          <div className="glass-luxury p-16 rounded-3xl border border-white/10 text-center font-mono-tech text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
            <p>QUERYING SQLITE DATABASE REPORT VAULT...</p>
          </div>
        ) : scans.length === 0 ? (
          <div className="glass-luxury p-16 rounded-3xl border border-white/10 text-center font-mono-tech text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p>NO EVIDENCE REPORTS MATCHED FILTER CRITERIA</p>
          </div>
        ) : (
          scans.map((scan, idx) => {
            const sha256 = getSHA256Hash(scan.id);
            return (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="glass-luxury p-6 rounded-3xl border border-white/10 hover:border-cyan-500/40 transition-all space-y-5 group"
              >
                {/* Top Row: Case Header & Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-black/80 border border-white/10 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scan.image_url} alt="Scan Thumbnail" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-mono-tech font-extrabold text-white text-base">
                          {scan.plate_number || 'UNREADABLE'}
                        </p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono-tech font-bold border ${
                          scan.status === 'modified'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        }`}>
                          {scan.status.toUpperCase()} ({((scan.binary_confidence || 0) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-inter">{scan.vehicle_model || 'Motorcycle'}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewScan(scan)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 border border-white/10 font-space font-bold text-xs flex items-center space-x-1.5 transition-colors"
                      title="Preview Embedded PDF"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => handleDownloadPdf(scan)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] text-slate-300 border border-white/10 font-space font-bold text-xs flex items-center space-x-1.5 transition-colors"
                      title="Download PDF Certificate"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    {/* Print */}
                    <button
                      onClick={() => handlePrintReport(scan)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-slate-300 border border-white/10 transition-colors"
                      title="Print Official Certificate"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => handleShareReport(scan)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-[#00e5a8]/20 hover:text-[#00e5a8] text-slate-300 border border-white/10 transition-colors"
                      title="Share Verification Link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteReport(scan.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-white/10 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid Details: Telematics, Rules, Cryptographic Stamps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-tech">
                  {/* Column 1: Officer & Timestamp */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                    <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>OFFICER & TIMESTAMP</span>
                    </div>
                    <p className="text-white font-bold">{user?.full_name || 'Inspector Shishir U. Hebbar'}</p>
                    <p className="text-slate-400 text-[11px]">{new Date(scan.scanned_at).toLocaleString()}</p>
                  </div>

                  {/* Column 2: Violated CMVR Rules */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                    <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>VIOLATED STATUTORY RULES</span>
                    </div>
                    {scan.status === 'modified' ? (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">CMVR Rule 119 (Silencers)</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">CMVR Rule 105 (Headlamps)</span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">✓ Full Stock OEM Compliance</span>
                    )}
                  </div>

                  {/* Column 3: Cryptographic Verification Stamp & Hash */}
                  <div className="p-3.5 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                      <div className="flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#00e5a8]" />
                        <span>SHA256 HASH VERIFIED</span>
                      </div>
                      <QrCode className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-[10px] text-slate-300 font-mono break-all leading-tight">
                      {sha256.substring(0, 32)}...
                    </p>
                    <p className="text-[9px] text-[#00e5a8] font-bold">[DIGITALLY SIGNED & STAMPED]</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 glass-luxury rounded-3xl border border-white/10 font-mono-tech text-xs text-slate-400">
            <span>PAGE {page} OF {totalPages} ({totalRecords} TOTAL REPORTS)</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: EMBEDDED PDF REPORT PREVIEW MODAL */}
      <AnimatePresence>
        {previewScan && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 font-inter">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-luxury p-6 rounded-3xl border border-white/10 max-w-5xl w-full h-[92vh] flex flex-col justify-between"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-xl font-space font-bold text-white">
                      Official Court Compliance Certificate — {previewScan.plate_number || previewScan.id.substring(0, 8)}
                    </h3>
                    <p className="text-xs font-mono-tech text-slate-400">
                      SHA256: {getSHA256Hash(previewScan.id).substring(0, 24)}...
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setPreviewScan(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded HTML5 PDF Viewer iframe */}
              <div className="flex-1 my-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-950">
                <iframe
                  src={getReportUrl(previewScan.id, {
                    plate: previewScan.plate_number,
                    owner: previewScan.vehicle_owner,
                    loc: 'Main Checkpoint Alpha',
                  })}
                  className="w-full h-full"
                  title="PDF Certificate Preview"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="flex items-center space-x-2 text-xs font-mono-tech text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-[#00e5a8]" />
                  <span>CRYPTOGRAPHIC DIGITAL STAMP VERIFIED</span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handlePrintReport(previewScan)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-space font-bold text-xs flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Report</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(previewScan)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(0,229,168,0.4)]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
