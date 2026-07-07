"use client";

import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isAnalyzing }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`glass-card p-12 flex flex-col items-center justify-center transition-all cursor-pointer ${
          isDragActive ? 'border-primary ring-2 ring-primary-glow scale-[1.02]' : 'hover:scale-[1.01]'
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
          accept="image/*"
        />

        {!selectedFile ? (
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/10 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
            >
              <Upload className="w-10 h-10 text-primary" />
            </motion.div>
            <h3 className="text-2xl font-semibold mb-2">Initialize AI Scan</h3>
            <p className="text-slate-400">Drag & drop bike image or click to browse</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <File className="text-primary w-6 h-6" />
                </div>
                <div>
                  <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              {!isAnalyzing && (
                <button onClick={removeFile} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>

            <button 
              disabled={isAnalyzing}
              onClick={(e) => {
                e.stopPropagation();
                onUpload(selectedFile);
              }}
              className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-3 pulse-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Engine...</span>
                </>
              ) : (
                <span>Run Intelligent Diagnostics</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
