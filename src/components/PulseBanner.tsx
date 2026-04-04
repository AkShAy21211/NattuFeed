"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { AlertCircle, ChevronRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

const PulseBanner = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activePost, setActivePost] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      setActivePost(null);
      return;
    }

    // Check for unresolved posts in Health, Services, or Utility
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", user.uid),
      where("isResolved", "==", false),
      where("category", "in", ["Health", "Services", "Utility", "GigsJobs"]),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActivePost({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActivePost(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!activePost) return null;

  return (
    <div 
      onClick={() => router.push("/profile")}
      className="mx-3 my-2 p-4 bg-primary text-white rounded-[24px] shadow-lg shadow-primary/20 flex items-center justify-between gap-3 cursor-pointer animate-in slide-in-from-top-4 duration-500 hover:scale-[0.98] transition-transform active:scale-95"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t("pulseBannerTitle") || "Action Required"}</p>
          <p className="text-xs font-bold leading-tight">
            {t("pulseBannerText") || "Update your active status to earn more Karma!"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/10">
        <span className="text-[10px] font-black uppercase tracking-wider">{t("goLabel") || "GO"}</span>
        <ChevronRight size={12} />
      </div>
    </div>
  );
};

export default PulseBanner;
