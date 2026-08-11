"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, CheckCheck, Trash2, ArrowRight, 
  CheckCircle2, AlertTriangle, FileText, Database, Sparkles, UserCheck, Download, Cpu 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, NotificationItem, NotificationType } from '@/context/NotificationContext';

export const NotificationDropdown: React.FC = () => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.action_url) {
      router.push(item.action_url);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'inspection_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'inspection_failed':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'pdf_generated':
        return <FileText className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'vehicle_saved':
        return <Database className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'model_updated':
        return <Cpu className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'welcome_back':
        return <Sparkles className="w-4 h-4 text-[#00e5a8] shrink-0" />;
      case 'account_created':
        return <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'history_exported':
        return <Download className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-[#00e5a8] shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button with Glowing Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center group"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
        
        {/* Glowing Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00e5a8] text-[#050505] font-mono-tech font-extrabold text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,168,0.8)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Framer Motion Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#080808]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden font-inter"
          >
            {/* Dropdown Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#00e5a8]" />
                <span className="font-space font-extrabold text-sm text-white tracking-tight">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00e5a8]/10 text-[#00e5a8] font-mono-tech font-bold text-[10px]">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#00e5a8] hover:bg-white/5 text-[11px] font-mono-tech flex items-center space-x-1 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 text-[11px] font-mono-tech transition-colors"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List Container */}
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                /* Elegant Empty State */
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/20 mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6 text-[#00e5a8]" />
                  </div>
                  <div>
                    <p className="font-space font-bold text-sm text-white">You're all caught up.</p>
                    <p className="text-xs text-slate-400 mt-1">No new alerts or system messages.</p>
                  </div>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-all hover:bg-white/5 ${
                      !item.read ? 'bg-[#00e5a8]/[0.03]' : ''
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold truncate ${!item.read ? 'text-white' : 'text-slate-300'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] font-mono-tech text-slate-500 shrink-0 ml-2">
                          {item.created_at}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed font-inter">
                        {item.message}
                      </p>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#00e5a8] shrink-0 mt-2 shadow-[0_0_6px_rgba(0,229,168,0.8)]" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/10 bg-white/[0.02] text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/dashboard');
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-space font-bold text-slate-300 hover:text-white flex items-center justify-center space-x-2 transition-all"
                >
                  <span>View all notifications</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00e5a8]" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
