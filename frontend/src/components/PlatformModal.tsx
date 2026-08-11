"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformModal: React.FC<PlatformModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto"
      >
        {/* Top Floating Close Button */}
        <div className="fixed top-4 right-6 z-50">
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-[#0d0d0d] border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shadow-2xl flex items-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span className="text-xs font-space font-bold uppercase tracking-wider hidden sm:inline">Exit Console</span>
          </button>
        </div>

        {/* Command Center Dashboard Shell */}
        <DashboardShell />
      </motion.div>
    </AnimatePresence>
  );
};

