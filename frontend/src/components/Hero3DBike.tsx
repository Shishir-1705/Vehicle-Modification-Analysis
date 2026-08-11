"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Procedural 3D Sports Bike Model with Laser Scanning Lines
function BikeModel({ mousePos }: { mousePos: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group>(null!);
  const scanLineRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Smooth mouse parallax rotation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mousePos.x * 0.4 + state.clock.getElapsedTime() * 0.2,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mousePos.y * 0.2,
        0.05
      );
    }

    // Scanning laser sweep up and down
    if (scanLineRef.current) {
      scanLineRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 1.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={1.35}>

      {/* Bike Chassis Core */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.4, 0.5, 0.7]} />
        <meshStandardMaterial color="#00e5a8" wireframe opacity={0.6} transparent />
      </mesh>

      {/* Fuel Tank */}
      <mesh position={[-0.2, 0.9, 0]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.4, 0.6, 1.2, 16]} />
        <meshStandardMaterial color="#3b82f6" wireframe opacity={0.7} transparent />
      </mesh>


      {/* Front Wheel */}
      <mesh position={[1.4, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.7, 0.12, 16, 32]} />
        <meshStandardMaterial color="#00e5a8" wireframe />
      </mesh>

      {/* Rear Wheel */}
      <mesh position={[-1.4, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.75, 0.15, 16, 32]} />
        <meshStandardMaterial color="#00e5a8" wireframe />
      </mesh>

      {/* Front Handlebars & Fork */}
      <mesh position={[1.1, 0.8, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 12]} />
        <meshStandardMaterial color="#ffffff" wireframe opacity={0.5} transparent />
      </mesh>

      {/* Exhaust Pipe System */}
      <mesh position={[-0.8, -0.2, 0.45]} rotation={[0, 0, Math.PI / 12]}>
        <cylinderGeometry args={[0.12, 0.22, 1.6, 16]} />
        <meshStandardMaterial color="#00e5a8" wireframe emissive="#00e5a8" emissiveIntensity={0.5} />
      </mesh>

      {/* Headlight Sphere */}
      <mesh position={[1.6, 0.7, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
      </mesh>

      {/* Animated AI Laser Scanning Line */}
      <mesh ref={scanLineRef} position={[0, 0, 0]}>
        <planeGeometry args={[4.2, 0.04]} />
        <meshBasicMaterial color="#00e5a8" side={THREE.DoubleSide} opacity={0.9} transparent />
      </mesh>

      {/* Glowing Energy Core Particles */}
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0.3, 0]}>
          <octahedronGeometry args={[0.35]} />
          <MeshDistortMaterial color="#00e5a8" speed={4} distort={0.4} radius={1} />
        </mesh>
      </Float>
    </group>
  );
}

export const Hero3DBike: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] flex items-center justify-center">
      {/* Ambient Glow Backplate */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00e5a8]/10 via-transparent to-[#3b82f6]/10 rounded-3xl blur-3xl pointer-events-none" />

      {/* 3D Canvas */}
      {mounted && (
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }} className="w-full h-full">
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#00e5a8" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
          <BikeModel mousePos={mousePos} />
        </Canvas>
      )}

      {/* Floating HUD Bounding Box Overlay 1 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.85, 1, 0.85], y: [0, -8, 0] }}
        transition={{ 
          opacity: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          delay: 0.5 
        }}
        className="absolute top-16 right-4 md:right-12 glass-luxury p-3.5 border border-[#00e5a8]/40 shadow-[0_0_25px_rgba(0,229,168,0.25)] rounded-2xl max-w-[210px] pointer-events-none z-10"
      >
        <div className="flex items-center justify-between text-[10px] font-mono-tech mb-1">
          <span className="text-[#00e5a8] font-bold">ROI_01: EXHAUST</span>
          <span className="text-white font-bold bg-[#00e5a8]/20 px-1.5 py-0.5 rounded">98.4%</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-200">Illegal Aftermarket Slip-On</p>
        <div className="text-[9px] font-mono-tech text-slate-400 mt-1">CMVR RULE 120 (NOISE)</div>
      </motion.div>

      {/* Floating HUD Bounding Box Overlay 2 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.85, 1, 0.85], y: [0, 8, 0] }}
        transition={{ 
          opacity: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
          delay: 0.8 
        }}
        className="absolute bottom-20 left-4 md:left-8 glass-luxury p-3.5 border border-[#3b82f6]/40 shadow-[0_0_25px_rgba(59,130,246,0.25)] rounded-2xl max-w-[220px] pointer-events-none z-10"
      >
        <div className="flex items-center justify-between text-[10px] font-mono-tech mb-1">
          <span className="text-[#3b82f6] font-bold">ROI_02: LIGHTING</span>
          <span className="text-white font-bold bg-[#3b82f6]/20 px-1.5 py-0.5 rounded">94.1%</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-200">Non-Standard LED Projector</p>
        <div className="text-[9px] font-mono-tech text-slate-400 mt-1">CMVR RULE 102 (GLARE)</div>
      </motion.div>


      {/* Live AI Scan Pulse Indicator */}
      <div className="absolute bottom-6 right-8 flex items-center space-x-2 glass-luxury px-4 py-2 border border-white/10 rounded-full font-mono-tech text-xs">
        <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-ping" />
        <span className="text-slate-300 font-bold tracking-widest text-[11px]">LIVE 3D INFERENCE RUNNING</span>
      </div>
    </div>
  );
};
