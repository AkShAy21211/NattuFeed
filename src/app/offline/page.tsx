'use client';

import React from 'react';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function OfflinePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 border border-red-100 shadow-sm animate-bounce">
        <WifiOff className="w-10 h-10 text-red-400" />
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
        {t('offlineTitle') || 'You\'re Offline'}
      </h1>
      
      <p className="text-[14px] text-gray-500 max-w-[280px] leading-relaxed mb-10 font-medium">
        {t('offlineDesc') || 'NattuFeed requires an internet connection to load new posts. Please check your network and try again.'}
      </p>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-[13px] uppercase tracking-wider shadow-lg shadow-primary/20 active:scale-95 transition-all"
      >
        <RefreshCcw className="w-4 h-4" />
        {t('retryLabel') || 'Try Again'}
      </button>

      <div className="mt-12 text-[11px] font-black text-gray-300 uppercase tracking-widest">
        NattuFeed Hyperlocal
      </div>
    </div>
  );
}
