"use client";

import React, { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function WhatsAppButton() {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState("");
  
  // Use environment variable for the phone number if available
  const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91"; // Placeholder: '91' for India

  const handleSend = () => {
    if (!feedback.trim()) return;
    
    const message = encodeURIComponent(`Hlo, NattuFeed Feedback: ${feedback}`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setFeedback(""); // Clear after sending
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section (reusing design tokens) */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center border border-[#25D366]/20 shadow-sm shrink-0">
          <MessageCircle className="w-5 h-5 text-white fill-white/10" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight mb-0.5">
            {t("whatsappFeedback")}
          </p>
          <p className="text-[9px] text-[#128C7E] font-bold uppercase tracking-wider">
            {t("directChat")}
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t("feedbackPlaceholder")}
            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]/30 outline-none transition-all resize-none"
          />
          
          <button
            onClick={handleSend}
            disabled={!feedback.trim()}
            className={`absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              feedback.trim() 
                ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 active:scale-95 translate-y-0 opacity-100" 
                : "bg-gray-100 text-gray-300 translate-y-2 opacity-0 pointer-events-none"
            }`}
          >
            {t("sendToWhatsApp")}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Status indicator footer */}
       <div className="bg-[#25D366]/[0.03] px-5 py-2 flex items-center justify-between border-t border-[#25D366]/5">
         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Typical response: &lt; 2h</span>
         <div className="flex items-center gap-1.5">
            <span className="flex h-1 w-1 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-[9px] font-black text-[#25D366] uppercase tracking-[0.2em]">Live Support</span>
         </div>
      </div>
    </div>
  );
}
