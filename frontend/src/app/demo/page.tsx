"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page with ?demo=true to auto-trigger the cinematic video modal
    router.replace('/?demo=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-mono-tech text-xs">
      <div className="flex items-center space-x-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00e5a8] animate-ping" />
        <span>OPENING AXION CINEMATIC DEMO...</span>
      </div>
    </div>
  );
}
