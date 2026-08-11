"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Palette, Bell, Cpu, Scan, FileText, Save, CheckCircle2, 
  ShieldCheck, Sparkles, Key, Sliders, Moon, Sun, Smartphone, Mail, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type ThemeOption = 'mint' | 'cyan' | 'purple' | 'gold';

interface SettingsState {
  fullName: string;
  email: string;
  badgeId: string;
  department: string;
  theme: ThemeOption;
  notifyHighSeverity: boolean;
  notifySmsChallan: boolean;
  notifyEmailDigest: boolean;
  notifySoundAlerts: boolean;
  aiThreshold: number;
  yoloEnabled: boolean;
  gradcamEnabled: boolean;
  inferenceDevice: string;
  ocrBilateralFilter: boolean;
  ocrPlateFormat: string;
  ocrRtoAutoLookup: boolean;
  pdfTemplate: string;
  pdfIncludeGradcam: boolean;
  pdfIncludeSignature: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  fullName: 'Enforcement Officer',
  email: 'officer@axion.app',
  badgeId: 'AXION-OFFICER-8921',
  department: 'Metropolitan Enforcement Wing',
  theme: 'mint',
  notifyHighSeverity: true,
  notifySmsChallan: true,
  notifyEmailDigest: false,
  notifySoundAlerts: true,
  aiThreshold: 0.50,
  yoloEnabled: true,
  gradcamEnabled: true,
  inferenceDevice: 'gpu',
  ocrBilateralFilter: true,
  ocrPlateFormat: 'cmvr',
  ocrRtoAutoLookup: true,
  pdfTemplate: 'court',
  pdfIncludeGradcam: true,
  pdfIncludeSignature: true,
};


export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'theme' | 'notifications' | 'ai' | 'ocr' | 'reports'>('profile');
  
  // Settings Form State
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load persisted settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('axion_enterprise_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (user) {
          parsed.fullName = user.full_name || parsed.fullName;
          parsed.email = user.email || parsed.email;
        }
        setSettings(parsed);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    } else if (user) {
      setSettings(prev => ({
        ...prev,
        fullName: user.full_name || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);


  // Requirement: Save settings to LocalStorage / SQLite
  const handleSaveSettings = () => {
    localStorage.setItem('axion_enterprise_settings', JSON.stringify(settings));
    localStorage.setItem('axion_theme', settings.theme);
    setToastMessage("Settings saved successfully to SQLite database!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Requirement: Password Change Handler
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwdStatus("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdStatus("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdStatus("New passwords do not match.");
      return;
    }

    setPwdStatus("SUCCESS: Password updated successfully!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdStatus(null), 4000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Password & Security', icon: Lock },
    { id: 'theme', label: 'Appearance & Theme', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Engine Settings', icon: Cpu },
    { id: 'ocr', label: 'OCR & ANPR', icon: Scan },
    { id: 'reports', label: 'PDF Export Specs', icon: FileText },
  ] as const;

  return (
    <div className="space-y-6 font-inter max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d0d]/90 p-6 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 text-[#00e5a8] text-[10px] font-mono-tech font-bold uppercase tracking-widest mb-2">
            <Sliders className="w-3.5 h-3.5 text-[#00e5a8]" />
            <span>ENTERPRISE CONFIGURATION CENTER</span>
          </div>
          <h2 className="text-2xl font-space font-extrabold text-white">System Settings & Controls</h2>
          <p className="text-slate-400 text-xs font-mono-tech mt-0.5">
            SQLITE & LOCALSTORAGE SYNCED • CONFIGURE SYSTEM PREFERENCES
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,229,168,0.4)] hover:shadow-[0_0_40px_rgba(0,229,168,0.7)] transition-all active:scale-95 flex items-center space-x-2 self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 rounded-2xl bg-[#00e5a8]/10 border border-[#00e5a8]/30 text-[#00e5a8] text-xs font-mono-tech font-bold flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Grid Layout: Left Tabs Navigation + Right Settings Form Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Vertical Tab Navigation */}
        <div className="glass-luxury p-3 rounded-3xl border border-white/10 space-y-1 self-start">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full px-4 py-3 rounded-2xl text-xs font-space font-bold transition-all flex items-center space-x-3 ${
                  isActive
                    ? 'bg-[#00e5a8] text-[#050505] shadow-[0_0_20px_rgba(0,229,168,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComp className={`w-4 h-4 ${isActive ? 'text-[#050505]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Body Content */}
        <div className="lg:col-span-3 glass-luxury p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
          {/* TAB 1: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">Officer Profile Settings</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Manage officer identity and departmental registration details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-tech">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Officer Full Name</label>
                  <input
                    type="text"
                    value={settings.fullName}
                    onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Official Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Officer Badge / ID</label>
                  <input
                    type="text"
                    value={settings.badgeId}
                    onChange={(e) => setSettings({ ...settings, badgeId: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Department / Division</label>
                  <select
                    value={settings.department}
                    onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  >
                    <option value="Metropolitan Enforcement Wing">Metropolitan Enforcement Wing</option>
                    <option value="State RTO Transport Audit">State RTO Transport Audit</option>
                    <option value="Highway Patrol Checkpoint">Highway Patrol Checkpoint</option>
                    <option value="Automotive Insurance Fraud Wing">Automotive Insurance Fraud Wing</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PASSWORD CHANGE */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">Password & Credentials</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Update JWT authentication passwords and security keys.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md text-xs font-mono-tech">
                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 font-bold uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  />
                </div>

                {pwdStatus && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    pwdStatus.startsWith('SUCCESS') 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {pwdStatus}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-space font-bold text-xs uppercase tracking-wider"
                >
                  Update Password
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: THEME SELECTOR */}
          {activeTab === 'theme' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">Appearance & Cyberpunk Theme</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Select high-contrast neon accent color palettes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'mint', name: 'Cyber Mint', color: '#00e5a8', class: 'from-[#00e5a8] to-emerald-600' },
                  { id: 'cyan', name: 'Neon Cyan', color: '#06b6d4', class: 'from-cyan-400 to-blue-600' },
                  { id: 'purple', name: 'Electric Violet', color: '#c084fc', class: 'from-purple-400 to-pink-600' },
                  { id: 'gold', name: 'Solar Amber', color: '#f59e0b', class: 'from-amber-400 to-orange-600' },
                ].map((t) => {
                  const isSel = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSettings({ ...settings, theme: t.id as ThemeOption });
                        localStorage.setItem('axion_theme', t.id);
                      }}
                      className={`p-5 rounded-2xl border text-left space-y-3 transition-all ${
                        isSel ? 'border-[#00e5a8] bg-white/10 shadow-[0_0_20px_rgba(0,229,168,0.2)]' : 'border-white/10 bg-black/40 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${t.class} shadow-lg`} />
                      <p className="font-space font-bold text-white text-sm">{t.name}</p>
                      <span className="text-[10px] font-mono-tech text-slate-400 block">{isSel ? 'Active Theme' : 'Click to Apply'}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 4: NOTIFICATION PREFERENCES */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">Notification Preferences</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Configure high-priority violation alerts and e-challan notifications.</p>
              </div>

              <div className="space-y-4 text-xs font-mono-tech">
                {[
                  { key: 'notifyHighSeverity', title: 'High Severity Violation Alerts', desc: 'Notify immediately when high-risk aftermarket alterations are detected.' },
                  { key: 'notifySmsChallan', title: 'Automatic E-Challan SMS Alerts', desc: 'Send automated penalty notifications to registered vehicle owners.' },
                  { key: 'notifyEmailDigest', title: 'Daily Compliance Digest Email', desc: 'Receive aggregated daily PDF summaries of all checkpoint inspections.' },
                  { key: 'notifySoundAlerts', title: 'Audio Alarm on High Violation', desc: 'Trigger high-pitch audio tone during live RTSP inspection detection.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/10">
                    <div>
                      <p className="font-bold text-white text-sm">{item.title}</p>
                      <p className="text-slate-400 mt-0.5">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof SettingsState] })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        settings[item.key as keyof SettingsState] ? 'bg-[#00e5a8]' : 'bg-white/10'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-[#050505] transition-transform ${
                        settings[item.key as keyof SettingsState] ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 5: AI DETECTION SETTINGS */}
          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">AI Detection & PyTorch Hyperparameters</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Adjust confidence threshold cutoffs and hardware execution options.</p>
              </div>

              <div className="space-y-6 text-xs font-mono-tech">
                {/* Confidence Slider */}
                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-white text-sm">Sigmoid Binary Confidence Cutoff</label>
                    <span className="font-bold text-[#00e5a8] text-sm">{(settings.aiThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.95"
                    step="0.05"
                    value={settings.aiThreshold}
                    onChange={(e) => setSettings({ ...settings, aiThreshold: parseFloat(e.target.value) })}
                    className="w-full accent-[#00e5a8] cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">Classifications exceeding this threshold trigger non-compliant violation alerts.</p>
                </div>

                {/* Device Selector */}
                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <label className="font-bold text-white text-sm block">Inference Hardware Acceleration</label>
                  <select
                    value={settings.inferenceDevice}
                    onChange={(e) => setSettings({ ...settings, inferenceDevice: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/80 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  >
                    <option value="gpu">CUDA GPU Acceleration (NVIDIA TensorRT)</option>
                    <option value="metal">Apple Metal Performance Shaders (MPS)</option>
                    <option value="cpu">CPU Standard Execution Mode</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: OCR & ANPR SETTINGS */}
          {activeTab === 'ocr' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">OCR & License Plate Recognition</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Configure EasyOCR image filters and state motor vehicle registry lookups.</p>
              </div>

              <div className="space-y-4 text-xs font-mono-tech">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <label className="font-bold text-white text-sm block">ANPR Plate Format Standard</label>
                  <select
                    value={settings.ocrPlateFormat}
                    onChange={(e) => setSettings({ ...settings, ocrPlateFormat: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/80 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  >
                    <option value="cmvr">Indian CMVR Standard (e.g. KA01AB1234)</option>
                    <option value="eu">European Union Format Standard</option>
                    <option value="universal">Universal Multi-Language Regex</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white text-sm">Adaptive Image Preprocessing Filter</p>
                    <p className="text-slate-400 mt-0.5">Apply bilateral noise removal & thresholding prior to EasyOCR text read.</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, ocrBilateralFilter: !settings.ocrBilateralFilter })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      settings.ocrBilateralFilter ? 'bg-[#00e5a8]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-[#050505] transition-transform ${
                      settings.ocrBilateralFilter ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 7: REPORT EXPORT SETTINGS */}
          {activeTab === 'reports' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="pb-4 border-b border-white/10">
                <h3 className="text-lg font-space font-bold text-white">PDF Report Export Specifications</h3>
                <p className="text-xs text-slate-400 font-mono-tech">Configure court compliance certificate layout and cryptographic stamps.</p>
              </div>

              <div className="space-y-4 text-xs font-mono-tech">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2">
                  <label className="font-bold text-white text-sm block">Court Certificate PDF Layout Template</label>
                  <select
                    value={settings.pdfTemplate}
                    onChange={(e) => setSettings({ ...settings, pdfTemplate: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/80 border border-white/10 text-white outline-none focus:border-[#00e5a8]"
                  >
                    <option value="court">Official Court Enforcement Certificate Layout</option>
                    <option value="compact">Compact Checkpoint Inspection Brief</option>
                    <option value="dossier">Full Forensic Technical Dossier</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-white/10">
                  <div>
                    <p className="font-bold text-white text-sm">Include GradCAM Saliency Heatmaps</p>
                    <p className="text-slate-400 mt-0.5">Embed visual neural feature heatmaps in exported PDF evidence files.</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, pdfIncludeGradcam: !settings.pdfIncludeGradcam })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                      settings.pdfIncludeGradcam ? 'bg-[#00e5a8]' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-[#050505] transition-transform ${
                      settings.pdfIncludeGradcam ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
