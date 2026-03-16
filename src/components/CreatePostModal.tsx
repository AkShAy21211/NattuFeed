"use client";

import React, { useState, useEffect, useCallback } from "react";
import { collection, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/hooks/useLocation";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { X, Send, Loader2, AlertCircle, Bus, AlertTriangle, ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { BANNED_KEYWORDS, normalizeText } from "@/lib/moderation-rules";
import { PostCategory } from "@/types/post";
import { isNearAnyAnchor, getVerifiedAnchors, Anchor, calculateDistance } from "@/lib/anchors";
import { addDoc } from "firebase/firestore";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORY: PostCategory = "Traffic";

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { lat, lng, accuracy } = useLocation();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [headline, setHeadline] = useState("");
  const [details, setDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [category, setCategory] = useState<PostCategory>(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trafficMode, setTrafficMode] = useState<"bus" | "general">("bus");
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedRoutes, setSuggestedRoutes] = useState("");
  const [timingStatus, setTimingStatus] = useState<"on_time" | "delayed" | "just_missed">("on_time");
  const [nearestAnchor, setNearestAnchor] = useState<Anchor | null>(null);

  const isBusSpott = category === "Traffic" && trafficMode === "bus";

  /* ── Reset form whenever modal opens ── */
  useEffect(() => {
    if (isOpen) {
      setHeadline("");
      setDetails("");
      setLandmark("");
      setCategory(DEFAULT_CATEGORY);
      setTrafficMode("bus");
      setError(null);
      setShowSuggest(false);
      setSuggesting(false);
      setSuggestedRoutes("");
      setTimingStatus("on_time");
      setNearestAnchor(null);
      
      // Fetch anchors
      getVerifiedAnchors().then(setAnchors);
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

  /* ── Proactive Radar Check ── */
  useEffect(() => {
    if (!isOpen) return;
    
    if (isBusSpott && lat && lng && anchors.length > 0) {
      // Find nearest qualified anchor
      const sorted = [...anchors].sort((a, b) => 
        calculateDistance(lat, lng, a.lat, a.lng) - calculateDistance(lat, lng, b.lat, b.lng)
      );
      const closest = sorted[0];
      const dist = closest ? calculateDistance(lat, lng, closest.lat, closest.lng) : 9999;

      if (dist > 500) {
        setShowSuggest(true);
        setError(t("tooFarFromRoad"));
        setNearestAnchor(null);
      } else {
        setShowSuggest(false);
        setError(null);
        setNearestAnchor(closest);
      }
    } else if (!isBusSpott) {
      setShowSuggest(false);
      setNearestAnchor(null);
      if (error === t("tooFarFromRoad")) setError(null);
    }
  }, [isOpen, isBusSpott, lat, lng, anchors, t, error]);

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
 
    // Accuracy Gate for Radar
    if (isBusSpott && accuracy && accuracy > 300) {
      setError(t("lowAccuracyRadar"));
      setLoading(false);
      return;
    }

    // Proximity Gate for Radar (Anchor Gate)
    if (isBusSpott && lat && lng) {
        if (!isNearAnyAnchor(lat, lng, anchors, 500)) {
            setError(t("tooFarFromRoad"));
            setShowSuggest(true);
            setLoading(false);
            return;
        }
    }

    const combined = normalizeText(`${headline} ${details} ${landmark}`);
    if (BANNED_KEYWORDS.some((word: string) => combined.includes(normalizeText(word)))) {
      setError(t("restrictedLanguage"));
      return;
    }

    setLoading(true);
    setError(null);

    // Apply Coordinate Jittering (Privacy Protection)
    // ±0.0001 to ±0.0002 is approx 10-20 meters.
    const jitter = () => (Math.random() * 0.0002) - 0.0001;
    const jitteredLat = lat + jitter();
    const jitteredLng = lng + jitter();

    try {
      const postsRef = doc(collection(db, "posts"));
      const userRef = doc(db, "users", user.uid);

      const now = new Date();
      const expiresAt = isBusSpott ? new Date(now.getTime() + 20 * 60000) : null;

      await runTransaction(db, async (tx) => {
        tx.set(postsRef, {
          authorId: user.uid,
          authorName: profile?.name || user.displayName || t("nativeMember"),
          authorPhoto: profile?.photoURL || user.photoURL || "",
          headline: headline.trim(),
          details: details.trim(),
          landmark: landmark.trim(),
          category,
          type: isBusSpott ? "bus_spott" : "general",
          lat: jitteredLat,
          lng: jitteredLng,
          anchorId: nearestAnchor?.id || null,
          anchorName: nearestAnchor?.name || null,
          timingStatus: isBusSpott ? timingStatus : null,
          district: profile?.district || "",
          localBody: profile?.localBody || "",
          ward: profile?.ward || "",
          verifiedCount: 0,
          flagCount: 0,
          isHidden: false,
          isBusinessPost: false,
          createdAt: serverTimestamp(),
          expiresAt: expiresAt,
        });

        tx.set(userRef, {
          karmaTotal: increment(1),
          karmaWeekly: increment(1),
        }, { merge: true });
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

  const handleSuggestStop = async () => {
    if (!lat || !lng || !user) return;
    setSuggesting(true);
    const routeList = suggestedRoutes.split(",").map(r => r.trim()).filter(r => r !== "");
    try {
      await addDoc(collection(db, "bus_anchors"), {
        name: landmark || headline || "Suggested Stop",
        location: { latitude: lat, longitude: lng },
        verified: false,
        suggestedBy: user.uid,
        createdAt: serverTimestamp(),
        verifiedCount: 0,
        routes: routeList
      });
      showToast(t("stopSuggested"), "success");
      setShowSuggest(false);
      setSuggestedRoutes("");
    } catch (err) {
      console.error("Suggestion failed:", err);
      setError("Failed to send suggestion.");
    } finally {
      setSuggesting(false);
    }
  };

  const categories: { id: PostCategory; label: string; hint: string }[] = [
    { id: "Traffic", label: t("categoryTraffic"), hint: t("hintTraffic") },
    { id: "Utility", label: t("categoryUtility"), hint: t("hintUtility") },
    { id: "Market", label: t("categoryMarket"), hint: t("hintMarket") },
    { id: "Services", label: t("categoryServices"), hint: t("hintServices") },
    { id: "Health", label: t("categoryHealth"), hint: t("hintHealth") },
    { id: "Alerts", label: t("categoryAlerts"), hint: t("hintAlerts") },
    { id: "TownTalk", label: t("categoryTownTalk"), hint: t("hintTownTalk") },
  ];

  const QUICK_TAGS: Record<string, string[]> = {
    Traffic: ["RoadBlock", "Accident", "HeavyTraffic"],
    Utility: ["PowerCut", "WaterIssue", "StreetLight"],
    Market: ["FishPrice", "VeggiePrice", "ShopClosed"],
    Alerts: ["HeavyRain", "Hartal", "StrayDogs"],
    TownTalk: ["HiddenGems", "LocalFood", "Spotting"],
  };

  const getDynamicTitle = () => {
    if (category === "Traffic" && trafficMode === "bus") return t("titleRadar");
    return t(`title${category}`);
  };

  const getHeadlinePlaceholder = () => {
    if (category === "Market") return t("hintMarket").split(",")[0].trim();
    if (category === "Utility") return t("hintUtility").split(",")[0].trim();
    if (category === "Traffic") return t("hintTraffic").split(",")[3].trim();
    return t("headlinePlaceholder");
  };

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
        className="bg-white w-full max-w-[480px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300 overflow-hidden"
      >
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-5 pb-3 border-b border-gray-50 shrink-0">
          <h2 id="modal-title" className="text-lg font-black text-gray-900 leading-tight">{getDynamicTitle()}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label={t("cancel")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-hide">
          <form id="post-form" onSubmit={handleSubmit} className="space-y-4 pb-2">

          {/* Category selector */}
          <div className="space-y-2">
            <div role="radiogroup" aria-label="Post category" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`relative p-3.5 rounded-xl text-left transition-all duration-300 active:scale-[0.97] group ${
                    category === cat.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                      : "bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-80">{cat.label}</p>
                  <p className={`text-[10px] font-bold leading-tight ${category === cat.id ? "text-white/70" : "text-gray-400"}`}>
                    {cat.hint}
                  </p>
                </button>
              ))}
            </div>

            {/* Hint line - shows for selected category (only if not in specialized bus mode) */}
            {(category !== "Traffic" || trafficMode === "general") && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
                  <p className="text-[12px] font-bold text-gray-700">
                    {t(`prompt${category}`)}
                  </p>
                </div>

                {QUICK_TAGS[category] && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                    {QUICK_TAGS[category].map(tagKey => (
                      <button
                        key={tagKey}
                        type="button"
                        onClick={() => {
                          setHeadline(t(`tag${tagKey}`));
                          setError(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary/5 text-primary border border-primary/10 text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all active:scale-95"
                      >
                        {t(`tag${tagKey}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {category === "Traffic" && (
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
              <button
                type="button"
                onClick={() => {
                  setTrafficMode("bus");
                }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                  trafficMode === "bus" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                {t("busRadarMode") || "Bus Radar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrafficMode("general");
                }}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                  trafficMode === "general" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("otherTrafficMode") || "Other Issues"}
              </button>
            </div>
          )}

          {category === "Traffic" && trafficMode === "bus" ? (
            /* ── Bus Spott Specialized UI ── */
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 mb-2">
                  <p className="text-[12px] font-bold text-primary flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    {t("busSpottPrompt")}
                  </p>
                </div>
                <label className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 block mt-4">
                  {t("directionLabel")}
                </label>
                <div className="grid grid-cols-2 gap-3 min-h-[56px]">
                  <button
                    type="button"
                    onClick={() => {
                      setDetails("to_city");
                      setHeadline(t("towardsCity")); 
                    }}
                    className={`px-2 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 h-full min-h-[56px] ${
                      details === "to_city"
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/20 hover:bg-gray-100"
                    }`}
                  >
                    <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${details === "to_city" ? "opacity-100" : "opacity-40"}`} />
                    <span className="leading-tight text-center text-[11px] sm:text-[13px]">{t("towardsCity")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDetails("to_village");
                      setHeadline(t("towardsVillage"));
                    }}
                    className={`px-2 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 h-full min-h-[56px] ${
                      details === "to_village"
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/20 hover:bg-gray-100"
                    }`}
                  >
                    <span className="leading-tight text-center text-[11px] sm:text-[13px]">{t("towardsVillage")}</span>
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${details === "to_village" ? "opacity-100" : "opacity-40"}`} />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="bus-route" className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 mb-1 block">
                  {t("routeLabel")}
                </label>
                <input
                  id="bus-route"
                  type="text"
                  placeholder={t("enterRouteName")}
                  value={landmark}
                  disabled={loading}
                  onChange={(e) => setLandmark(e.target.value.slice(0, 50))}
                  className="w-full bg-gray-50 border-2 border-gray-100 py-4 px-5 rounded-2xl focus:border-primary outline-none transition-colors font-bold text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                  required
                />
              </div>

              {/* Quick Access Routes */}
              {isBusSpott && lat && lng && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {anchors
                    .filter(a => calculateDistance(lat, lng, a.lat, a.lng) <= 500)
                    .flatMap(a => a.routes || [])
                    .map((route, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLandmark(route)}
                        className="px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold hover:bg-primary/10 transition-colors"
                      >
                        {route}
                      </button>
                    ))
                  }
                </div>
              )}
              
              <div className={`p-3 rounded-xl flex gap-3 items-start transition-colors ${
                accuracy && accuracy <= 300 
                  ? "bg-green-50 border border-green-100" 
                  : "bg-blue-50 border border-blue-100"
              }`}>
                {accuracy && accuracy <= 300 ? (
                   <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse mt-0.5 shrink-0" />
                ) : (
                   <Send className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-[10px] font-bold leading-relaxed ${
                    accuracy && accuracy <= 300 ? "text-green-700" : "text-blue-700"
                  }`}>
                    {accuracy && accuracy <= 300 
                      ? (t("gpsLocked") || "High-Accuracy GPS Locked. Ready to Radar.")
                      : (t("gpsSnapInfo") || "Your current location will be used to radar this bus for neighbors.")
                    }
                  </p>
                  {accuracy && accuracy > 300 && (
                    <p className="text-[9px] text-blue-500/70 font-medium">
                      Current Accuracy: {Math.round(accuracy)}m (Target: &lt;300m)
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Default Post UI ── */
            <>
              {/* Headline */}
              <div className="relative">
                <label htmlFor="post-headline" className="sr-only">{t("headlineLabel")}</label>
                <input
                  id="post-headline"
                  type="text"
                  placeholder={getHeadlinePlaceholder()}
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
            </>
          )}

          {/* Error - Scoped to not show redundancy with suggestions */}
          {error && (!isBusSpott || !showSuggest || error !== t("tooFarFromRoad")) && (
            <div role="alert" className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl text-xs font-bold mt-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="p-5 border-t border-gray-50 bg-white shrink-0 sm:pb-5 pb-8 space-y-4">
          {/* Timing & Stop Context */}
          {isBusSpott && !showSuggest && (
            <div className="space-y-3">
              {nearestAnchor && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] font-bold text-primary italic">
                    {t("postingFrom")}: {nearestAnchor.name}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-3 gap-2">
                {(["on_time", "delayed", "just_missed"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setTimingStatus(status)}
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 ${
                      timingStatus === status 
                        ? "bg-primary text-white border-primary shadow-sm" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-primary/20"
                    }`}
                  >
                    {status === "on_time" && t("timingOnTime")}
                    {status === "delayed" && t("timingDelayed")}
                    {status === "just_missed" && t("timingJustMissed")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isBusSpott && showSuggest && (
            <div className="space-y-3 p-4 rounded-2xl bg-primary/5 border-2 border-primary/10 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  {t("suggestStopTitle")}
                </label>
                <p className="text-[11px] text-primary/70 font-bold px-1 mb-2">
                  {t("tooFarFromRoad")}
                </p>
                <input
                  type="text"
                  placeholder={t("commonRoutesHint")}
                  value={suggestedRoutes}
                  disabled={suggesting}
                  onChange={(e) => setSuggestedRoutes(e.target.value)}
                  className="w-full bg-white border-2 border-primary/10 py-3.5 px-4 rounded-xl focus:border-primary outline-none text-[13px] font-bold shadow-sm transition-all placeholder:text-gray-300"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-bold px-1 leading-tight italic">
                 {t("suggestionNote")}
              </p>
              <button
                onClick={handleSuggestStop}
                disabled={suggesting || !suggestedRoutes.trim()}
                className="w-full h-[48px] flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 transition-all"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 fill-white/20" />}
                {t("suggestStop")}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3.5 px-2 rounded-xl font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 text-[10px] border border-gray-100"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              form="post-form"
              disabled={loading || suggesting || !headline.trim()}
              className="flex items-center justify-center gap-2 py-3.5 px-2 rounded-xl font-black uppercase tracking-[2px] text-white bg-primary shadow-lg shadow-primary/20 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 text-[10px]"
            >
              {(loading || suggesting)
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Send className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="leading-none">{t("postUpdate")}</span></>
              }
            </button>
          </div>
        </div>

        {/* Required for Firebase Phone Auth reCAPTCHA */}
        <div id="recaptcha-container" className="hidden" />
      </div>
    </div>
  );
};

export default CreatePostModal;