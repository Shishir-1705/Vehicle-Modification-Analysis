"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getHistory, getMetrics, deleteScan, ScanResult, PlatformMetrics } from '@/lib/api';
import { useNotifications } from '@/context/NotificationContext';

interface CommandCenterContextType {
  scans: ScanResult[];
  metrics: PlatformMetrics | null;
  latestScan: ScanResult | null;
  loading: boolean;
  addCompletedScan: (scan: ScanResult) => void;
  deleteScanRecord: (scanId: string) => Promise<boolean>;
  refreshAllData: () => Promise<void>;
  setLatestScan: (scan: ScanResult | null) => void;
}

const CommandCenterContext = createContext<CommandCenterContextType | undefined>(undefined);

export const CommandCenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Background API data fetcher
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [histData, metData] = await Promise.all([
        getHistory({ page: 1, limit: 50 }),
        getMetrics(),
      ]);
      setScans(histData.results || []);
      setMetrics(metData);
    } catch (err) {
      console.error("CommandCenter refresh failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Real-time Action: Add completed scan optimistically & trigger notifications
  const addCompletedScan = useCallback((scan: ScanResult) => {
    setLatestScan(scan);

    // 1. Optimistic Scans List Update (prepend newest scan)
    setScans((prev) => {
      const exists = prev.some((s) => s.id === scan.id);
      if (exists) return prev;
      return [scan, ...prev];
    });

    // 2. Optimistic Metrics KPI Update
    setMetrics((prev) => {
      if (!prev) {
        return {
          kpis: {
            total_scans: 1,
            modified_scans: scan.status === 'modified' ? 1 : 0,
            stock_scans: scan.status === 'stock' ? 1 : 0,
            total_detections: scan.detections?.length || 0,
            accuracy_rate: 98.4,
          },
        };
      }

      const k = prev.kpis || { total_scans: 0, modified_scans: 0, stock_scans: 0, total_detections: 0, accuracy_rate: 98.4 };
      return {
        ...prev,
        kpis: {
          ...k,
          total_scans: (k.total_scans || 0) + 1,
          modified_scans: (k.modified_scans || 0) + (scan.status === 'modified' ? 1 : 0),
          stock_scans: (k.stock_scans || 0) + (scan.status === 'stock' ? 1 : 0),
          total_detections: (k.total_detections || 0) + (scan.detections?.length || 0),
        },
      };
    });

    // 3. Generate Notification Event
    const plateText = scan.plate_number || 'UNREADABLE';
    const confText = ((scan.binary_confidence || 0) * 100).toFixed(1);
    addNotification({
      title: `Inspection Completed — ${scan.status.toUpperCase()}`,
      message: `Vehicle [${plateText}] analyzed with ${confText}% confidence. Telemetry saved to SQLite.`,
      type: 'inspection_completed',
      action_url: '/dashboard',
    });

    // 4. Background Sync with Server
    refreshAllData();
  }, [addNotification, refreshAllData]);

  // Real-time Action: Delete scan record optimistically across all views
  const deleteScanRecord = useCallback(async (scanId: string): Promise<boolean> => {
    // 1. Find scan target for metrics decrement
    const target = scans.find((s) => s.id === scanId);

    // 2. Optimistic Scans List Update (filter out target scan)
    setScans((prev) => prev.filter((s) => s.id !== scanId));
    setLatestScan((prev) => (prev?.id === scanId ? null : prev));

    // 3. Optimistic Metrics KPI Update
    if (target) {
      setMetrics((prev) => {
        if (!prev || !prev.kpis) return prev;
        const k = prev.kpis;
        return {
          ...prev,
          kpis: {
            ...k,
            total_scans: Math.max(0, (k.total_scans || 1) - 1),
            modified_scans: Math.max(0, (k.modified_scans || 0) - (target.status === 'modified' ? 1 : 0)),
            stock_scans: Math.max(0, (k.stock_scans || 0) - (target.status === 'stock' ? 1 : 0)),
            total_detections: Math.max(0, (k.total_detections || 0) - (target.detections?.length || 0)),
          },
        };
      });

      // 4. Generate Notification Event
      const plateText = target.plate_number || scanId.substring(0, 8);
      addNotification({
        title: 'Inspection Record Deleted',
        message: `Evidence certificate for vehicle [${plateText}] removed from SQLite database.`,
        type: 'vehicle_saved',
        action_url: '/dashboard',
      });
    }

    // 5. Execute Backend API Deletion
    const success = await deleteScan(scanId);
    refreshAllData();
    return success;
  }, [scans, addNotification, refreshAllData]);

  return (
    <CommandCenterContext.Provider
      value={{
        scans,
        metrics,
        latestScan,
        loading,
        addCompletedScan,
        deleteScanRecord,
        refreshAllData,
        setLatestScan,
      }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
};

export const useCommandCenter = () => {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error('useCommandCenter must be used within a CommandCenterProvider');
  }
  return context;
};
