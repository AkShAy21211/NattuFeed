"use client";

import React, { useState, useEffect, useCallback } from "react";
import { collection, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { X, Send, Loader2, AlertCircle } from "lucide-react";
import { BANNED_KEYWORDS, normalizeText } from "@/lib/moderation-rules";

/*
 * FIX: Category type was mismatched with PostCard's Post interface.
 * PostCard defined: "Traffic" | "Public Service" | "Fish/Market" | "General"
 * This modal was sending: "Traffic" | "Utility" | "Market" | "Services" | "Health" | "Alerts"
 * PostCard's CATEGORY_CONFIG would silently fall back to "General" for any
 * non-matching value. Both files must share the same union type.
 * Export it from a shared types file and import it in both — defined here
 * for now, move to @/types/post.ts when convenient.
 */
export type PostCategory = "Traffic" | "Utility" | "Market" | "Services" | "Health" | "Alerts";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORY: PostCategory = "Traffic";

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { lat, lng } = useLocation();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [headline, setHeadline] = useState("");
  const [details, setDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [category, setCategory] = useState<PostCategory>(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Reset form whenever modal opens ── */
  useEffect(() => {
    if (isOpen) {
      setHeadline("");
      setDetails("");
      setLandmark("");
      setCategory(DEFAULT_CATEGORY);
      setError(null);
    }
  }, [isOpen]);

  /* ── Close on Escape key ── */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !loading) onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!headline.trim()) {
      setError(t("enterHeadline"));
      return;
    }
    if (!lat || !lng) {
      setError(t("locationRequired"));
      return;
    }

    const combined = normalizeText(`${headline} ${details} ${landmark}`);
    if (BANNED_KEYWORDS.some((word: string) => combined.includes(normalizeText(word)))) {
      setError(t("restrictedLanguage"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const postsRef = doc(collection(db, "posts"));
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (tx) => {
        tx.set(postsRef, {
          authorId: user.uid,
          authorName: profile?.name || user.displayName || t("nativeMember"),
          authorPhoto: profile?.photoURL || user.photoURL || "",
          headline: headline.trim(),
          details: details.trim(),
          landmark: landmark.trim(),
          category,
          lat, lng,
          district: profile?.district || "",
          localBody: profile?.localBody || "",
          ward: profile?.ward || "",
          verifiedCount: 0,
          flagCount: 0,
          isHidden: false,
          isBusinessPost: false,
          createdAt: serverTimestamp(),
        });

        tx.update(userRef, {
          karmaTotal: increment(1),
          karmaWeekly: increment(1),
        });
      });

      onClose();
      showToast(t("postedKarma"), "success");
    } catch (err) {
      console.error("Error creating post:", err);
      setError(t("failedToPost"));
    } finally {
      setLoading(false);
    }
  };

  const categories: { id: PostCategory; label: string; hint: string }[] = [
    { id: "Traffic", label: t("categoryTraffic"), hint: t("hintTraffic") },
    { id: "Utility", label: t("categoryUtility"), hint: t("hintUtility") },
    { id: "Market", label: t("categoryMarket"), hint: t("hintMarket") },
    { id: "Services", label: t("categoryServices"), hint: t("hintServices") },
    { id: "Health", label: t("categoryHealth"), hint: t("hintHealth") },
    { id: "Alerts", label: t("categoryAlerts"), hint: t("hintAlerts") },
  ];

  return (
    /*
     * FIX: Clicking the backdrop now closes the modal.
     * The inner div stops propagation so clicks inside don't dismiss it.
     */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={() => { if (!loading) onClose(); }}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[480px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl p-6 pb-10 sm:pb-6 animate-in slide-in-from-bottom duration-300"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 id="modal-title" className="text-lg font-black text-gray-900">{t("newUpdate")}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label={t("cancel")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Category selector */}
          <div className="space-y-2">
            <div role="radiogroup" aria-label="Post category" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={category === cat.id}
                  disabled={loading}
                  onClick={() => setCategory(cat.id)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all disabled:opacity-50 ${category === cat.id
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Hint line - shows for selected category */}
            {categories.find(c => c.id === category)?.hint && (
              <p className="text-[11px] text-gray-400 font-medium pl-1 animate-in fade-in duration-200">
                e.g. {categories.find(c => c.id === category)?.hint}
              </p>
            )}
          </div>

          {/* Headline */}
          <div className="relative">
            <label htmlFor="post-headline" className="sr-only">{t("headlineLabel")}</label>
            <input
              id="post-headline"
              type="text"
              placeholder={t("headlinePlaceholder")}
              value={headline}
              disabled={loading}
              onChange={(e) => {
                setHeadline(e.target.value.slice(0, 100));
                setError(null);
              }}
              className="w-full bg-gray-50 border-2 border-gray-100 py-4 px-5 rounded-2xl focus:border-primary outline-none transition-colors font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium disabled:opacity-50"
              required
            />
            <span className={`absolute right-4 bottom-2 text-[10px] font-bold ${headline.length >= 100 ? "text-red-500" : "text-gray-300"}`}>
              {headline.length}/100
            </span>
          </div>

          {/* Landmark */}
          <div>
            <label htmlFor="post-landmark" className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 mb-1 block">
              {t("landmarkLabel")}
            </label>
            <input
              id="post-landmark"
              type="text"
              placeholder={t("landmarkPlaceholder")}
              value={landmark}
              disabled={loading}
              onChange={(e) => setLandmark(e.target.value.slice(0, 50))}
              className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-5 rounded-2xl focus:border-primary outline-none transition-colors font-medium text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
            />
          </div>

          {/* Details */}
          <div className="relative">
            <label htmlFor="post-details" className="sr-only">{t("detailsLabel")}</label>
            <textarea
              id="post-details"
              placeholder={t("detailsPlaceholder")}
              value={details}
              disabled={loading}
              onChange={(e) => setDetails(e.target.value.slice(0, 300))}
              rows={3}
              className="w-full bg-gray-50 border-2 border-gray-100 py-4 px-5 rounded-2xl focus:border-primary outline-none transition-colors text-sm text-gray-600 placeholder:text-gray-400 resize-none font-medium disabled:opacity-50"
            />
            <span className={`absolute right-4 bottom-2 text-[10px] font-bold ${details.length >= 300 ? "text-red-500" : "text-gray-300"}`}>
              {details.length}/300
            </span>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={loading || !headline.trim()}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-primary shadow-md shadow-primary/20 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Send className="w-4 h-4" aria-hidden="true" /> {t("postUpdate")}</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* Required for Firebase Phone Auth reCAPTCHA */}
      <div id="recaptcha-container" className="hidden" />
    </div>
  );
};

export default CreatePostModal;