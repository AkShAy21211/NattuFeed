'use client';

import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if it's iOS and not already installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const hasPrompted = localStorage.getItem('ios_prompt_dismissed');

    if (isIOS && !isStandalone && !hasPrompted) {
      // Delay prompt to not annoy immediately
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-700">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-2xl p-5 overflow-hidden">
        {/* Subtle Progress Bar */}
        <div className="absolute top-0 left-0 h-[2px] bg-primary/20 w-full" />
        
        <button 
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('ios_prompt_dismissed', 'true');
          }}
          className="absolute top-3 right-3 p-1 rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="text-white font-black text-xs tracking-tighter">NF</span>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-tight">
              {t('installiOS') || 'Install NattuFeed'}
            </h3>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed max-w-[200px]">
              {t('installiOSDesc') || 'Add to Home Screen for a native app experience.'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.05em] text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
              <Share className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span>{t('tapShare')}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
              <PlusSquare className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <span>{t('addToHome')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
