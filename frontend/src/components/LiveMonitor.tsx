"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Radio, ShieldAlert, Activity, RefreshCw, Wifi, WifiOff, Settings2, X, Download, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getLiveEvents, LiveEvent,
  startVideoSession, stopVideoSession,
  getVideoStatus, setVideoSource,
  getLatestPlate, lookupVehicle, generateAndDownloadReport,
  API_BASE_URL, WS_URL
} from '@/lib/api';

const FEED_URL = `${API_BASE_URL}/video_feed`;

const severityColor: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-red-500',
  medium: 'bg-orange-400',
  low: 'bg-blue-400',
};

export const LiveMonitor: React.FC = () => {
  const [isStreaming, setIsStreaming]       = useState(false);
  const [feedAlive, setFeedAlive]           = useState(false);
  const [latency, setLatency]               = useState(0);
  const [events, setEvents]                 = useState<LiveEvent[]>([]);
  const [fps, setFps]                       = useState(0);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [sourceInput, setSourceInput]       = useState('0');
  const [sourceStatus, setSourceStatus]     = useState('');

  // ── Auto-fill state ─────────────────────────────────────────────────────
  const [detectedPlate, setDetectedPlate]   = useState<string | null>(null);
  const [plateConf, setPlateConf]           = useState(0);
  const [rcData, setRcData]                 = useState<any>(null);
  const [rcLoading, setRcLoading]           = useState(false);
  const [reportLoading, setReportLoading]   = useState(false);
  const [reportMsg, setReportMsg]           = useState<string | null>(null);
  const lastLookedUpPlate                   = useRef<string | null>(null);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Sync with backend session state on mount
  useEffect(() => {
    (async () => {
      try {
        const status = await getVideoStatus();
        setIsStreaming(status.is_active);
        if (status.source) setSourceInput(String(status.source));
      } catch {}
    })();
  }, []);

  // FPS counter via image load events
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Latency simulation + WebSockets for live events + plate polling
  useEffect(() => {
    const metricsInt = setInterval(() => setLatency(Math.floor(Math.random() * 18) + 12), 2000);
    
    // WebSocket Event Listener
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connectWebSocket = () => {
      if (!WS_URL) return;
      ws = new WebSocket(WS_URL);
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_EVENT' && payload.data) {
            setEvents(prev => {
              const merged = [payload.data, ...prev];
              const unique = Array.from(new Map(merged.map(e => [e.id, e])).values());
              return unique.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 20);
            });
          }
        } catch (e) {
          console.error("Error parsing WS event", e);
        }
      };

      ws.onclose = () => {
        // Auto-reconnect after 3 seconds
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    // Plate polling — runs every 2s, auto-fetches RC on new plate
    const plateInt = setInterval(async () => {
      if (!isStreaming) return;
      try {
        const { plate, confidence } = await getLatestPlate();
        if (plate && plate !== lastLookedUpPlate.current) {
          setDetectedPlate(plate);
          setPlateConf(confidence);
          lastLookedUpPlate.current = plate;

          // Auto-fetch RC data
          setRcLoading(true);
          try {
            const vehicle = await lookupVehicle(plate);
            setRcData(vehicle?.rc_data ?? null);
          } catch { setRcData(null); }
          finally { setRcLoading(false); }
        }
      } catch {}
    }, 2000);

    return () => { 
      clearInterval(metricsInt); 
      clearInterval(plateInt); 
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [isStreaming]);

  const handleToggleStream = async () => {
    try {
      if (isStreaming) {
        await stopVideoSession();
        setIsStreaming(false);
        setFeedAlive(false);
      } else {
        await startVideoSession();
        setIsStreaming(true);
      }
    } catch (e) {
      console.error('Stream toggle failed:', e);
    }
  };

  const handleSetSource = async () => {
    try {
      setSourceStatus('updating...');
      const res = await setVideoSource(sourceInput.trim());
      setSourceStatus(res.status === 'source_updated' ? '✅ Updated' : '❌ Failed');
      setTimeout(() => { setSourceStatus(''); setShowSourceDialog(false); }, 1500);
    } catch {
      setSourceStatus('❌ Error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Real-Time Enforcement</h2>
          <div className="flex items-center space-x-3 text-slate-500 text-sm">
            <span className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
              <span>{isStreaming ? 'AI Engine Active' : 'Engine Standby'}</span>
            </span>
            <span>•</span>
            <span>{fps} FPS</span>
            <span>•</span>
            <span>{latency}ms latency</span>
          </div>
        </div>

        <div className="flex space-x-3">
          {/* Source config button */}
          <button
            onClick={() => setShowSourceDialog(v => !v)}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 transition-all flex items-center space-x-2"
          >
            <Settings2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Source</span>
          </button>

          {/* Start / Stop */}
          <button
            onClick={handleToggleStream}
            className={`px-6 py-2 rounded-xl border font-bold uppercase text-xs tracking-widest transition-all flex items-center space-x-2 ${
              isStreaming
                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{isStreaming ? 'Stop Session' : 'Start Session'}</span>
          </button>
        </div>
      </div>

      {/* Source Dialog */}
      <AnimatePresence>
        {showSourceDialog && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 glass-card p-6 border border-primary/20 bg-primary/5"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-primary">Camera Source Configuration</h4>
              <button onClick={() => setShowSourceDialog(false)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Set to <code className="text-primary">0</code> for webcam, an RTSP URL like{' '}
              <code className="text-primary">rtsp://192.168.1.100:554/stream</code> for CCTV, or a video file path.
            </p>
            <div className="flex space-x-3">
              <input
                value={sourceInput}
                onChange={e => setSourceInput(e.target.value)}
                placeholder="0 | rtsp://... | /path/to/video.mp4"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-primary/50 outline-none"
              />
              <button
                onClick={handleSetSource}
                className="px-5 py-2.5 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all"
              >
                Apply
              </button>
            </div>
            {sourceStatus && <p className="text-xs mt-3 text-slate-400">{sourceStatus}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main video feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
            {isStreaming ? (
              <img
                ref={imgRef}
                src={FEED_URL}
                alt="Live AI Stream"
                className="w-full h-full object-cover"
                onLoad={() => { frameCountRef.current++; setFeedAlive(true); }}
                onError={() => setFeedAlive(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                <Radio className="w-12 h-12 opacity-40" />
                <p className="font-bold uppercase tracking-widest text-xs opacity-60">
                  Press Start Session to activate AI camera
                </p>
              </div>
            )}

            {/* LIVE badge */}
            {isStreaming && (
              <div className="absolute top-5 left-5 flex space-x-2">
                <div className="bg-red-600 px-3 py-1 rounded-lg flex items-center space-x-2 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">LIVE</span>
                </div>
                <div className={`px-3 py-1 rounded-lg flex items-center space-x-1 border ${feedAlive ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                  {feedAlive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span className="text-[10px] font-bold">{feedAlive ? 'FEED OK' : 'NO SIGNAL'}</span>
                </div>
              </div>
            )}

            {/* Bottom overlay */}
            <div className="absolute bottom-5 right-5 flex items-center space-x-3 text-white/30">
              <p className="text-[10px] font-mono">YOLOv8 • {fps}fps</p>
              <div className="w-px h-3 bg-white/20" />
              <p className="text-[10px] font-mono">{latency}ms</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: ShieldAlert, label: 'Alert Mode', value: 'Aggressive AI', color: 'text-primary' },
              { icon: Activity, label: 'Engine FPS', value: `${fps} FPS`, color: 'text-indigo-400' },
              { icon: RefreshCw, label: 'Sync', value: isStreaming ? 'Live' : 'Standby', color: isStreaming ? 'text-emerald-400' : 'text-slate-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card p-5 flex flex-col items-center justify-center text-center">
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</p>
                <p className={`text-xs font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Auto-fill RC Panel ─────────────────────────────────────────── */}
          <AnimatePresence>
            {detectedPlate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card p-6 border border-primary/20 bg-primary/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">
                      ✓ Plate Auto-Detected
                    </p>
                    <p className="text-2xl font-black font-mono tracking-widest text-white">
                      {detectedPlate}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Confidence: {(plateConf * 100).toFixed(1)}%
                    </p>
                  </div>
                  {rcLoading && (
                    <div className="flex items-center space-x-2 text-primary text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fetching RC...</span>
                    </div>
                  )}
                </div>

                {rcData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      ['Owner',         rcData.owner_masked],
                      ['Model',         rcData.vehicle_model],
                      ['Manufacturer',  rcData.manufacturer],
                      ['Fuel',          rcData.fuel_type],
                      ['Insurance',     rcData.insurance_valid_till],
                      ['Reg. Date',     rcData.registration_date],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[8px] font-bold uppercase text-slate-600 mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-white">{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* One-click report download */}
                <button
                  disabled={reportLoading}
                  onClick={async () => {
                    setReportLoading(true);
                    setReportMsg(null);
                    try {
                      await generateAndDownloadReport({
                        detections: [],
                        plate_number: detectedPlate,
                        owner_name: rcData?.owner_masked,
                        vehicle_model: rcData?.vehicle_model,
                        status: 'live_capture',
                        ocr_output: detectedPlate,
                      });
                      setReportMsg('✅ Report downloaded');
                    } catch (e: any) {
                      setReportMsg('❌ ' + (e?.message ?? 'Download failed'));
                    } finally {
                      setReportLoading(false);
                      setTimeout(() => setReportMsg(null), 4000);
                    }
                  }}
                  className="w-full py-3 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-xl
                             hover:shadow-[0_0_15px_var(--primary-glow)] disabled:opacity-50 transition-all
                             flex items-center justify-center space-x-2"
                >
                  {reportLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating...</span></>
                    : <><Download className="w-3.5 h-3.5" /><span>Download Compliance Report</span></>}
                </button>
                {reportMsg && (
                  <p className={`mt-2 text-xs font-medium ${reportMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {reportMsg}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Event log */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 h-full min-h-[500px] flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              AI Threat Log
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">No threats identified...</p>
                ) : (
                  events.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-white/5 border border-white/5 rounded-xl relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${severityColor[(event.severity || 'low') as keyof typeof severityColor] || 'bg-slate-500'}`} />

                      <div className="flex justify-between items-start mb-1 pl-2">
                        <p className="text-[9px] font-black uppercase tracking-tight text-slate-400">{event.type}</p>
                        <span className="text-[8px] font-mono text-slate-600">{event.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-white pl-2">{event.component}</p>
                      <p className="text-[9px] text-slate-500 pl-2 capitalize">{event.severity} severity</p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5">
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 transition-all rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-white/5">
                Export Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
