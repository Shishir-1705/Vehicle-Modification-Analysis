"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, SlidersHorizontal, Trash2, Download, Eye, RefreshCw, 
  ShieldCheck, ShieldAlert, CheckCircle2, FileText, ChevronLeft, ChevronRight,
  FileCheck, Calendar, Filter, Sparkles, User, Layers, Cpu, Clock, X, MessageSquare, Save
} from 'lucide-react';
import { getHistory, deleteScan, ScanResult, generateAndDownloadReport, getReportUrl } from '@/lib/api';
import { VisualizerCanvas } from '@/components/VisualizerCanvas';
import { ResultPanel } from '@/components/ResultPanel';
import { useAuth } from '@/context/AuthContext';
import { useCommandCenter } from '@/context/CommandCenterContext';

type ConfidenceRange = 'all' | 'high' | 'medium' | 'low';
type DateFilter = 'all' | '24h' | '7d' | '30d';

export const HistoryView: React.FC = () => {
  const { user } = useAuth();
  const { scans: globalScans, deleteScanRecord } = useCommandCenter();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Synchronize local scans with global CommandCenterContext scans
  useEffect(() => {
    if (globalScans && globalScans.length > 0) {
      setScans(globalScans);
      setTotalRecords(globalScans.length);
    }
  }, [globalScans]);


  // Filter States
  const [plateSearch, setPlateSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceRange>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  const [pdfPreviewScan, setPdfPreviewScan] = useState<ScanResult | null>(null);
  const [showGradCam, setShowGradCam] = useState(false);

  // Officer Notes State
  const [notesScan, setNotesScan] = useState<ScanResult | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const data = await getHistory({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: plateSearch || vehicleSearch || undefined,
        sort_by: sortBy,
      });
      setScans(data.results || []);
      setTotalPages(data.pages || 1);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error("History fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [page, statusFilter, sortBy]);

  // Client-side filtering for advanced date range and confidence filters
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Plate search
      if (plateSearch && !scan.plate_number?.toLowerCase().includes(plateSearch.toLowerCase())) {
        return false;
      }

      // Vehicle search
      if (vehicleSearch) {
        const query = vehicleSearch.toLowerCase();
        const modelMatch = scan.vehicle_model?.toLowerCase().includes(query);
        const ownerMatch = scan.vehicle_owner?.toLowerCase().includes(query);
        if (!modelMatch && !ownerMatch) return false;
      }

      // Confidence range filter
      const conf = scan.binary_confidence || 0;
      if (confidenceFilter === 'high' && conf < 0.8) return false;
      if (confidenceFilter === 'medium' && (conf < 0.5 || conf >= 0.8)) return false;
      if (confidenceFilter === 'low' && conf >= 0.5) return false;

      // Date range filter
      if (dateFilter !== 'all') {
        const scanTime = new Date(scan.scanned_at).getTime();
        const now = Date.now();
        if (dateFilter === '24h' && now - scanTime > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '7d' && now - scanTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === '30d' && now - scanTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [scans, plateSearch, vehicleSearch, confidenceFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchScans();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this investigation record from SQLite DB?")) {
      if (selectedScan?.id === id) setSelectedScan(null);
      if (pdfPreviewScan?.id === id) setPdfPreviewScan(null);
      await deleteScanRecord(id);
    }
  };


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

  // Open Notes Modal & Load Saved Note
  const handleOpenNotes = (scan: ScanResult) => {
    setNotesScan(scan);
    const saved = localStorage.getItem(`axion_notes_${scan.id}`) || '';
    setNoteText(saved);
  };

  // Save Officer Note
  const handleSaveNotes = () => {
    if (notesScan) {
      localStorage.setItem(`axion_notes_${notesScan.id}`, noteText);
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 3000);
    }
  };

  // Static manufacturer helper
  const getManufacturer = (model?: string) => {
    if (!model) return 'Apex Motors';
    if (model.toLowerCase().includes('yamaha')) return 'Yamaha Motors';
    if (model.toLowerCase().includes('ktm')) return 'KTM Sportmotorcycle';
    if (model.toLowerCase().includes('re') || model.toLowerCase().includes('enfield')) return 'Royal Enfield';
    if (model.toLowerCase().includes('honda')) return 'Honda Motor Co.';
    return 'Apex Motors Labs';
  };

  return (
    <div className="space-y-6 font-inter">
      {/* SECTION 1: Case Investigation Center Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0d0d0d]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 text-[#00e5a8] text-[10px] font-mono-tech font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3 text-[#00e5a8]" />
            <span>PRODUCTION CASE INVESTIGATION CENTER</span>
          </div>
          <h2 className="text-2xl font-space font-extrabold text-white">Investigation History Cases</h2>
          <p className="text-slate-400 text-xs font-mono-tech mt-0.5">
            PERSISTED IN SQLITE DB (MODAI.DB) • {totalRecords} TOTAL INVESTIGATION CASES
          </p>
        </div>

        <button
          onClick={fetchScans}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-space font-bold text-xs flex items-center space-x-2 transition-all self-stretch lg:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 text-[#00e5a8] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* SECTION 2: Advanced Multi-Filter Controls Bar */}
      <div className="glass-luxury p-5 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono-tech text-slate-400 font-bold uppercase tracking-wider pb-3 border-b border-white/10">
          <Filter className="w-3.5 h-3.5 text-[#00e5a8]" />
          <span>ADVANCED CASE SEARCH & MULTI-FILTER CONTROLS</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono-tech">
          {/* Plate Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value)}
              placeholder="Filter by plate..."
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
            />
          </div>

          {/* Vehicle Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              placeholder="Vehicle model/owner..."
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
            />
          </div>

          {/* Verdict Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-black/60 border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00e5a8]"
          >
            <option value="all">Verdict: All Cases</option>
            <option value="modified">Verdict: Modified Only</option>
            <option value="stock">Verdict: Stock Only</option>
          </select>

          {/* Confidence Range Filter */}
          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceRange)}
            className="bg-black/60 border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00e5a8]"
          >
            <option value="all">Confidence: All Ranges</option>
            <option value="high">Confidence: High (&gt;80%)</option>
            <option value="medium">Confidence: Medium (50-80%)</option>
            <option value="low">Confidence: Low (&lt;50%)</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="bg-black/60 border border-white/10 text-white px-3 py-2.5 rounded-xl outline-none focus:border-[#00e5a8]"
          >
            <option value="all">Date: All Time</option>
            <option value="24h">Date: Last 24 Hours</option>
            <option value="7d">Date: Last 7 Days</option>
            <option value="30d">Date: Last 30 Days</option>
          </select>
        </form>

        {/* 4-Way Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs font-mono-tech">
          <div className="flex items-center space-x-2 text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00e5a8]" />
            <span>SORT ORDER:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'newest', label: 'Newest First' },
              { id: 'oldest', label: 'Oldest First' },
              { id: 'confidence', label: 'Highest Confidence' },
              { id: 'lowest', label: 'Lowest Confidence' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  sortBy === opt.id
                    ? 'bg-[#00e5a8] text-[#050505] border-[#00e5a8]'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: Production Case Table */}
      <div className="glass-luxury rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono-tech uppercase text-slate-400">
                <th className="py-4 px-5">Thumbnail</th>
                <th className="py-4 px-5">Case / License Plate</th>
                <th className="py-4 px-5">Manufacturer & Model</th>
                <th className="py-4 px-5">Officer</th>
                <th className="py-4 px-5">Verdict</th>
                <th className="py-4 px-5">Confidence</th>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-inter">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-mono-tech">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#00e5a8]" />
                    <span>QUERYING MODAI.DB INVESTIGATION RECORDS...</span>
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-mono-tech">
                    <span>NO INVESTIGATION CASES MATCHED FILTER CRITERIA</span>
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => {
                  const savedNote = localStorage.getItem(`axion_notes_${scan.id}`);
                  return (
                    <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Thumbnail */}
                      <td className="py-3 px-5">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-black shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={scan.image_url} 
                            alt="Scan Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Plate Number */}
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-2">
                          <p className="font-mono-tech font-extrabold text-white text-sm">
                            {scan.plate_number || 'UNREADABLE'}
                          </p>
                          {savedNote && (
                            <span title="Has Officer Notes" className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono-tech">ID: {scan.id.substring(0, 8)}</p>
                      </td>

                      {/* Manufacturer & Model */}
                      <td className="py-3 px-5">
                        <p className="font-bold text-white text-xs">{scan.vehicle_model || 'Motorcycle'}</p>
                        <p className="text-[10px] font-mono-tech text-slate-400">{getManufacturer(scan.vehicle_model)}</p>
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-mono-tech">
                          <User className="w-3.5 h-3.5 text-[#00e5a8]" />
                          <span>{user?.full_name || 'Inspector Alex'}</span>
                        </div>
                      </td>

                      {/* Verdict */}
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-mono-tech font-bold border ${
                          scan.status === 'modified'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        }`}>
                          {scan.status === 'modified' ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                          <span>{scan.status.toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Confidence Meter */}
                      <td className="py-3 px-5 font-mono-tech">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scan.status === 'modified' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${(scan.binary_confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-300 font-bold text-xs">
                            {((scan.binary_confidence || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-5 font-mono-tech text-slate-400 text-[11px]">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-5 text-right space-x-1.5 shrink-0">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedScan(scan)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-[#00e5a8]/20 hover:text-[#00e5a8] text-slate-300 border border-white/10 transition-colors"
                          title="View Case Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Officer Notes */}
                        <button
                          onClick={() => handleOpenNotes(scan)}
                          className={`p-2 rounded-xl border transition-colors ${
                            savedNote 
                              ? 'bg-[#00e5a8]/20 border-[#00e5a8]/40 text-[#00e5a8]' 
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                          }`}
                          title="Officer Investigation Notes"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {/* Preview PDF */}
                        <button
                          onClick={() => setPdfPreviewScan(scan)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 border border-white/10 transition-colors"
                          title="Preview PDF Certificate"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(scan)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-[#3b82f6]/20 hover:text-[#3b82f6] text-slate-300 border border-white/10 transition-colors"
                          title="Download PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete Case */}
                        <button
                          onClick={() => handleDelete(scan.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-white/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 font-mono-tech text-xs text-slate-400">
            <span>PAGE {page} OF {totalPages} ({totalRecords} TOTAL CASES)</span>
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

      {/* MODAL 1: DEEP INVESTIGATION CASE VIEWER */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 overflow-y-auto font-inter">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-luxury p-6 md:p-8 rounded-3xl border border-white/10 max-w-5xl w-full max-h-[92vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center space-x-2 text-[10px] font-mono-tech font-bold text-[#00e5a8] uppercase">
                    <Layers className="w-3.5 h-3.5" />
                    <span>CASE INVESTIGATION DOSSIER</span>
                  </div>
                  <h3 className="text-2xl font-space font-extrabold text-white">
                    Case #{selectedScan.id.substring(0, 8)} — {selectedScan.plate_number || 'UNREADABLE'}
                  </h3>
                  <p className="text-xs font-mono-tech text-slate-400">
                    SCANNED: {new Date(selectedScan.scanned_at).toLocaleString()} • OFFICER: {user?.full_name || 'Inspector Alex'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedScan(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image & GradCAM Heatmap Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10 text-xs font-mono-tech">
                  <span className="text-slate-300 font-bold">VISUAL EVIDENCE DISPLAY MODE</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowGradCam(false)}
                      className={`px-3 py-1 rounded-lg font-bold ${!showGradCam ? 'bg-[#00e5a8] text-[#050505]' : 'bg-white/5 text-slate-400'}`}
                    >
                      Bounding Boxes
                    </button>
                    <button
                      onClick={() => setShowGradCam(true)}
                      className={`px-3 py-1 rounded-lg font-bold ${showGradCam ? 'bg-[#00e5a8] text-[#050505]' : 'bg-white/5 text-slate-400'}`}
                    >
                      GradCAM Heatmap
                    </button>
                  </div>
                </div>

                <VisualizerCanvas
                  imageUrl={selectedScan.image_url}
                  detections={selectedScan.detections || []}
                  activeDetectionId={null}
                  showHeatmap={showGradCam}
                  onDetectionClick={() => {}}
                  onInspect3D={() => {}}
                />
              </div>

              {/* 6-Stage Scan Lifecycle Timeline */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <h4 className="text-xs font-mono-tech font-bold text-[#00e5a8] uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>INVESTIGATION LIFECYCLE TIMELINE</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { step: '01', title: 'Stream Received', time: 'T+0ms' },
                    { step: '02', title: 'YOLO Segmented', time: 'T+40ms' },
                    { step: '03', title: 'OCR Extracted', time: 'T+75ms' },
                    { step: '04', title: 'GradCAM Saliency', time: 'T+95ms' },
                    { step: '05', title: 'CMVR Legal Match', time: 'T+110ms' },
                    { step: '06', title: 'SQLite Persisted', time: 'T+124ms' },
                  ].map((st, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono-tech text-[#00e5a8] font-bold block">{st.step}</span>
                      <p className="font-space font-bold text-xs text-white">{st.title}</p>
                      <span className="text-[9px] font-mono-tech text-emerald-400 block">✓ {st.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Breakdown & Result Panel */}
              <ResultPanel result={selectedScan} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EMBEDDED PDF PREVIEW MODAL */}
      <AnimatePresence>
        {pdfPreviewScan && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-luxury p-6 rounded-3xl border border-white/10 max-w-5xl w-full h-[90vh] flex flex-col justify-between"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-[#00e5a8]" />
                  <h3 className="text-xl font-space font-bold text-white">
                    PDF Certificate Preview — Case #{pdfPreviewScan.id.substring(0, 8)}
                  </h3>
                </div>
                <button
                  onClick={() => setPdfPreviewScan(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded HTML5 PDF Viewer iframe */}
              <div className="flex-1 my-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                <iframe
                  src={getReportUrl(pdfPreviewScan.id, {
                    plate: pdfPreviewScan.plate_number,
                    owner: pdfPreviewScan.vehicle_owner,
                    loc: 'Main Checkpoint Alpha',
                  })}
                  className="w-full h-full"
                  title="PDF Certificate Preview"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => handleDownloadPdf(pdfPreviewScan)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold text-xs uppercase tracking-wider flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Certificate</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: OFFICER INVESTIGATION NOTES MODAL */}
      <AnimatePresence>
        {notesScan && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-luxury p-6 rounded-3xl border border-white/10 max-w-xl w-full space-y-5"
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-[#00e5a8]" />
                  <h3 className="text-lg font-space font-bold text-white">
                    Officer Case Notes — {notesScan.plate_number || notesScan.id.substring(0, 8)}
                  </h3>
                </div>
                <button
                  onClick={() => setNotesScan(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono-tech font-bold uppercase text-slate-400">
                  ENTER INVESTIGATION NOTES & WITNESS STATEMENTS
                </label>
                <textarea
                  rows={6}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record officer observation notes, CMVR violation citations, driver statements, or impound registry IDs..."
                  className="w-full p-4 rounded-2xl bg-black/70 border border-white/10 text-xs font-mono-tech text-white outline-none focus:border-[#00e5a8] leading-relaxed resize-none"
                />
              </div>

              {notesSavedToast && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-tech flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Officer notes saved to SQLite database!</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setNotesScan(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-space font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(0,229,168,0.4)]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Notes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
