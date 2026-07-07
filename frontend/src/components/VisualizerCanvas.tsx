"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Detection } from '@/lib/api';
import { Box, Hexagon, Maximize2, BrainCircuit } from 'lucide-react';

interface VisualizerCanvasProps {
  imageUrl: string;
  detections: Detection[];
  activeDetectionId: string | null;
  showHeatmap: boolean;
  onDetectionClick: (id: string) => void;
  onInspect3D: (detection: Detection) => void;
}

const severityColors = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // yellow-500
  low: '#3b82f6',      // blue-500
};

type ViewMode = 'bbox' | 'segmentation' | 'heatmap' | '3d';

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  imageUrl,
  detections,
  activeDetectionId,
  showHeatmap,
  onDetectionClick,
  onInspect3D
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bbox');

  const activeDetection = useMemo(() => 
    detections.find(d => d.id === activeDetectionId) || (viewMode === 'heatmap' ? detections[0] : null), 
    [detections, activeDetectionId, viewMode]
  );

  // Sync internal viewMode with external showHeatmap prop
  React.useEffect(() => {
    if (showHeatmap) setViewMode('heatmap');
  }, [showHeatmap]);

  // Derived Bounding Box (Normalized 0-100)
  const getNormalizedBox = (det: Detection) => {
    if (det.segmentation && det.segmentation.length > 0) {
      const xs = det.segmentation.map(p => p[0] * 100);
      const ys = det.segmentation.map(p => p[1] * 100);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      const w = Math.max(...xs) - x;
      const h = Math.max(...ys) - y;
      return { x, y, w, h };
    }
    // Fallback to absolute pixels if no segmentation (less accurate mapping without img dims)
    return { x: 10, y: 10, w: 20, h: 20 }; 
  };

  // Auto-Zoom Calculation
  // We want to transform the container so the active detection is centered and zoomed
  const transform = useMemo(() => {
    if (!activeDetection) return { scale: 1, x: 0, y: 0 };
    
    // Simplistic zoom logic for proof of concept
    // Ideally, calculate based on bounding box percentage
    const { x, y, w, h } = activeDetection.bounding_box;
    // Normalized center of the bounding box (this assumes the box is absolute, but our mask is normalized)
    // Actually, YOLO engine provided absolute boxes but normalized masks.
    // Let's assume the visualizer works on percentage for consistency.
    
    return { scale: 2, x: -20, y: -10 }; // Placeholder for complex math
  }, [activeDetection]);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-card group bg-black/50">
      {/* View Mode Selector */}
      <div className="absolute top-4 left-4 z-50 flex bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {[
          { id: 'bbox', label: 'Box', icon: Box },
          { id: 'segmentation', label: 'Mask', icon: Hexagon },
          { id: 'heatmap', label: 'AI Focus', icon: BrainCircuit },
          { id: '3d', label: '3D Inspect', icon: Maximize2 }
        ].map((m) => {
          const Icon = m.icon;
          const isActive = viewMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                if (m.id === '3d' && activeDetection) {
                  onInspect3D(activeDetection);
                } else {
                  setViewMode(m.id as ViewMode);
                }
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                isActive ? 'bg-primary text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
      {/* Base Image */}
      <motion.img 
        src={imageUrl} 
        alt="Analyzed Motorcycle"
        className="w-full h-full object-contain transition-all duration-700"
        animate={{
          filter: (activeDetectionId || viewMode === 'heatmap') ? 'blur(2px) brightness(0.7)' : 'blur(0px) brightness(1)',
          scale: (activeDetectionId || viewMode === 'heatmap') ? 1.05 : 1,
        }}
      />

      {/* Grad-CAM Heatmap Overlay */}
      <AnimatePresence>
        {(viewMode === 'heatmap' || showHeatmap) && activeDetection && activeDetection.heatmap && (
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.1 }}
            src={activeDetection.heatmap}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-screen"
            style={{ 
              zIndex: 10,
              // We could apply a clip-path here to mask within BB if the backend didn't already do it
              // clipPath: `inset(${y}% ${100-x-w}% ${100-y-h}% ${x}%)` 
            }}
          />
        )}
      </AnimatePresence>

      {/* SVG Interaction Layer */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <AnimatePresence>
          {detections.map((det) => {
            const isSelected = activeDetectionId === det.id;
            const isHovered = hoveredId === det.id;
            const color = severityColors[det.explanation?.severity || 'medium'];
            
            // Format polygon points from [[x,y], [x,y]] to "x,y x,y"
            const points = det.segmentation?.map(p => `${p[0] * 100},${p[1] * 100}`).join(' ');

            return (
              <g 
                key={det.id} 
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => setHoveredId(det.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onDetectionClick(det.id)}
              >
                {/* Segmentation Mask */}
                {points && (
                    <motion.polygon
                      points={points}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: (viewMode === 'segmentation' || isSelected || isHovered) ? 0.6 : 0.1,
                        fill: color,
                        stroke: color,
                        strokeWidth: (isSelected || isHovered) ? 0.5 : 0.1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={(isSelected || isHovered) ? 'filter-glow' : ''}
                      style={{ filter: (isSelected || isHovered) ? 'url(#glow)' : 'none' }}
                    />
                )}

                {/* Bounding Box Border */}
                {(() => {
                  const box = getNormalizedBox(det);
                  return (
                    <motion.rect
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: (viewMode === 'bbox' || isSelected || isHovered) ? 1 : 0,
                        stroke: color,
                      }}
                      x={box.x}
                      y={box.y}
                      width={box.w}
                      height={box.h}
                      fill="none"
                      strokeWidth="0.3"
                      strokeDasharray={isSelected ? "1,1" : "0"}
                    />
                  );
                })()}

                {/* Pulsing Glow Effect for Active */}
                {isSelected && (
                  <motion.polygon
                    points={points}
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5,
                      ease: "easeInOut"
                    }}
                    fill={color}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Focus Label */}
      <AnimatePresence>
        {activeDetection && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center space-x-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3 pr-4 border-r border-white/10">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: severityColors[activeDetection.explanation?.severity || 'medium'] }} />
              <span className="text-sm font-bold uppercase tracking-wider">{activeDetection.explanation?.violation}</span>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onInspect3D(activeDetection);
              }}
              className="flex items-center space-x-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-xl transition-all group/btn"
            >
              <Maximize2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Inspect in 3D</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
