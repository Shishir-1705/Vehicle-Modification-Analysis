"use client";

import React, { Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Html, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Detection } from '@/lib/api';
import { motion } from 'framer-motion';

interface ThreeDVisualizerProps {
  textureUrl: string | null;
  detection: Detection;
  onClose: () => void;
}

const InspectionObject = ({ textureUrl, detection }: { textureUrl: string, detection: Detection }) => {
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  
  // Calculate aspect ratio for the plane
  const aspect = detection.bounding_box.w / detection.bounding_box.h;
  const size = 3; // base size in 3D units

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh castShadow receiveShadow>
          <planeGeometry args={[size * aspect, size]} />
          <meshStandardMaterial 
            map={texture} 
            side={THREE.DoubleSide} 
            transparent 
            roughness={0.5}
            metalness={0.2}
          />
          
          {/* Floating Annotation */}
          <Html position={[0, size / 2 + 0.5, 0]} center distanceFactor={10}>
            <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-primary/30 whitespace-nowrap">
              <p className="text-primary font-black text-xs uppercase tracking-widest mb-1">
                Detected Modification
              </p>
              <h4 className="text-white font-bold text-lg">
                {detection.explanation?.violation}
              </h4>
            </div>
          </Html>
        </mesh>
      </Float>

      <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
    </group>
  );
};

export const ThreeDVisualizer: React.FC<ThreeDVisualizerProps> = ({ textureUrl, detection, onClose }) => {
  if (!textureUrl) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center"
    >
      <div className="absolute top-10 right-10 z-50">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all font-bold tracking-widest uppercase text-xs"
        >
          Exit Inspection
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute left-10 bottom-10 z-50 max-w-md">
        <div className="glass-card p-6 border-l-4 border-primary">
          <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">AI Expert Diagnostic</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            {detection.explanation?.description}
          </p>
          <div className="bg-primary/10 p-4 rounded-xl">
            <p className="text-xs font-bold text-primary mb-1 uppercase">Legal Context</p>
            <p className="text-sm italic text-slate-300">"{detection.explanation?.why_illegal}"</p>
          </div>
        </div>
      </div>

      <div className="w-full h-full">
        <Canvas shadows>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} />
            <OrbitControls 
              enablePan={false} 
              autoRotate={true} 
              autoRotateSpeed={1}
              minDistance={5}
              maxDistance={12}
            />
            
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            <Environment preset="city" />

            <InspectionObject textureUrl={textureUrl} detection={detection} />
          </Suspense>
        </Canvas>
      </div>
    </motion.div>
  );
};
