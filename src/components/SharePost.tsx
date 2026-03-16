"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface SharePostProps {
  post: any;
  className?: string;
}

export default function SharePost({ post, className }: SharePostProps) {
  const { language } = useLanguage();

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let message = "";
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://nattufeed.web.app";
    const postUrl = `${siteUrl}/post/${post.id}`;

    if (post.type === "bus_spott") {
      const direction = post.details === "to_city" 
        ? (language === "ml" ? "നഗരത്തിലേക്ക്" : "Towards City") 
        : (language === "ml" ? "നാട്ടിലേക്ക്" : "Towards Village");
        
      const statusLabel = post.timingStatus === "on_time" ? "On Time" : 
                          post.timingStatus === "delayed" ? "Delayed" : 
                          post.timingStatus === "just_missed" ? "Just Missed" : "";

      message = language === "ml" 
        ? `🚌 *NattuFeed ബസ് റഡാർ*\n\n*${post.headline}*\n📍 സ്ഥലം: ${post.anchorName || "Unknown"}\n🔄 ദിശ: ${direction}\n${statusLabel ? `⏱️ സ്റ്റാറ്റസ്: ${statusLabel}\n` : ""}\nലൈവ് ട്രാക്കിംഗ് ഇവിടെ:\n${postUrl}`
        : `🚌 *NattuFeed Bus Radar*\n\n*${post.headline}*\n📍 Stop: ${post.anchorName || "Unknown"}\n🔄 Direction: ${direction}\n${statusLabel ? `⏱️ Status: ${statusLabel}\n` : ""}\nTrack live here:\n${postUrl}`;
    } else {
      message = language === "ml"
        ? `📢 *NattuFeed ലോക്കൽ അപ്‌ഡേറ്റ്*\n\n*${post.headline}*\n📍 ${post.landmark || "കേരളം"}\n\nകൂടുതൽ വിവരങ്ങൾ ഇവിടെ:\n${postUrl}`
        : `📢 *NattuFeed Local Update*\n\n*${post.headline}*\n📍 ${post.landmark || "Kerala"}\n\nRead more here:\n${postUrl}`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all active:scale-95 group ${className}`}
      title="Share to WhatsApp"
    >
      <div className="flex items-center gap-1.5">
        <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </div>
    </button>
  );
}
