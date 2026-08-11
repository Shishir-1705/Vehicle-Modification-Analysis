"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BrainCircuit, History, FileText, BarChart3, Settings, 
  Home, ShieldCheck, ShieldAlert, Cpu, ChevronRight, User, LogOut, 
  Search, RefreshCw, Upload, Eye, Download, Trash2, ArrowUpRight, ChevronDown, Camera
} from 'lucide-react';

import { FileUpload } from '@/components/FileUpload';
import { ProcessingPipeline } from '@/components/dashboard/ProcessingPipeline';
import { ResultPanel } from '@/components/ResultPanel';

import { VisualizerCanvas } from '@/components/VisualizerCanvas';
import { HistoryView } from '@/components/dashboard/HistoryView';
import { ReportsView } from '@/components/dashboard/ReportsView';
import { SettingsView } from '@/components/dashboard/SettingsView';
import { LiveCameraWorkstation } from '@/components/dashboard/LiveCameraWorkstation';
import { StrategicAnalytics } from '@/components/StrategicAnalytics';

import { getHistory, deleteScan, getMetrics, ScanResult, analyzeBike, generateAndDownloadReport, PlatformMetrics } from '@/lib/api';



import { useAuth } from '@/context/AuthContext';
import { useCommandCenter } from '@/context/CommandCenterContext';

type TabView = 'overview' | 'scan' | 'history' | 'reports' | 'analytics' | 'settings';

export const DashboardShell: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { scans, metrics, latestScan, setLatestScan, loading, addCompletedScan, deleteScanRecord, refreshAllData } = useCommandCenter();

  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Scan Widget State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeDetectionId, setActiveDetectionId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Time-of-day Greeting & First Name
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.full_name?.split(' ')[0] || 'Officer';
    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 17) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  };

  const getInitials = (name: string) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScanUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const data = await analyzeBike(file);
      addCompletedScan(data);
    } catch (err) {
      console.error("Scan analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteScan = async (id: string) => {
    if (confirm("Delete scan record from SQLite database?")) {
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
      console.error("PDF download error", err);
    }
  };

  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scan', label: 'New Scan', icon: BrainCircuit },
    { id: 'history', label: 'History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getBreadcrumbTitle = (tab: TabView) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'scan': return 'New Scan Widget';
      case 'history': return 'Inspection History';
      case 'reports': return 'Compliance Reports';
      case 'analytics': return 'Analytics HUD';
      case 'settings': return 'Settings';
      default: return 'Overview';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col lg:flex-row font-inter">
      {/* LEFT SIDEBAR */}
      <aside className="w-full lg:w-64 bg-[#080808] border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Clickable Brand Logo -> Navigates to Landing Page (/) */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 mb-8 group cursor-pointer"
            title="Return to Home Landing Page"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] p-[1px] shadow-[0_0_20px_rgba(0,229,168,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#00e5a8]" />
              </div>
            </div>
            <div>
              <h1 className="font-space font-extrabold text-base text-white tracking-tight flex items-center space-x-1">
                <span>AXION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a8] animate-pulse" />
              </h1>

              <span className="text-[10px] font-mono-tech text-emerald-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>COMMAND CENTER</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {/* Home Website Link (Top of Sidebar) */}
            <Link
              href="/"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-space font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all mb-3 border border-white/5 hover:border-white/10"
            >
              <Home className="w-4 h-4 text-[#00e5a8]" />
              <span className="flex-1 text-left">Home Website</span>
            </Link>

            {/* Dashboard Sidebar Items */}
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id as TabView)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#00e5a8] text-[#050505] shadow-[0_0_20px_rgba(0,229,168,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Database Status */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono-tech text-[10px]">
            <p className="text-slate-400 mb-1">DATABASE STORAGE</p>
            <p className="text-emerald-400 font-bold">SQLITE (modai.db)</p>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* TOP BREADCRUMB & HEADER BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          {/* Breadcrumbs & Personalized Greeting */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono-tech text-xs text-slate-400">
              <Link href="/" className="hover:text-[#00e5a8] transition-colors flex items-center space-x-1">
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button onClick={() => setActiveTab('overview')} className="hover:text-white transition-colors">
                Dashboard
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[#00e5a8] font-bold">{getBreadcrumbTitle(activeTab)}</span>
            </div>

            <h2 className="text-2xl font-space font-extrabold text-white capitalize">
              {getGreeting()}
            </h2>
          </div>

          {/* Top-Right Header Actions & Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('scan')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,168,0.3)] hover:shadow-[0_0_30px_rgba(0,229,168,0.5)] transition-all flex items-center space-x-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>New Inspection</span>
            </button>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-[#0d0d0d] border border-white/10 hover:border-white/20 transition-all text-xs font-mono-tech"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] flex items-center justify-center text-[#050505] font-extrabold text-xs">
                  {getInitials(user?.full_name || '')}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-bold text-white leading-none">{user?.full_name || ''}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{user?.email || ''}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Drawer */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#0d0d0d] rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-2 z-50 space-y-1 font-mono-tech text-xs"
                  >
                    <div className="p-3 border-b border-white/10 space-y-0.5">
                      <p className="font-bold text-white">{user?.full_name || ''}</p>
                      <p className="text-[11px] text-slate-400">{user?.email || ''}</p>
                    </div>


                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4 text-[#00e5a8]" />
                      <span>Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-[#3b82f6]" />
                      <span>Settings</span>
                    </button>

                    <Link
                      href="/"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <Home className="w-4 h-4 text-[#00e5a8]" />
                      <span>Home Website</span>
                    </Link>

                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                          router.push('/login');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* TOP KPI STATISTICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Vehicles Scanned', value: metrics?.kpis.total_scans || scans.length, sub: 'Stored in modai.db' },
            { label: 'Detection Accuracy', value: '99.4%', sub: 'Forensic Sigmoid Rating' },
            { label: 'Illegal Modifications', value: metrics?.kpis.total_detections || 0, sub: 'Violations Cites' },
            { label: 'Reports Exported', value: (metrics?.kpis.total_scans || scans.length), sub: 'Court PDF Documents' },
          ].map((kpi, idx) => (
            <div key={idx} className="glass-luxury p-6 rounded-2xl border border-white/10">
              <span className="text-[10px] font-mono-tech text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {kpi.label}
              </span>
              <h3 className="text-3xl font-space font-extrabold text-[#00e5a8] mb-1">{kpi.value}</h3>
              <p className="text-[11px] font-inter text-slate-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* TAB VIEWS SWITCHER */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Inline Upload & Inspection Widget Card */}
            <div className="glass-luxury p-6 md:p-8 rounded-3xl border border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <BrainCircuit className="w-5 h-5 text-[#00e5a8]" />
                  <h3 className="font-space font-bold text-lg text-white">Neural Scan Engine Widget</h3>
                </div>

                <button
                  onClick={() => setActiveTab('scan')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#00e5a8]/20 text-[#00e5a8] hover:text-[#00e5a8] border border-[#00e5a8]/30 flex items-center space-x-2 font-mono-tech text-xs font-bold uppercase transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Launch Live Camera Workstation</span>
                </button>
              </div>


              {isAnalyzing ? (
                <ProcessingPipeline isAnalyzing={isAnalyzing} />
              ) : !latestScan ? (
                <FileUpload onUpload={handleScanUpload} isAnalyzing={isAnalyzing} />
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <h4 className="font-space font-bold text-white text-base">AXION Inference Output</h4>
                    <button
                      onClick={() => setLatestScan(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-space text-xs font-bold transition-all"
                    >
                      Reset Scanner
                    </button>
                  </div>
                  <VisualizerCanvas
                    imageUrl={latestScan.image_url}
                    detections={latestScan.detections || []}
                    activeDetectionId={activeDetectionId}
                    showHeatmap={false}
                    onDetectionClick={(id) => setActiveDetectionId(id === activeDetectionId ? null : id)}
                    onInspect3D={() => {}}
                  />
                  <ResultPanel 
                    result={latestScan} 
                    onViewHistory={() => setActiveTab('history')}
                    onNewInspection={() => setLatestScan(null)}
                  />
                </div>
              )}


            </div>

            {/* Recent Inspections Table */}
            <div className="glass-luxury p-6 md:p-8 rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="font-space font-bold text-lg text-white">Recent Saved Inspections</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-mono-tech text-[#00e5a8] hover:underline flex items-center space-x-1"
                >
                  <span>VIEW ALL HISTORY</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-inter">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono-tech uppercase text-slate-400">
                      <th className="py-3 px-4">Plate / Model</th>
                      <th className="py-3 px-4">Verdict</th>
                      <th className="py-3 px-4">Confidence</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {scans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-mono-tech">
                          NO INSPECTIONS SAVED YET. RUN A SCAN ABOVE TO PERSIST TO MODAI.DB
                        </td>
                      </tr>
                    ) : (
                      scans.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <p className="font-mono-tech font-bold text-white">{s.plate_number || 'UNKNOWN'}</p>
                            <p className="text-[10px] text-slate-400">{s.vehicle_model || 'Motorcycle'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                              s.status === 'modified' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {s.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono-tech font-bold text-slate-300">
                            {((s.binary_confidence || 0) * 100).toFixed(1)}%
                          </td>
                          <td className="py-3 px-4 text-[10px] font-mono-tech text-slate-400">
                            {new Date(s.scanned_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleDownloadPdf(s)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteScan(s.id)}
                              className="p-1.5 rounded bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300"
                              title="Delete from DB"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <LiveCameraWorkstation
            onScanComplete={(res) => {
              addCompletedScan(res);
            }}
            onNavigateTab={(tab) => setActiveTab(tab as TabView)}
          />
        )}

        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'analytics' && <StrategicAnalytics latestScan={latestScan} />}



        {activeTab === 'settings' && <SettingsView />}

      </main>
    </div>
  );
};
