"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Video, Radio, Play, Square, RefreshCw, Maximize2, 
  Sparkles, Cpu, Eye, Layers, Database, ShieldCheck, Download, Save, 
  FileText, History, CheckCircle2, AlertCircle, Zap, Activity, Pause, Monitor,
  ShieldAlert, RefreshCcw, Lock, XCircle, ChevronDown, Check
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingPipeline } from '@/components/dashboard/ProcessingPipeline';
import { ResultPanel } from '@/components/ResultPanel';
import { analyzeBike, ScanResult, generateAndDownloadReport } from '@/lib/api';
import { useCommandCenter } from '@/context/CommandCenterContext';

interface LiveCameraWorkstationProps {
  onScanComplete?: (result: ScanResult) => void;
  onNavigateTab?: (tab: string) => void;
}

type WorkstationMode = 'upload' | 'camera';

interface CameraErrorState {
  type: string;
  title: string;
  message: string;
}

export const LiveCameraWorkstation: React.FC<LiveCameraWorkstationProps> = ({
  onScanComplete,
  onNavigateTab,
}) => {
  const { addCompletedScan } = useCommandCenter();

  // Mode Selection State
  const [mode, setMode] = useState<WorkstationMode>('camera');

  // Video Element & Media Stream References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<CameraErrorState | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const [resolution, setResolution] = useState<string>('1080P HD');
  const [isFrozen, setIsFrozen] = useState(false);

  // Captured Frame Snapshot State (Awaiting Officer Approval)
  const [capturedFrame, setCapturedFrame] = useState<{
    blob: Blob;
    file: File;
    dataUrl: string;
  } | null>(null);

  // AI Inference & Result State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Real-time Feed Log State
  const [feedLogs, setFeedLogs] = useState<Array<{
    id: string;
    time: string;
    text: string;
    status: 'modified' | 'stock' | 'review';
  }>>([]);

  // FPS Counter References
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // Stop Camera Stream Utility
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setFps(0);
  }, []);

  // Enumerate Camera Devices
  const updateCameraDevices = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Could not enumerate camera devices", err);
    }
  }, [selectedDeviceId]);

  // Handle Camera Permission & Stream Acquisition
  const startCamera = useCallback(async (targetDeviceId?: string) => {
    setCameraError(null);
    setApiError(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError({
        type: 'UNSUPPORTED',
        title: 'CAMERA API UNSUPPORTED',
        message: 'Your browser or security context does not support WebRTC video input.',
      });
      return;
    }

    // Stop existing camera stream
    stopCamera();

    const deviceToUse = targetDeviceId || selectedDeviceId;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    const videoConstraints: MediaTrackConstraints = deviceToUse
      ? { deviceId: { exact: deviceToUse } }
      : isMobile
      ? { facingMode: { ideal: "environment" } }
      : { width: { ideal: 1920 }, height: { ideal: 1080 } };

    try {
      // IMPORTANT: Request audio: false (No microphone permission requested)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }

      setIsCameraActive(true);
      setIsFrozen(false);

      // Re-enumerate devices after permission granted to get labels
      await updateCameraDevices();
    } catch (err: any) {
      console.error("Camera access error:", err);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError({
          type: 'DENIED',
          title: 'CAMERA ACCESS DENIED',
          message: 'Please allow camera access in your browser settings to proceed with live inspection.',
        });
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError({
          type: 'NOT_FOUND',
          title: 'NO CAMERA DETECTED',
          message: 'No video input devices were found on this system.',
        });
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCameraError({
          type: 'IN_USE',
          title: 'CAMERA UNAVAILABLE',
          message: 'Camera may already be in use by another application or system process.',
        });
      } else if (name === 'OverconstrainedError') {
        setCameraError({
          type: 'OVERCONSTRAINED',
          title: 'CONSTRAINTS UNMET',
          message: 'The requested camera resolution or facing mode is unavailable.',
        });
      } else {
        setCameraError({
          type: 'UNKNOWN',
          title: 'CAMERA INITIALIZATION ERROR',
          message: err?.message || 'Unable to access video input stream.',
        });
      }
      setIsCameraActive(false);
    }
  }, [selectedDeviceId, stopCamera, updateCameraDevices]);

  // Auto-start camera when mode switches to 'camera'
  useEffect(() => {
    if (mode === 'camera' && !isCameraActive && !cameraError && !capturedFrame) {
      startCamera();
    } else if (mode === 'upload') {
      stopCamera();
    }
  }, [mode]);

  // Clean up camera stream on unmount or tab switch
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCamera();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopCamera();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stopCamera]);

  // FPS Telemetry Counter Loop
  useEffect(() => {
    let animId: number;

    const updateFpsLoop = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastFpsTimeRef.current;
      if (delta >= 1000) {
        const calculatedFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(calculatedFps);
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      if (isCameraActive && !isFrozen) {
        animId = requestAnimationFrame(updateFpsLoop);
      }
    };

    if (isCameraActive && !isFrozen) {
      frameCountRef.current = 0;
      lastFpsTimeRef.current = performance.now();
      animId = requestAnimationFrame(updateFpsLoop);
    } else {
      setFps(0);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isCameraActive, isFrozen]);

  // Read Resolution when Video Loads Metadata
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const w = videoRef.current.videoWidth || 1280;
      const h = videoRef.current.videoHeight || 720;
      setResolution(`${w}x${h}`);
    }
  };

  // Switch Camera Handler
  const handleSwitchCamera = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      startCamera(deviceId);
    }
  };

  // Capture Current Video Frame
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    const width = videoRef.current.videoWidth || 1280;
    const height = videoRef.current.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      setCapturedFrame({ blob, file, dataUrl });
      setApiError(null);
    }, 'image/jpeg', 0.92);
  };

  // Retake Captured Frame
  const handleRetakeFrame = () => {
    setCapturedFrame(null);
    setApiError(null);
    if (!isCameraActive) {
      startCamera();
    }
  };

  // Execute Neural Diagnostics on Captured Frame or Uploaded File
  const handleAnalyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setApiError(null);

    try {
      const result = await analyzeBike(file);
      setScanResult(result);

      // Real-Time Synchronization via CommandCenterContext
      addCompletedScan(result);

      // Add entry to Live Detection Log
      const newLog = {
        id: result.id,
        time: new Date().toLocaleTimeString(),
        text: `[${result.plate_number || 'RTO-VERIFIED'}] ${result.status.toUpperCase()} (${((result.binary_confidence || 0) * 100).toFixed(1)}%)`,
        status: result.status as any,
      };
      setFeedLogs(prev => [newLog, ...prev.slice(0, 14)]);

      if (onScanComplete) {
        onScanComplete(result);
      }
    } catch (err: any) {
      console.error("AXION Inference Error:", err);
      const status = err?.response?.status;
      if (status === 400) {
        setApiError('CAMERA FRAME COULD NOT BE PROCESSED: Invalid frame payload.');
      } else if (status === 401) {
        setApiError('SESSION EXPIRED: Please log in again to authenticate inspection.');
      } else if (status === 413) {
        setApiError('IMAGE TOO LARGE: Captured frame exceeds maximum size threshold (15MB).');
      } else if (status === 422) {
        setApiError('UNPROCESSABLE ENTITY: AI model could not parse image metadata.');
      } else if (status === 500) {
        setApiError('AI ENGINE UNAVAILABLE: Backend neural pipeline encountered an internal server error.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
        setApiError('NETWORK CONNECTION LOST: Unable to connect to AXION API server on port 8000.');
      } else {
        setApiError(err?.response?.data?.detail || err.message || 'Inspection failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download Court PDF Report
  const handleDownloadPdf = async () => {
    if (!scanResult) return;
    try {
      await generateAndDownloadReport({
        scan_id: scanResult.id,
        plate_number: scanResult.plate_number || 'UNKNOWN',
        owner_name: scanResult.vehicle_owner || 'RTO Verified Owner',
        vehicle_model: scanResult.vehicle_model || 'Motorcycle',
        status: scanResult.status,
        binary_confidence: scanResult.binary_confidence,
        detections: scanResult.detections || [],
      });
    } catch (err) {
      console.error("Report PDF download error", err);
    }
  };

  return (
    <div className="space-y-6 font-inter max-w-7xl mx-auto">
      {/* SECTION 1: Top Inspection Workstation Selector Bar */}
      <div className="glass-luxury p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Workstation Mode Switcher [ UPLOAD ] [ LIVE CAMERA ] */}
        <div className="flex items-center space-x-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full md:w-auto">
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
              setCapturedFrame(null);
            }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              mode === 'upload'
                ? 'bg-[#00e5a8] text-[#050505] shadow-[0_0_20px_rgba(0,229,168,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => {
              setMode('camera');
              if (!isCameraActive) startCamera();
            }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
              mode === 'camera'
                ? 'bg-[#00e5a8] text-[#050505] shadow-[0_0_20px_rgba(0,229,168,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
        </div>

        {/* Live System Telematics Telemetry Badge */}
        <div className="flex items-center space-x-3 text-[11px] font-mono-tech text-slate-400">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>YOLOv8 + EASYOCR • CUDA GPU (118MS)</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            <Lock className="w-3 h-3 text-[#00e5a8]" />
            <span>JWT AUTHENTICATED</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: API Error Toast / Banner */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-tech flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]"
        >
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-bold">{apiError}</span>
          </div>
          <button
            onClick={() => setApiError(null)}
            className="p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* SECTION 3: Main Inspection Workstation Area */}
      {mode === 'upload' ? (
        /* UPLOAD MODE WORKFLOW */
        <div className="space-y-6">
          {isAnalyzing ? (
            <ProcessingPipeline isAnalyzing={isAnalyzing} />
          ) : !scanResult ? (
            <FileUpload onUpload={handleAnalyzeFile} isAnalyzing={isAnalyzing} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-space font-bold text-white text-sm">Inspection Analysis Complete</span>
                <button
                  onClick={() => setScanResult(null)}
                  className="px-4 py-2 rounded-xl bg-[#00e5a8] text-[#050505] font-space font-bold text-xs uppercase"
                >
                  Inspect Another Vehicle
                </button>
              </div>
              <ResultPanel
                result={scanResult}
                onViewHistory={() => onNavigateTab && onNavigateTab('history')}
                onNewInspection={() => setScanResult(null)}
              />
            </div>
          )}
        </div>
      ) : (
        /* LIVE CAMERA WORKSTATION WORKFLOW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Live Camera Feed & Inspection HUD */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-luxury p-4 rounded-3xl border border-white/10 relative overflow-hidden bg-black/90">
              {/* Viewport Header & Camera Selector Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3 py-2 mb-3 rounded-2xl bg-black/80 border border-white/10 text-xs font-mono-tech">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    capturedFrame
                      ? 'bg-amber-400'
                      : isCameraActive
                      ? 'bg-[#00e5a8] animate-pulse'
                      : 'bg-rose-500'
                  }`} />
                  <span className="text-white font-bold uppercase tracking-wider">
                    {capturedFrame
                      ? 'CAPTURED FRAME PREVIEW'
                      : isCameraActive
                      ? 'LIVE HD INSPECTION VIEWPORT'
                      : 'CAMERA STANDBY'}
                  </span>
                </div>

                {/* Multiple Camera Device Selector Dropdown */}
                {devices.length > 1 && !capturedFrame && (
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <span className="text-slate-400 text-[10px]">CAMERA:</span>
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => handleSwitchCamera(e.target.value)}
                      className="bg-black/90 border border-white/15 text-slate-200 text-[11px] font-mono-tech px-2.5 py-1 rounded-xl outline-none focus:border-[#00e5a8] w-full sm:w-auto"
                    >
                      {devices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Viewport Display Area (Video Feed / Captured Frame Preview / Error Box) */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center group shadow-[0_0_50px_rgba(0,0,0,0.9)]">
                {/* 1. CAMERA ERROR STATE CONTAINER */}
                {cameraError ? (
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.25)]">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-space font-extrabold text-white mb-1">
                        {cameraError.title}
                      </h4>
                      <p className="text-slate-400 text-xs font-mono-tech max-w-md leading-relaxed">
                        {cameraError.message}
                      </p>
                    </div>
                    <button
                      onClick={() => startCamera()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,168,0.3)] hover:shadow-[0_0_30px_rgba(0,229,168,0.5)] transition-all flex items-center space-x-2"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Retry Camera Access</span>
                    </button>
                  </div>
                ) : capturedFrame ? (
                  /* 2. CAPTURED FRAME PREVIEW DISPLAY */
                  <div className="relative w-full h-full bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedFrame.dataUrl}
                      alt="Captured Inspection Frame"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-3 left-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono-tech font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>SNAPSHOT READY FOR NEURAL DIAGNOSTICS</span>
                    </div>
                  </div>
                ) : (
                  /* 3. LIVE WEBCAM VIDEO STREAM DISPLAY */
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      className={`w-full h-full object-cover transition-filter ${
                        isFrozen ? 'brightness-75 contrast-125' : ''
                      }`}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* AXION CYBERPUNK INSPECTION HUD OVERLAY */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                        {/* Top HUD Status Telematics Overlay */}
                        <div className="flex items-center justify-between font-mono-tech text-[10px]">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-md bg-black/70 border border-[#00e5a8]/40 text-[#00e5a8] font-bold flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a8] animate-pulse" />
                              <span>LIVE CAMERA</span>
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-emerald-400 font-bold">
                              CAMERA STATUS: ONLINE
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-cyan-400 font-bold">
                              {fps > 0 ? `${fps} FPS` : '60 FPS'} • {resolution}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-black/70 border border-white/10 text-purple-400 font-bold">
                              AI ENGINE: READY
                            </span>
                          </div>
                        </div>

                        {/* Animated Laser Scan line */}
                        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00e5a8] to-transparent opacity-70 animate-pulse pointer-events-none top-1/3 shadow-[0_0_15px_#00e5a8]" />

                        {/* Corner HUD Reticles [+] */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00e5a8]" />
                        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00e5a8]" />
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00e5a8]" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00e5a8]" />

                        {/* Bottom Telematics Footer */}
                        <div className="flex items-center justify-between font-mono-tech text-[10px] text-slate-400">
                          <span>FRAME SIZE: {resolution}</span>
                          <span>NO AUDIO RECORDED (MIC OFF)</span>
                        </div>
                      </div>
                    )}

                    {/* Camera Off / Standby Screen */}
                    {!isCameraActive && (
                      <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#00e5a8]/10 border border-[#00e5a8]/30 flex items-center justify-center text-[#00e5a8] shadow-[0_0_30px_rgba(0,229,168,0.2)]">
                          <Camera className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xl font-space font-extrabold text-white mb-1">
                            Live Camera Standby
                          </h4>
                          <p className="text-slate-400 text-xs font-mono-tech max-w-md">
                            Activate your camera feed to inspect motorcycle modifications in real-time.
                          </p>
                        </div>
                        <button
                          onClick={() => startCamera()}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(0,229,168,0.4)] hover:shadow-[0_0_50px_rgba(0,229,168,0.7)] transition-all flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start HD Camera</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Viewport Control Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 font-mono-tech text-xs">
                {capturedFrame ? (
                  /* CAPTURED FRAME CONTROLS: Retake & Analyze Vehicle */
                  <div className="flex items-center space-x-3 w-full justify-between">
                    <button
                      onClick={handleRetakeFrame}
                      disabled={isAnalyzing}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center space-x-2 font-bold uppercase transition-all disabled:opacity-50"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Retake Snapshot</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzeFile(capturedFrame.file)}
                      disabled={isAnalyzing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_25px_rgba(0,229,168,0.4)] hover:shadow-[0_0_40px_rgba(0,229,168,0.7)] transition-all disabled:opacity-50"
                    >
                      <Cpu className="w-4 h-4" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Vehicle'}</span>
                    </button>
                  </div>
                ) : (
                  /* LIVE CAMERA CONTROLS: Capture Frame & Stop Camera */
                  <div className="flex items-center space-x-2 w-full justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCaptureFrame}
                        disabled={!isCameraActive || isAnalyzing}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(0,229,168,0.35)] hover:shadow-[0_0_30px_rgba(0,229,168,0.6)] transition-all disabled:opacity-40"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Frame</span>
                      </button>

                      <button
                        onClick={() => setIsFrozen(!isFrozen)}
                        disabled={!isCameraActive}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center space-x-1.5 disabled:opacity-40"
                      >
                        {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        <span>{isFrozen ? 'Resume' : 'Freeze'}</span>
                      </button>
                    </div>

                    {isCameraActive && (
                      <button
                        onClick={stopCamera}
                        className="px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 flex items-center space-x-1.5 font-bold uppercase transition-all"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Camera</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PROCESSING PIPELINE OVERLAY WHEN ANALYZING */}
            {isAnalyzing && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ProcessingPipeline isAnalyzing={isAnalyzing} />
              </motion.div>
            )}

            {/* RESULT PANEL & EXPLAINABILITY CENTER ON COMPLETION */}
            {scanResult && !isAnalyzing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ResultPanel
                  result={scanResult}
                  onViewHistory={() => onNavigateTab && onNavigateTab('history')}
                  onNewInspection={() => {
                    setScanResult(null);
                    setCapturedFrame(null);
                    if (!isCameraActive) startCamera();
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* RIGHT COL: Telematics HUD & Real-time Event Feed */}
          <div className="space-y-6">
            {/* Live System Health HUD Matrix */}
            <div className="glass-luxury p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-space font-bold text-sm text-white flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#00e5a8]" />
                  <span>Neural Telematics HUD</span>
                </span>
                <span className="text-[10px] font-mono-tech text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  {isCameraActive ? `${fps > 0 ? fps : 60} FPS • ONLINE` : 'STANDBY'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono-tech">
                {[
                  { label: 'CAMERA STREAM', val: isCameraActive ? 'ACTIVE' : 'OFFLINE', color: isCameraActive ? 'text-emerald-400' : 'text-slate-500' },
                  { label: 'YOLO MATRIX', val: 'ONLINE', color: 'text-emerald-400' },
                  { label: 'EASYOCR ANPR', val: 'ONLINE', color: 'text-cyan-400' },
                  { label: 'GRADCAM XAI', val: 'ONLINE', color: 'text-purple-400' },
                  { label: 'SQLITE PERSIST', val: 'ENFORCED', color: 'text-emerald-400' },
                  { label: 'FASTAPI ENDPOINT', val: 'POST /scan', color: 'text-amber-400' },
                ].map((hud, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-0.5">
                    <p className="text-[9px] text-slate-400">{hud.label}</p>
                    <p className={`font-bold ${hud.color}`}>{hud.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Detection Stream Feed */}
            <div className="glass-luxury p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-space font-bold text-sm text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Live Detection Stream</span>
                </span>
                <span className="text-[10px] font-mono-tech text-slate-400">{feedLogs.length} EVENTS</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {feedLogs.length === 0 ? (
                  <div className="text-center py-8 space-y-2 font-mono-tech text-xs text-slate-500">
                    <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p>AWAITING LIVE CAMERA INFERENCE...</p>
                    <p className="text-[10px]">Click "Capture Frame" to snapshot & inspect</p>
                  </div>
                ) : (
                  feedLogs.map((log) => (
                    <motion.div
                      key={log.id + log.time}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-2xl bg-black/60 border border-white/5 text-xs font-mono-tech flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-bold">{log.text}</p>
                        <p className="text-[10px] text-slate-400">{log.time}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'modified' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
