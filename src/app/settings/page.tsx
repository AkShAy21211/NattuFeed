"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, Shield, Scale, LogOut, Trash2, 
  ChevronRight, Globe, AlertTriangle, Loader2,
  ChevronLeft, Info, Share2, Users, FileText
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, loading, signOut, deleteAccount } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-gray-400">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t("syncingProfile")}</p>
      </div>
    );
  }

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'ml' : 'en';
    setLanguage(newLang);
    showToast(newLang === 'ml' ? "ഭാഷ മാറ്റി: മലയാളം" : "Language changed: English", "success");
  };
  
  const handleInvite = async () => {
    const inviteMsg = t("inviteMessage");
    const shareUrl = "https://nattufeed-d59c9.web.app/";
    const fullMessage = `${inviteMsg} ${shareUrl}`;

    try {
      let shareData: ShareData = {
        title: "NattuFeed",
        text: inviteMsg,
        url: shareUrl
      };

      try {
        const response = await fetch("/icons/icon-192x192.png");
        const blob = await response.blob();
        const file = new File([blob], "nattufeed-icon.png", { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          shareData.files = [file];
        }
      } catch (e) {
        console.log("Branding icon fetch failed, falling back to text-only share", e);
      }

      if (navigator.share) {
        await navigator.share(shareData);
      } 
      else {
        window.open(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, "_blank");
      }
    } catch (err) {
      console.error("Invite sharing failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] pb-28 animate-in fade-in duration-500 text-[#212121]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-black text-gray-900 tracking-tight">
          {t("settingsTitle") || "Settings"}
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-6">
        
        {/* Profile Shortcut */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-transform cursor-pointer" onClick={() => router.push('/profile')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
               <UserIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Signed in as</p>
              <h2 className="text-base font-black text-gray-900 leading-tight truncate">
                {profile?.name || user?.displayName || t("nativeMember")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
            {t("viewProfile") || "View Profile"}
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 1. Preferences */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] px-2 mb-2">Preferences</p>
          
          <button
            onClick={handleLanguageToggle}
            className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/20 hover:bg-primary/[0.02] transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 shrink-0 group-hover:bg-purple-100 transition-colors">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight mb-0.5">
                  App Language
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider opacity-60">
                  {language === 'en' ? "English — Tap to switch to Malayalam" : "മലയാളം — Switch to English"}
                </p>
              </div>
            </div>
            <div className="bg-gray-100 px-3 py-1.5 rounded-full text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-200">
              {language === 'en' ? "EN" : "ML"}
            </div>
          </button>
        </section>

        {/* 2. Share & Grow */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] px-2 mb-2">
            Share & Grow
          </p>
          
          <button
            onClick={handleInvite}
            className="w-full flex items-center justify-between px-5 py-5 bg-primary/5 rounded-[28px] border border-primary/20 shadow-sm hover:bg-primary/10 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-0.5">
                  {t("inviteNeighbors") || "Invite Neighbors"}
                </p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider opacity-80">
                  {t("inviteNeighborsDesc") || "Spread the word to grow our community"}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
               <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </button>

          <a
            href="https://chat.whatsapp.com/BjKDMjZpHpQ0L1bnFcb6C4"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-5 py-5 bg-[#25D366]/5 rounded-[28px] border border-[#25D366]/20 shadow-sm hover:bg-[#25D366]/10 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight leading-tight mb-0.5">
                  {t("joinCommunity")}
                </p>
                <p className="text-[10px] text-[#128C7E] font-bold uppercase tracking-wider opacity-80">
                  {t("joinCommunityDesc")}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#128C7E]/10 flex items-center justify-center shrink-0">
               <ChevronRight className="w-4 h-4 text-[#128C7E]" />
            </div>
          </a>
        </section>

        {/* 3. Help */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] px-2 mb-2">
            Help
          </p>
          
          <Link
            href="/guide"
            className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-primary/20 hover:bg-primary/[0.02] transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 shrink-0 group-hover:bg-amber-100 transition-colors">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight mb-0.5">
                  How NattuFeed Works
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider opacity-60">
                  Community guide & posting tips
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
          </Link>
          <WhatsAppButton />
        </section>

        {/* 4. Legal */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] px-2 mb-2">Legal</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/privacy"
              className="flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-2xl border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-[2px] hover:text-primary hover:border-primary/20 transition-all shadow-sm group"
            >
              <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="flex flex-col items-center justify-center gap-2 p-5 bg-white rounded-2xl border border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-[2px] hover:text-primary hover:border-primary/20 transition-all shadow-sm group"
            >
              <Scale className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Terms of Use
            </Link>
          </div>
        </section>

        {/* 5. Account */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] px-2 mb-2">Account</p>
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-all active:scale-[0.98] group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 group-hover:bg-red-100 group-hover:border-red-100 transition-colors">
                <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-black text-gray-900 group-hover:text-red-600 uppercase tracking-widest leading-tight mb-0.5 transition-colors">
                  Sign Out
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider opacity-60">
                  You can always sign back in
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-300 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 px-5 py-4 bg-red-50/10 rounded-2xl border border-dashed border-red-200/50 hover:bg-red-50/20 hover:border-red-300 transition-all active:scale-[0.98] group"
          >
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 group-hover:bg-red-500 transition-colors shrink-0">
              <Trash2 className="w-4 h-4 text-red-300 group-hover:text-white transition-colors" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-red-500/60 group-hover:text-red-600 uppercase tracking-widest leading-tight mb-0.5 transition-colors">
                Delete My Account
              </p>
              <p className="text-[9px] text-red-300 font-bold uppercase tracking-wider opacity-60">
                Permanently erases all your data
              </p>
            </div>
          </button>
        </section>

        <p className="text-center text-[10px] font-bold text-gray-200 uppercase tracking-[0.5em] py-8">
          NATTUFEED ALPHA
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-3 leading-tight uppercase tracking-tight">
              {t("deleteAccount") || "Delete Account?"}
            </h3>
            <p className="text-[11px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed mb-8">
              {t("deleteAccountConfirm") || "This action is permanent and will delete all your Karma and posts."}
            </p>
            
            <div className="space-y-3">
              <button
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAccount();
                    showToast(t("deleteAccountSuccess"), "success");
                  } catch (err: any) {
                    if (err.message === "REAUTH_NEEDED") {
                      showToast(t("reauthRequired"), "warning");
                    } else {
                      showToast(t("deleteAccountFail"), "error");
                    }
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("confirm")}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
