"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { X, Sparkles, LogIn, ChevronRight, Trophy } from "lucide-react";

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "post" | "verify";
  karmaAmount: number;
}

/**
 * A high-conversion modal shown to Guests after they attempt a helpful action.
 * Leverages the "Loss Aversion" psychology by showing the points they've already "earned"
 * and just need to "claim".
 */
export default function ConversionModal({ 
  isOpen, 
  onClose, 
  actionType, 
  karmaAmount 
}: ConversionModalProps) {
  const { signInWithGoogle } = useAuth();
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Progress Bar (Psychological "Almost Loaded" trick) */}
        <div className="h-1.5 w-full bg-gray-100">
          <div className="h-full bg-primary w-[90%] animate-pulse" />
        </div>

        <div className="p-8 pt-10 text-center relative">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>

          {/* Centered Celebration Icon */}
          <div className="mb-6 relative inline-block">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center rotate-3 border-2 border-primary/20">
              <Trophy size={40} className="text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
              <Sparkles size={16} className="text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-3">
            {language === 'ml' ? "ഗംഭീരം! നിങ്ങൾക്കൊരു സമ്മാനമുണ്ട്" : "Awesome! You've got a gift"}
          </h2>
          
          <p className="text-gray-600 font-medium leading-relaxed mb-8 px-2 text-sm sm:text-base">
            {actionType === 'post' 
              ? (language === 'ml' 
                  ? `ഈ റിപ്പോർട്ട് നമ്മുടെ നാട്ടുകാർക്ക് വലിയ സഹായമാകും! ഇത് സേവ് ചെയ്യാനും +${karmaAmount} കർമ്മ പോയിന്റുകൾ നേടാനും ലോഗിൻ ചെയ്യുക.`
                  : `Your report will help many people! Sign in now to save this update and claim your +${karmaAmount} Karma points.`)
              : (language === 'ml' 
                  ? `നിങ്ങൾ ഈ ബസ് റിപ്പോർട്ട് സ്ഥിരീകരിച്ചു! ഇത് ലോഗിൻ ചെയ്ത് സ്ഥിരസ്ഥാനമാക്കി +${karmaAmount} കർമ്മ പോയിന്റുകൾ നേടാം.`
                  : `You've successfully verified this bus! Sign in now to claim your +${karmaAmount} Karma points and become a trusted member.`)}
          </p>

          <div className="flex flex-col gap-3">
            {/* Primary Login Button */}
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group active:scale-[0.98]"
            >
              <LogIn size={18} />
              {language === 'ml' ? "ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യാം" : "Sign in with Google"}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Secondary Skip Button */}
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gray-50 text-gray-400 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all text-[11px] active:scale-[0.98]"
            >
              {language === 'ml' ? "പിന്നീട് ചെയ്യാം (പോയിന്റ് നഷ്ടപ്പെടും)" : "Skip (Continue as Guest)"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none">
              Join 13+ neighbors making Kerala smarter 🌴
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
