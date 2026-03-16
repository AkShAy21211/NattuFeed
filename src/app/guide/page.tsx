"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Bus, Sparkles, ShieldCheck, ArrowLeft, ChevronRight, 
  MapPin, Trophy, MessageSquare, AlertCircle, Clock, 
  Search, Flag, Zap, Handshake, Globe
} from "lucide-react";

export default function GuidePage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-24">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 px-4 py-4 bg-[#F7F6F3]/80 backdrop-blur-xl flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-widest">{t("helpCenter") || "Help Center"}</h2>
        <div className="w-10" />
      </div>

      <div className="px-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            {t("guideTitle")}
          </h1>
          <p className="text-gray-500 font-medium italic">
            {t("guideSub")}
          </p>
        </div>

        {/* ── Sections ── */}
        <div className="space-y-8">
          
          {/* Section: Radar (The Hero) */}
          <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-black text-gray-900">{t("howToRadar")}</h3>
            </div>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
              {t("radarExplanation")}
            </p>

            <div className="space-y-3 mb-6">
              {[
                { icon: MapPin, text: t("radarStep1"), color: "text-primary" },
                { icon: Zap, text: t("radarStep2"), color: "text-amber-500" },
                { icon: Clock, text: t("radarStep3"), color: "text-emerald-500" }
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <step.icon className={`w-4 h-4 ${step.color}`} />
                  </div>
                  <span className="text-[12px] font-black text-gray-700 uppercase tracking-tight py-1">
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary shrink-0" />
              <p className="text-[10px] font-bold text-primary italic uppercase tracking-wider">
                {t("radarExpiryNote")}
              </p>
            </div>
          </section>

          {/* Section: What to Post (The Why) */}
          <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900">{t("whatToPost")}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { title: "Traffic", desc: t("catTrafficDesc"), icon: Globe, color: "bg-red-50 text-red-600" },
                { title: "Utility", desc: t("catUtilityDesc"), icon: Zap, color: "bg-amber-50 text-amber-600" },
                { title: "Market", desc: t("catMarketDesc"), icon: Trophy, color: "bg-emerald-50 text-emerald-600" },
                { title: "Alerts", desc: t("catAlertsDesc"), icon: AlertCircle, color: "bg-orange-50 text-orange-600" }
              ].map((cat, i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100/50">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color} border border-current opacity-20`}>
                    <cat.icon className="w-5 h-5 opacity-100" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-[2px] text-gray-900">{cat.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Karma */}
          <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900">{t("whyKarma")}</h3>
            </div>
            
            <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">
              {t("karmaExplanation")}
            </p>

            <div className="space-y-2">
              {[
                { title: "+1 Post", desc: t("earnKarma1"), icon: Zap, color: "text-primary" },
                { title: "+2 Radar", desc: t("earnKarma2"), icon: Bus, color: "text-emerald-500" },
                { title: "+1 Verify", desc: t("earnKarma3"), icon: ShieldCheck, color: "text-blue-500" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.desc}</span>
                  </div>
                  <span className={`text-[12px] font-black ${item.color}`}>{item.title.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Safety */}
          <section className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16" />
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                <ShieldCheck className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900">{t("beSafe")}</h3>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6">
              {t("safetyExplanation")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50 flex flex-col items-center text-center">
                 <Flag className="w-4 h-4 text-red-500 mb-2" />
                 <span className="text-[10px] font-black text-red-700 uppercase tracking-tight leading-tight">Reports hide fake news</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex flex-col items-center text-center">
                 <Handshake className="w-4 h-4 text-emerald-500 mb-2" />
                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight leading-tight">Verified by neighbors</span>
              </div>
            </div>
          </section>

        </div>

        {/* ── Final CTA ── */}
        <div className="mt-12 text-center pb-20">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black uppercase tracking-[3px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {t("getStarted")}
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <div className="mt-10 pt-8 border-t border-gray-100 opacity-30">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[10px]">
              NATTUFEED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
