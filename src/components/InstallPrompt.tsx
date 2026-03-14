"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed this session
    const isDismissed = sessionStorage.getItem("pwa-prompt-dismissed");
    if (isDismissed) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-primary text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-white/10 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[13px] font-black leading-tight">{t('installApp')}</h3>
            <p className="text-[10px] opacity-80 font-bold">{t('installAppDesc')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="bg-white text-primary px-4 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all"
          >
            {t('install')}
          </button>
          <button 
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
