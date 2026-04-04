"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Bus, Sparkles, ShieldCheck, ArrowLeft, ChevronRight, 
  MapPin, Trophy, MessageSquare, AlertCircle, Clock, 
  Search, Flag, Zap, Handshake, Globe, Info, HelpCircle,
  TrendingUp, Users, Smartphone, Bell, AlertTriangle, 
  ShoppingCart, Hammer, HeartPulse, Megaphone, Share, ArrowUpRight,
  CheckCircle2
} from "lucide-react";

export default function GuidePage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans selection:bg-primary/20">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 px-4 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">{t("helpCenter")}</h2>
        <div className="w-10" />
      </div>

      <div className="px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* ── Hero Title ── */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/10 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[2px]">Masterclass</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 leading-none">
             {t("guide.heroTitle")}
          </h1>
          <p className="text-gray-500 font-bold leading-relaxed max-w-[280px] mx-auto text-sm">
            {t("guide.heroSub")}
          </p>
        </div>

        <div className="space-y-16">
          
          {/* ── SECTION 1: THE RADAR ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-red-600 rounded-[20px] flex items-center justify-center shadow-lg shadow-red-600/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t("guide.radarTitle")}</h3>
            </div>
            
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30 relative overflow-hidden">
               <p className="text-gray-600 text-[13px] font-bold leading-relaxed mb-8">
                  {t("guide.radarDesc")}
               </p>

               <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600">
                       <Zap className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight mb-1">{t("guide.quickSnapTitle")}</h4>
                       <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{t("guide.quickSnapDesc")}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 text-gray-400">
                       <Search className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight mb-1">{t("guide.manualModeTitle")}</h4>
                       <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{t("guide.manualModeDesc")}</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* ── SECTION 2: WITNESSING ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t("guide.witnessTitle")}</h3>
            </div>

            <div className="bg-emerald-50 rounded-[40px] p-8 border border-emerald-100/50 shadow-sm relative overflow-hidden">
               <p className="text-emerald-900/70 text-[13px] font-bold leading-relaxed mb-6">
                  {t("guide.witnessDesc")}
               </p>
               <div className="flex items-center gap-3 py-3 px-5 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{t("meToo")} (Refills Timer)</span>
               </div>
            </div>
          </section>

          {/* ── SECTION 3: ANCHORS ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary rounded-[20px] flex items-center justify-center shadow-lg shadow-primary/20">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t("guide.anchorTitle")}</h3>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
               <p className="text-gray-600 text-[13px] font-bold leading-relaxed mb-0">
                  {t("guide.anchorDesc")}
               </p>
            </div>
          </section>

          {/* ── SECTION 4: ECONOMY ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t("guide.economyTitle")}</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
                 <div className="flex gap-4 mb-4">
                    <Hammer className="w-6 h-6 text-amber-500 shrink-0" />
                    <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight">{t("guide.gigsJobsTitle")}</h4>
                 </div>
                 <p className="text-gray-400 text-[11px] font-bold leading-relaxed">{t("guide.gigsJobsDesc")}</p>
              </div>

              <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
                 <div className="flex gap-4 mb-4">
                    <ShoppingCart className="w-6 h-6 text-emerald-500 shrink-0" />
                    <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight">{t("guide.marketTitle")}</h4>
                 </div>
                 <p className="text-gray-400 text-[11px] font-bold leading-relaxed">{t("guide.marketDesc")}</p>
              </div>
            </div>
          </section>

          {/* ── SECTION 5: KARMA ── */}
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-900 rounded-[20px] flex items-center justify-center shadow-lg shadow-slate-900/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none italic">{t("guide.karmaTitle")}</h3>
            </div>

            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
               <p className="text-gray-600 text-[13px] font-bold leading-relaxed mb-6">
                  {t("guide.karmaDesc")}
               </p>
               
               <div className="space-y-3 bg-gray-50 rounded-3xl p-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Quick Snap</span>
                    <span className="text-primary">+2 PTS</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Witness Verify</span>
                    <span className="text-emerald-500">+1 PT</span>
                  </div>
               </div>
            </div>
          </section>

          {/* ── SAFETY WARNING ── */}
          <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-6 flex gap-4 items-start">
             <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
             <p className="text-[12px] font-black text-rose-900 leading-tight">
                {t("guide.safetyWarning")}
             </p>
          </div>

        </div>

        {/* ── Footer / CTAs ── */}
        <div className="mt-20 text-center pb-20">
           <button
              onClick={() => router.push("/")}
              className="w-full bg-primary text-white py-6 rounded-[30px] font-black uppercase tracking-[4px] shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              Start Exploring
              <ChevronRight className="w-6 h-6" />
            </button>
            
            <div className="mt-12 opacity-20 flex flex-col items-center gap-2">
               <Globe className="w-5 h-5" />
               <p className="text-[9px] font-black uppercase tracking-[10px]">NattuFeed Alpha v2.0</p>
            </div>
        </div>

      </div>
    </div>
  );
}
