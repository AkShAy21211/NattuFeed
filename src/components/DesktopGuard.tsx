"use client";

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, QrCode, ChevronRight, Settings } from "lucide-react";

/**
 * DesktopGuard Component
 * 
 * Discourages desktop usage for the NattuFeed "vibe".
 * Shows a QR code overlay on screens > 1024px.
 * Provides a "Continue anyway" bypass for Admins/Developers (stored in localStorage).
 */
export default function DesktopGuard({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isBypassed, setIsBypassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if previously bypassed
    const hasBypass = localStorage.getItem("nattufeed_desktop_bypass") === "true";
    setIsBypassed(hasBypass);

    const checkSize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const handleBypass = () => {
    // Synchronize with the project's Admin UID for secure access
    const ADMIN_UID = "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2"; // Hardcoded fallback matching PostCard.tsx
    const code = prompt("Admin Passcode Required:");
    
    if (code === ADMIN_UID) {
      localStorage.setItem("nattufeed_desktop_bypass", "true");
      setIsBypassed(true);
    } else {
      alert("Unauthorized Access Attempt.");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>;

  // If not desktop or already bypassed, just show the app in Full Screen (Mobile)
  if (!isDesktop) {
    return <>{children}</>;
  }

  // Desktop/Laptop Layout: The "Mobile Frame" View
  return (
    <div className="min-h-screen bg-[#FDFDFB] flex items-center justify-center selection:bg-primary/20 overflow-hidden relative">
      
      {/* ── Background Atmosphere Layers ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Layer 1: Dot Matrix Pattern */}
        <div className="absolute inset-0 bg-dot-matrix opacity-40" />
        
        {/* Layer 2: Moving Ambient Orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] animate-orbit-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[100px] animate-orbit-mid" />
        <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-accent/5 rounded-full blur-[80px] animate-orbit-slow opacity-60" />

        {/* Layer 3: Noise Texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.03]" />

        {/* Layer 4: Distant Branding */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 select-none pointer-events-none hidden 2xl:block">
           <h1 className="text-[180px] font-black text-black/[0.02] leading-none tracking-tighter rotate-90 origin-center translate-x-24">
             NATTUFEED
           </h1>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl flex items-center justify-center gap-12 lg:gap-20">
        
        {/* Left Side: Mission/Info Widget */}
        <div className="hidden xl:flex flex-col gap-6 w-80 animate-in slide-in-from-left duration-700">
          <div className="side-widget glass-panel p-8 space-y-5 border-white/40 shadow-2xl">
             <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 italic font-black text-white text-xl">
                NF
             </div>
             <div className="space-y-3">
               <h2 className="text-2xl font-black text-gray-900 leading-tight">
                 NattuFeed is for the <span className="text-primary underline decoration-primary/20 underline-offset-4">Streets</span>.
               </h2>
               <p className="text-sm text-gray-500 font-medium leading-relaxed">
                 Designed for live reporting and real-time neighborhood updates. Browse locally, contribution requires on-site mobile verification.
               </p>
             </div>
          </div>

          <div className="side-widget glass-panel py-5 px-8 flex items-center justify-between border-emerald-100/50">
             <div className="flex items-center gap-4">
                <div className="relative">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative z-10" />
                   <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-sonar-pulse" />
                </div>
                <div className="space-y-0.5">
                   <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">System Status</p>
                   <p className="text-xs font-bold text-gray-600">Feed Hub Syncing</p>
                </div>
             </div>
             <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">LIVE</div>
          </div>
        </div>

        {/* Center: The App Frame */}
        <div className="desktop-center-frame group animate-in zoom-in-95 duration-700 shadow-[0_0_100px_rgba(0,0,0,0.1)]">
           <div className="w-full h-full overflow-hidden bg-white">
              {children}
           </div>
        </div>

        {/* Right Side: QR Access Widget */}
        <div className="hidden lg:flex flex-col gap-6 w-80 animate-in slide-in-from-right duration-700">
          <div className="side-widget glass-panel text-center p-8 space-y-6 border-white/40 shadow-2xl">
             <div className="relative group/qr">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-accent/10 rounded-[40px] blur-2xl opacity-0 group-hover/qr:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white p-5 rounded-3xl shadow-xl border border-gray-100 transition-all duration-500 hover:rotate-2 hover:scale-[1.02]">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://nattufeed-d59c9.web.app/')}`}
                     alt="Scan to open NattuFeed on Mobile"
                     className="w-40 h-40 rounded-xl"
                   />
                </div>
             </div>
             <div className="space-y-3">
                <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Scan to Report</p>
                <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                  Take NattuFeed with you. Open on mobile to post updates and earn Karma.
                </p>
             </div>
          </div>

          {/* Admin Bypass */}
          <button 
            onClick={handleBypass}
            className="group flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 hover:text-primary transition-all py-4"
          >
            <div className="w-8 h-[1px] bg-gray-200 group-hover:w-4 group-hover:bg-primary transition-all" />
            <Settings className="w-4 h-4 opacity-40 group-hover:rotate-90 transition-transform duration-500" />
            <span className="opacity-60 group-hover:opacity-100">Dev Mode</span>
            <div className="w-8 h-[1px] bg-gray-200 group-hover:w-4 group-hover:bg-primary transition-all" />
          </button>
        </div>

      </div>

      {/* Global Status Bar (Bottom) */}
      <div className="absolute bottom-10 left-12 hidden 2xl:flex items-center gap-6 select-none">
         <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] hover:text-primary transition-colors cursor-default">
            Hyperlocal • Real-Time • Kerala
         </div>
         <div className="w-12 h-[1px] bg-gray-200" />
         <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            v1.0.4-Stable
         </div>
      </div>
    </div>
  );
}


