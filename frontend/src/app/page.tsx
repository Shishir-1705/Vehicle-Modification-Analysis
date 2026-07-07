"use client";

import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ResultPanel } from '@/components/ResultPanel';
import { XAICard } from '@/components/XAICard';
import { VisualizerCanvas } from '@/components/VisualizerCanvas';
import { ThreeDVisualizer } from '@/components/ThreeDVisualizer';
import { LiveMonitor } from '@/components/LiveMonitor';
import { StrategicAnalytics } from '@/components/StrategicAnalytics';
import { DetectionHistory } from '@/components/DetectionHistory';
import { ScanResult, analyzeBike, Detection, checkBackendHealth, getDetailedHealth, HealthStatus } from '@/lib/api';
import { getCroppedTexture } from '@/lib/textureProcessor';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, ShieldCheck, Activity, BrainCircuit, X, Loader2, LayoutDashboard, MonitorPlay, BarChart3, History, Wifi, WifiOff, RefreshCw, Database, AlertTriangle } from 'lucide-react';

type Module = 'scanner' | 'live' | 'analytics' | 'history';

export default function Home() {
  const [currentModule, setCurrentModule] = useState<Module>('scanner');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDetectionId, setActiveDetectionId] = useState<string | null>(null);
  const [activeInspection, setActiveInspection] = useState<Detection | null>(null);
  const [inspectionTexture, setInspectionTexture] = useState<string | null>(null);
  const [isPreparing3D, setIsPreparing3D] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Backend Connection Health State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [detailedHealth, setDetailedHealth] = useState<HealthStatus | null>(null);

  const verifyHealth = React.useCallback(async () => {
    setIsCheckingHealth(true);
    const health = await getDetailedHealth();
    setIsBackendOnline(health.online);
    setDetailedHealth(health);
    setIsCheckingHealth(false);
  }, []);

  React.useEffect(() => {
    verifyHealth();
    const interval = setInterval(verifyHealth, 6000); // Check health every 6s
    return () => clearInterval(interval);
  }, [verifyHealth]);

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    setActiveInspection(null);
    setError(null);
    try {
      const data = await analyzeBike(file);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("Analysis Engine Offline. Ensure backend is running at http://127.0.0.1:8000");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInspect3D = async (detection: Detection) => {
    if (!result) return;
    setIsPreparing3D(true);
    try {
      const texture = await getCroppedTexture(result.image_url, detection.bounding_box);
      setInspectionTexture(texture);
      setActiveInspection(detection);
    } catch (err) {
      console.error("Texture processing failed", err);
    } finally {
      setIsPreparing3D(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="container mx-auto px-4 py-12 min-h-screen">
      {/* Platform Navigation */}
      <div className="flex flex-col items-center mb-16">
        <div className="flex space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md mb-8">
          {[
            { id: 'scanner',   label: 'Scanner',  icon: BrainCircuit },
            { id: 'live',      label: 'Monitor',  icon: MonitorPlay },
            { id: 'analytics', label: 'Insights', icon: BarChart3 },
            { id: 'history',   label: 'History',  icon: LayoutDashboard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentModule(tab.id as Module)}
                className={`relative flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/20 border border-primary/50 shadow-[0_0_15px_var(--primary-glow)] rounded-xl"
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-xs font-black uppercase tracking-widest relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-wrap justify-center gap-3 mb-4"
        >
          <div className="flex items-center space-x-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary-glow)]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {currentModule === 'scanner' && "Intelligence Core V5"}
              {currentModule === 'live' && "Real-Time ANPR Tracking Active"}
              {currentModule === 'analytics' && "Strategic Compliance Intelligence"}
              {currentModule === 'history' && "Detection History & Plate Search"}
            </span>
          </div>

          <button
            onClick={verifyHealth}
            disabled={isCheckingHealth}
            className={`flex items-center space-x-2 px-5 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
              isBackendOnline === true
                ? detailedHealth?.database.includes('Offline')
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : isBackendOnline === false
                ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {isCheckingHealth ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isBackendOnline === true ? (
              detailedHealth?.database.includes('Offline') ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Wifi className="w-3.5 h-3.5" />
              )
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>
              {isCheckingHealth
                ? 'Checking...'
                : isBackendOnline === true
                ? detailedHealth?.database.includes('Offline')
                  ? 'Database Offline'
                  : 'AI Engine Online'
                : isBackendOnline === false
                ? 'AI Engine Offline'
                : 'Connecting...'}
            </span>
          </button>
        </motion.div>

        {/* Database Warning Bar */}
        <AnimatePresence>
          {isBackendOnline === true && detailedHealth?.database.includes('Offline') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-4xl mb-8 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-md flex items-start space-x-4">
                <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                  <Database className="w-6 h-6 animate-bounce" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-1">
                    MongoDB Server Unreachable
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    The FastAPI backend is operational, but it cannot connect to MongoDB at <code className="text-amber-300 font-mono text-[11px] bg-white/5 px-1.5 py-0.5 rounded">mongodb://localhost:27017</code>. 
                    Analytical historical grids, RTO queries, and live scans are running in fallback mock mode.
                  </p>
                  <div className="bg-black/40 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-slate-500 mb-3 max-h-[80px] overflow-y-auto">
                    {detailedHealth?.database_error || "Connection Timeout / Server Selection Timeout Error"}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Fix:</span>
                    <code className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                      docker-compose up -d mongo
                    </code>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-center">
          Bike <span className="primary-gradient-text">ModAI</span>
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {currentModule === 'scanner' && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {!result ? (
              <div className="flex flex-col items-center">
                <FileUpload onUpload={handleUpload} isAnalyzing={isAnalyzing} />
                {error && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full max-w-5xl">
                  <div className="flex flex-col items-center text-center">
                    <BrainCircuit className="w-10 h-10 text-primary mb-4" />
                    <h4 className="font-bold mb-2">Sigmoid Core</h4>
                    <p className="text-sm text-slate-500">Detecting overlapping violations across multiple categories concurrently.</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <ShieldCheck className="w-10 h-10 text-accent mb-4" />
                    <h4 className="font-bold mb-2">Legal Verification</h4>
                    <p className="text-sm text-slate-500">Citing CMVR and Motor Vehicle Rules for every detected modification.</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Activity className="w-10 h-10 text-indigo-400 mb-4" />
                    <h4 className="font-bold mb-2">Real-time Analysis</h4>
                    <p className="text-sm text-slate-500">High-performance processing delivering structural insights in seconds.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Diagnostic Result</h2>
                    <p className="text-slate-500">Scan ID: {result.id.slice(0, 8)} • {new Date(result.scanned_at).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={resetScanner}
                    className="px-6 py-2 glass-card hover:bg-white/5 transition-colors font-semibold text-sm"
                  >
                    New Scan
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                  <div className="sticky top-12">
                    <VisualizerCanvas 
                      imageUrl={result.image_url}
                      detections={result.detections}
                      activeDetectionId={activeDetectionId}
                      showHeatmap={showHeatmap}
                      onDetectionClick={(id) => setActiveDetectionId(id === activeDetectionId ? null : id)}
                      onInspect3D={handleInspect3D}
                    />
                    {isPreparing3D && (
                      <div className="mt-4 flex items-center space-x-3 text-primary animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Optimizing 3D Texture...</span>
                      </div>
                    )}
                    {activeDetectionId && (
                      <button 
                        onClick={() => setActiveDetectionId(null)}
                        className="mt-4 flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        <X className="w-4 h-4" />
                        <span>Reset Focus Mode</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-12">
                    <ResultPanel result={result} />
                    <div>
                      <div className="flex items-center space-x-2 mb-8">
                        <div className="w-8 h-[1px] bg-primary" />
                        <h3 className="text-2xl font-black uppercase tracking-wider">Expert XAI Report</h3>
                      </div>
                      <div className="space-y-6">
                        {result.detections.map((det) => (
                          <div 
                            key={det.id} 
                            className={`transition-all duration-300 ${activeDetectionId === det.id ? 'scale-[1.02] shadow-[0_0_20px_var(--primary-glow)] rounded-3xl' : ''}`}
                            onClick={() => setActiveDetectionId(det.id)}
                          >
                            {det.explanation && (
                              <XAICard 
                                data={det.explanation} 
                                showHeatmap={showHeatmap && activeDetectionId === det.id}
                                onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {currentModule === 'live' && (
          <motion.div 
            key="live"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
          >
            <LiveMonitor />
          </motion.div>
        )}

        {currentModule === 'analytics' && (
          <motion.div 
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StrategicAnalytics latestScan={result} />
          </motion.div>
        )}

        {currentModule === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DetectionHistory />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeInspection && (
          <ThreeDVisualizer 
            detection={activeInspection}
            textureUrl={inspectionTexture}
            onClose={() => setActiveInspection(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
