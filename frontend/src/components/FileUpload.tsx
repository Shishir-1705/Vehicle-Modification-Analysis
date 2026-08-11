"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, X, Cpu, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isAnalyzing }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate image preview URL when file selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      
      // Simulate file reading progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 80);

      return () => {
        URL.revokeObjectURL(url);
        clearInterval(interval);
      };
    } else {
      setPreviewUrl(null);
      setUploadProgress(0);
    }
  }, [selectedFile]);

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div 
        className={`glass-luxury p-6 md:p-10 rounded-3xl border flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
          isDragActive 
            ? 'border-[#00e5a8] ring-2 ring-[#00e5a8]/30 scale-[1.01] bg-[#00e5a8]/[0.02]' 
            : 'border-white/10 hover:border-white/20'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />

        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono-tech flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!selectedFile ? (
          <div className="text-center py-6 relative z-10 space-y-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00e5a8]/20 to-[#3b82f6]/20 border border-[#00e5a8]/30 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,229,168,0.2)]"
            >
              <Upload className="w-9 h-9 text-[#00e5a8]" />
            </motion.div>

            <div>
              <h3 className="text-2xl font-space font-extrabold text-white tracking-tight">
                Initialize AI Inspection Scan
              </h3>
              <p className="text-slate-400 text-sm mt-1 font-inter">
                Drag & drop motorcycle imagery or click to select file
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono-tech text-[#00e5a8]">
              <Sparkles className="w-3.5 h-3.5 text-[#00e5a8]" />
              <span>SUPPORTED: JPG, JPEG, PNG, WEBP (MAX 15MB)</span>
            </div>
          </div>
        ) : (
          <div className="w-full relative z-10 space-y-6">
            {/* Selected File Card with Image Preview & Specs */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              {/* Image Preview Thumbnail */}
              {previewUrl && (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewUrl} 
                    alt="Inspection Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 right-1 bg-black/70 p-1 rounded-full text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* File Specs & Progress */}
              <div className="flex-1 min-w-0 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <File className="w-4 h-4 text-[#00e5a8] shrink-0" />
                    <p className="font-mono-tech font-bold text-white text-xs truncate">
                      {selectedFile.name}
                    </p>
                  </div>

                  {!isAnalyzing && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }} 
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400">
                  <span>SIZE: {formatFileSize(selectedFile.size)}</span>
                  <span className="text-[#00e5a8] font-bold">{uploadProgress}% READY</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Execute Diagnostics CTA */}
            <button 
              disabled={isAnalyzing || uploadProgress < 100}
              onClick={(e) => {
                e.stopPropagation();
                onUpload(selectedFile);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold tracking-wider uppercase text-sm shadow-[0_0_30px_rgba(0,229,168,0.4)] hover:shadow-[0_0_45px_rgba(0,229,168,0.7)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 cursor-pointer"
            >
              <Cpu className="w-5 h-5" />
              <span>Execute Neural Diagnostics</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
