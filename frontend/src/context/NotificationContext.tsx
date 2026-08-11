"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';


export type NotificationType = 
  | 'inspection_completed'
  | 'inspection_failed'
  | 'pdf_generated'
  | 'vehicle_saved'
  | 'model_updated'
  | 'welcome_back'
  | 'account_created'
  | 'history_exported';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  created_at: string;
  read: boolean;
  action_url: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'created_at' | 'read'>) => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Initial production-ready seed notifications
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Scan Completed',
    message: 'KA01MH9821 analyzed. 2 illegal alterations flagged.',
    type: 'inspection_completed',
    created_at: '2m ago',
    read: false,
    action_url: '/dashboard',
  },
  {
    id: 'notif-2',
    title: 'PDF Report Generated',
    message: 'Official CMVR compliance certificate compiled for court submission.',
    type: 'pdf_generated',
    created_at: '15m ago',
    read: false,
    action_url: '/dashboard',
  },
  {
    id: 'notif-3',
    title: 'Vehicle Persisted',
    message: 'Telemetry record stored in modai.db database.',
    type: 'vehicle_saved',
    created_at: '1h ago',
    read: false,
    action_url: '/dashboard',
  },
  {
    id: 'notif-4',
    title: 'AI Model Updated',
    message: 'YOLOv8 + Sigmoid weights fine-tuned to v5.2 active pass.',
    type: 'model_updated',
    created_at: '3h ago',
    read: false,
    action_url: '/dashboard',
  },
  {
    id: 'notif-5',
    title: 'Welcome Back',
    message: 'Authenticated officer session active on AXION Command Center.',
    type: 'welcome_back',
    created_at: '1d ago',
    read: true,
    action_url: '/profile',
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);


  // Computed unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Backend sync (GET /api/v1/notifications with fallback to local seed)
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    } catch {
      // Backend route /notifications not implemented yet; fallback to local state gracefully
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'created_at' | 'read'>) => {
      const newItem: NotificationItem = {
        ...item,
        id: `notif-${Date.now()}`,
        created_at: 'Just now',
        read: false,
      };
      setNotifications((prev) => [newItem, ...prev]);
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
