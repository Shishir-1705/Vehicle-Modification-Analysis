"use client";

import React, { useState } from 'react';
import { ScanResult } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Cpu, FileText,
  Download, Loader2, CheckCircle2, AlertCircle, Sparkles, Database, History, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { generateAndDownloadReport } from '@/lib/api';

import { ExplainabilityCenter } from '@/components/ExplainabilityCenter';

interface ResultPanelProps {
  result: ScanResult;
  onViewHistory?: () => void;
  onNewInspection?: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ result, onViewHistory, onNewInspection }) => {
  return (
    <ExplainabilityCenter
      result={result}
      onViewHistory={onViewHistory}
      onNewInspection={onNewInspection}
    />
  );
};

