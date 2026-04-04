"use client";

import React, { useState, useEffect, useCallback } from "react";
import { collection, doc, runTransaction, serverTimestamp, increment, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { X, Send, Loader2, AlertCircle, Bus, Zap, AlertTriangle, ArrowLeft, ArrowRight, ArrowUpRight, ArrowDownRight, ChevronRight, MapPin, Settings, Lock, Search, CheckCircle2, Sparkles } from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import { BANNED_KEYWORDS, normalizeText } from "@/lib/moderation-rules";
import { PostCategory, PostSubType, UrgencyLevel, ContactMode } from "@/types/post";
import dynamic from "next/dynamic";
import { isNearAnyAnchor, getVerifiedAnchors, Anchor, calculateDistance } from "@/lib/anchors";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { useDevice } from "@/hooks/useDevice";
import { useGuestActions } from "@/hooks/useGuestActions";
import ConversionModal from "./ConversionModal";

const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => <div className="w-full h-40 bg-gray-100 animate-pulse rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400 font-bold uppercase tracking-widest">Waking up Map...</div>
});

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnchorId?: string;
  isPioneer?: boolean;
}

const DEFAULT_CATEGORY: PostCategory = "Traffic";

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, initialAnchorId, isPioneer }) => {
  const { user, profile } = useAuth();
  const { lat, lng, accuracy, isWithinKerala } = useLocationContext();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [headline, setHeadline] = useState("");
  const [details, setDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [category, setCategory] = useState<PostCategory>(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trafficMode, setTrafficMode] = useState<"bus" | "general">("bus");
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  const [suggestedRoutes, setSuggestedRoutes] = useState<string[]>([]);
  const [routeInput, setRouteInput] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [timingStatus, setTimingStatus] = useState<"on_time" | "delayed" | "just_missed">("on_time");
  const [nearestAnchor, setNearestAnchor] = useState<Anchor | null>(null);
  const [colorTag, setColorTag] = useState<"red" | "blue" | "green" | "white" | "maroon" | "yellow" | "premium" | "none">("none");
  const [autoStopName, setAutoStopName] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number, name: string } | null>(null);

  const [isQuickMode, setIsQuickMode] = useState(true);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { savePendingAction } = useGuestActions();
  const [predictedDirection, setPredictedDirection] = useState<"to_city" | "to_village">("to_city");
  const [subType, setSubType] = useState<PostSubType>(null);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>(null);
  const [contactMode, setContactMode] = useState<ContactMode>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [reward, setReward] = useState("");
  const [isInformational, setIsInformational] = useState(false);

  const { isDesktop } = useDevice();
  const isDev = process.env.NODE_ENV === 'development';
  const isSuperAdmin = (user?.uid === (process.env.NEXT_PUBLIC_ADMIN_UID || "YIk8fYx3n9Uwj4ygF4tnwVGFS8p2")) || isDev;

  const isBusSpott = category === "Traffic" && trafficMode === "bus";

  /* ── Reset form whenever modal opens ── */
  useEffect(() => {
    if (isOpen) {
      setHeadline("");
      setDetails("");
      setLandmark("");
      setSearchSuggestions([]);
      setSelectedLocation(null);
      const initialCategory = (isWithinKerala === false) ? "TownTalk" : DEFAULT_CATEGORY;
      setCategory(initialCategory);
      setTrafficMode((isDesktop && !isSuperAdmin) ? "general" : "bus");
      setError(null);
      setShowSuggest(false);
      setSuggestedName(""); // Reset manual stop name suggestion
      setAutoStopName(""); // Clear auto-detected name for fresh start
      setSuggestedRoutes([]);
      setRouteInput("");
      setTimingStatus("on_time");
      setSubType(null);
      setUrgencyLevel(null);
      setContactMode(null);
      setContactPhone("");
      setReward("");
      setIsInformational(false);

      // Predictive Direction Logic (Only for Bus Radar on open)
      const hour = new Date().getHours();
      let suggestedDir: "to_city" | "to_village" = "to_city";
      if (hour >= 5 && hour < 14) suggestedDir = "to_city";
      else if (hour >= 14 && hour < 22) suggestedDir = "to_village";
      
      setPredictedDirection(suggestedDir);
      setIsQuickMode(true);
      setDetails(suggestedDir);
      if (suggestedDir === "to_city") setHeadline(t("towardsCity") || "Towards City");
      else if (suggestedDir === "to_village") setHeadline(t("towardsVillage") || "Towards Village");

      setNearestAnchor(null);
      setColorTag("none");
      setAutoStopName("");

      // Fetch anchors
      getVerifiedAnchors().then(all => {
        setAnchors(all);
        if (initialAnchorId) {
          const found = all.find(a => a.id === initialAnchorId);
          if (found) {
            setNearestAnchor(found);
            setCategory("Traffic");
            setTrafficMode("bus");
            setLandmark(found.routes?.[0] || "");
          }
        }
      });
    }
  }, [isOpen, initialAnchorId, isWithinKerala]);

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

      if (dist > 500) { // Tightened from 1.5km to 500m for "Verified" reporting
        // No longer a hard error, just a secondary mode
        setShowSuggest(true);
        setError(null);
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

  /* ── Photon Geocoding Search (Autocomplete) ── */
  useEffect(() => {
    if (!landmark || landmark.length < 3 || isBusSpott || selectedLocation?.name === landmark) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Bias results to current location for hyperlocal relevance
        const biasParams = lat && lng ? `&lat=${lat}&lon=${lng}` : "";
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(landmark)}${biasParams}&limit=5`);
        const data = await res.json();
        setSearchSuggestions(data.features || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [landmark, isBusSpott, lat, lng, selectedLocation]);

  /* ── Auto-Detect Stop Name for Suggestions ── */
  useEffect(() => {
    if (!isOpen || !showSuggest || !lat || !lng || autoStopName || !isWithinKerala) return;

    const detectStop = async () => {
      const result = await reverseGeocode(lat, lng);
      if (result.displayName) {
        // e.g. "Azhikode, Kannur" -> take the first part
        const namePart = result.displayName.split(',')[0].trim();
        setAutoStopName(`${namePart} Stop`);
        // Only pre-fill the suggestion if we are actually in Kerala to avoid Bengaluru ghosting
        if (isWithinKerala) {
          setSuggestedName(`${namePart} Stop`);
          setLandmark(prev => prev || `${namePart} Stop`);
        }
      }
    };

    detectStop();
  }, [isOpen, showSuggest, lat, lng, autoStopName]);

  if (!isOpen) return null;

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // Phase 3: Guest Mode - Store and Convert
      savePendingAction({
        type: "post",
        data: {
          headline: headline.trim(),
          details: details.trim(),
          landmark: landmark.trim(),
          category,
          lat: selectedLocation?.lat || nearestAnchor?.lat || lat,
          lng: selectedLocation?.lng || nearestAnchor?.lng || lng,
          isBusSpott,
          timingStatus: isBusSpott ? timingStatus : null,
          colorTag: isBusSpott ? colorTag : null,
          anchorId: nearestAnchor?.id || null,
          anchorName: nearestAnchor?.name || null,
          // New Fields
          subType,
          urgencyLevel,
          contactMode,
          contactPhone,
          isResolved: isInformational,
          isInformational,
          reward: category === "GigsJobs" ? reward : undefined
        }
      });
      setShowConversionModal(true);
      return;
    }

    if (!headline.trim()) {
      setError(t("enterHeadline"));
      return;
    }

    // Structured categories require a sub-type selection
    if (["Health", "Utility", "Services"].includes(category) && !subType) {
      setError(t("selectTypeFirst"));
      return;
    }

    // When "Other" is picked, a custom headline is mandatory
    if (["Health", "Utility", "Services"].includes(category) && subType === "other" && !headline.trim()) {
      setError(t("enterHeadline"));
      return;
    }

    // Contact number required if user chose WhatsApp or Call
    if (contactMode) {
      if (!contactPhone.trim()) {
        setError(t("enterContactPhone"));
        return;
      }
      if (contactPhone.replace(/\D/g, '').length !== 10) {
        setError(t("invalidPhoneLength") || "Please enter a valid 10-digit number");
        return;
      }
    }

    if (!lat || !lng) {
      setError(t("locationRequired"));
      return;
    }

    // Accuracy Gate for Radar (RESTRICTED TO MOBILE ONLY - Bypass for Admin)
    if (isBusSpott) {
      if (isDesktop && !isSuperAdmin) {
        setError(t("mobileOnlyFeature") || "Bus Radar is a mobile-only feature for accuracy.");
        setLoading(false);
        return;
      }
      if (accuracy && accuracy > 500 && !isSuperAdmin) {
        setError(t("lowAccuracyRadar"));
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
      const expiresAt = isBusSpott ? new Date(now.getTime() + 30 * 60000) : null;

      const trustScore = profile?.isVerified ? 2 : ((profile?.karmaTotal || 0) >= 20 ? 1 : 0);

      await runTransaction(db, async (tx) => {
        tx.set(postsRef, {
          authorId: user.uid,
          authorName: profile?.name || user.displayName || t("nativeMember"),
          authorPhoto: profile?.photoURL || "",
          authorKarmaAtPost: profile?.karmaTotal || 0,
          trustScore: trustScore,
          headline: headline.trim(),
          details: details.trim(),
          landmark: landmark.trim(),
          category,
          type: isBusSpott ? "bus_spott" : "general",
          lat: selectedLocation?.lat || nearestAnchor?.lat || jitteredLat,
          lng: selectedLocation?.lng || nearestAnchor?.lng || jitteredLng,
          authorLat: lat,
          authorLng: lng,
          anchorId: nearestAnchor?.id || null,
          anchorName: nearestAnchor?.name || profile?.localBody || t("yourArea"), // Fallback to neighborhood
          timingStatus: isBusSpott ? timingStatus : null,
          colorTag: isBusSpott ? colorTag : null,
          district: profile?.district || "",
          localBody: profile?.localBody || "",
          ward: profile?.ward || "",
          verifiedCount: 0,
          flagCount: 0,
          isHidden: false,
          isBusinessPost: false,
          createdAt: serverTimestamp(),
          expiresAt: expiresAt,
          // New Fields
          subType,
          urgencyLevel,
          contactMode,
          contactPhone,
          isResolved: isInformational,
          isInformational,
          reward: category === "GigsJobs" ? reward : null
        });

        // Haptic Feedback
      });

      // Haptic Feedback
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }

      onClose();
      showToast(t("postedKarma"), "success");
    } catch (err) {
      console.error("Error creating post:", err);
      setError(t("failedToPost"));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSnap = async (
    busType: string, 
    directionKey: "to_city" | "to_village",
    color: string
  ) => {
    if (loading) return;
    
    // Generate post metadata once
    const isKSRTC = busType === "KSRTC";
    const busTypeName = isKSRTC ? (t("busCategoryKSRTC") || "KSRTC") : (t("busCategoryPrivate") || "Private Bus");
    
    // For KSRTC, we often use the Major District / Return terminology. 
    // For Private, we use Towards Town / Towards Village. 
    const upLabel = t("towardsTown") || "Towards Town";
    const downLabel = t("towardsVillage") || "Towards Village";
    const dirLabel = directionKey === "to_city" ? upLabel : downLabel;
    
    const finalHeadline = `${busTypeName} ${dirLabel}`;
    const finalLandmark = landmark || (nearestAnchor?.routes?.[0]) || autoStopName || t("atStop", { stop: nearestAnchor?.name || "Bus Stop" });

    if (!user) {
      // Phase 3: Guest Mode - Store and Convert
      savePendingAction({
        type: "post",
        data: {
          headline: finalHeadline,
          details: directionKey,
          landmark: finalLandmark,
          category: "Traffic",
          lat: nearestAnchor?.lat || lat,
          lng: nearestAnchor?.lng || lng,
          isBusSpott: true,
          timingStatus: timingStatus,
          colorTag: color,
          anchorId: nearestAnchor?.id || null,
          anchorName: nearestAnchor?.name || null,
          isResolved: false
        }
      });
      setShowConversionModal(true);
      return;
    }
    
    setLoading(true);
    try {
      const postsRef = doc(collection(db, "posts"));
      const trustScore = profile?.isVerified ? 2 : ((profile?.karmaTotal || 0) >= 20 ? 1 : 0);
      const expiresAt = new Date(Date.now() + 20 * 60000); // Radar window: 20 mins

      await runTransaction(db, async (tx) => {
        tx.set(postsRef, {
          authorId: user.uid,
          authorName: profile?.fullName || user.displayName || t("nativeMember"),
          authorPhoto: profile?.photoURL || "",
          authorKarmaAtPost: profile?.karmaTotal || 0,
          trustScore: trustScore,
          headline: finalHeadline,
          details: directionKey, 
          landmark: finalLandmark,
          category: "Traffic",
          type: "bus_spott",
          lat: nearestAnchor?.lat || lat,
          lng: nearestAnchor?.lng || lng,
          authorLat: lat,
          authorLng: lng,
          anchorId: nearestAnchor?.id || null,
          anchorName: nearestAnchor?.name || profile?.localBody || t("yourArea"),
          timingStatus: timingStatus,
          colorTag: color,
          district: profile?.district || "",
          localBody: profile?.localBody || "",
          verifiedCount: 1, // Self-witness
          flagCount: 0,
          isHidden: false,
          isBusinessPost: false,
          createdAt: serverTimestamp(),
          expiresAt: expiresAt,
        });

        // Award Rapid-Snap Karma
        const authorRef = doc(db, "users", user.uid);
        tx.update(authorRef, {
          karmaTotal: increment(2),
          karmaWeekly: increment(2)
        });
      });

      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([50, 30, 50]);
      }

      onClose();
      showToast(t("postedKarma"), "success");
    } catch (err) {
      console.error("Snap failure:", err);
      showToast(t("failedToPost"), "error");
    } finally {
      setLoading(false);
    }
  };

  const addRouteTag = () => {
    const trimmed = routeInput.trim();
    if (trimmed && !suggestedRoutes.includes(trimmed)) {
      setSuggestedRoutes(prev => [...prev, trimmed]);
      setRouteInput("");
    }
  };

  const removeRouteTag = (tag: string) => {
    setSuggestedRoutes(prev => prev.filter(r => r !== tag));
  };

  const handleSuggestStop = async () => {
    if (!lat || !lng || !user) return;
    setSuggesting(true);
    try {
      await addDoc(collection(db, "bus_anchors"), {
        name: suggestedName.trim() || autoStopName || landmark || "Suggested Stop",
        location: { latitude: lat, longitude: lng },
        verified: false,
        suggestedBy: user.uid,
        createdAt: serverTimestamp(),
        verifiedCount: 0,
        routes: suggestedRoutes
      });
      showToast(t("stopSuggested"), "success");
      setShowSuggest(false);
      setSuggestedRoutes([]);
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
    { id: "GigsJobs", label: t("categoryGigsJobs"), hint: t("hintGigsJobs") },
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

  const BUS_COLOR_STYLES: Record<string, { active: string; swatch: string }> = {
    green: { active: "bg-emerald-50 border-emerald-500 shadow-md scale-105", swatch: "bg-emerald-500 shadow-emerald-200" },
    blue: { active: "bg-blue-50 border-blue-500 shadow-md scale-105", swatch: "bg-blue-500 shadow-blue-200" },
    maroon: { active: "bg-rose-50 border-rose-900 shadow-md scale-105", swatch: "bg-[#800000] shadow-rose-900/20" },
    white: { active: "bg-gray-100 border-gray-300 shadow-md scale-105", swatch: "bg-white" },
    red: { active: "bg-red-50 border-red-500 shadow-md scale-105", swatch: "bg-red-500 shadow-red-200" },
    yellow: { active: "bg-amber-50 border-amber-500 shadow-md scale-105", swatch: "bg-amber-400 shadow-amber-200" },
    premium: { active: "bg-purple-50 border-purple-500 shadow-md scale-105", swatch: "bg-purple-600 shadow-purple-200" },
  };

  const getDynamicTitle = () => {
    if (category === "Traffic" && trafficMode === "bus") return t("titleRadar");
    return t(`title${category}`);
  };

  // Category-specific string helpers — use explicit maps so fallback always works
  const HEADLINE_PLACEHOLDERS: Record<string, string> = {
    Traffic:   t("placeHeadlineTraffic"),
    Utility:   t("placeHeadlineUtility"),
    Market:    t("placeHeadlineMarket"),
    Services:  t("placeHeadlineServices"),
    Health:    t("placeHeadlineHealth"),
    Alerts:    t("placeHeadlineAlerts"),
    GigsJobs:  t("placeHeadlineGigsJobs"),
    TownTalk:  t("placeHeadlineTownTalk"),
  };

  const DETAILS_PLACEHOLDERS: Record<string, string> = {
    Traffic:   t("placeDetailsTraffic"),
    Utility:   t("placeDetailsUtility"),
    Market:    t("placeDetailsMarket"),
    Services:  t("placeDetailsServices"),
    Health:    t("placeDetailsHealth"),
    Alerts:    t("placeDetailsAlerts"),
    GigsJobs:  t("placeDetailsGigsJobs"),
    TownTalk:  t("placeDetailsTownTalk"),
  };

  const LANDMARK_LABELS: Record<string, string> = {
    Traffic:   t("labelLandmarkTraffic"),
    Utility:   t("labelLandmarkUtility"),
    Market:    t("labelLandmarkMarket"),
    Services:  t("labelLandmarkServices"),
    Health:    t("labelLandmarkHealth"),
    Alerts:    t("labelLandmarkAlerts"),
    GigsJobs:  t("labelLandmarkGigsJobs"),
    TownTalk:  t("labelLandmarkTownTalk"),
  };

  const LANDMARK_PLACEHOLDERS: Record<string, string> = {
    Traffic:   t("placeLandmarkTraffic"),
    Utility:   t("placeLandmarkUtility"),
    Market:    t("placeLandmarkMarket"),
    Services:  t("placeLandmarkServices"),
    Health:    t("placeLandmarkHealth"),
    Alerts:    t("placeLandmarkAlerts"),
    GigsJobs:  t("placeLandmarkGigsJobs"),
    TownTalk:  t("placeLandmarkTownTalk"),
  };

  const getHeadlinePlaceholder = () => HEADLINE_PLACEHOLDERS[category] || t("headlinePlaceholder");
  const getDetailsPlaceholder  = () => DETAILS_PLACEHOLDERS[category]  || t("detailsPlaceholder");
  const getLandmarkLabel       = () => LANDMARK_LABELS[category]        || t("landmarkLabel");
  const getLandmarkPlaceholder = () => LANDMARK_PLACEHOLDERS[category]  || t("landmarkPlaceholder");

  return (
    <>
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
                {categories.map((cat) => {
                  const isLocked = (lat !== null && lng !== null) && !isWithinKerala && (
                    cat.id === "Traffic" || 
                    cat.id === "Alerts" || 
                    cat.id === "Utility" || 
                    cat.id === "Market" || 
                    cat.id === "Services" || 
                    cat.id === "GigsJobs" || 
                    cat.id === "Health"
                  );
                  
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          showToast(t("localOnlyCategory") || "Only neighbors around here can post in this category. Join the Town Talk instead!", "warning");
                          return;
                        }

                        // Reset all category-specific state on every switch to prevent bleed
                        setSubType(null);
                        setUrgencyLevel(null);
                        setContactMode(null);
                        setContactPhone("");
                        setReward("");
                        setError(null);

                        // Clear Traffic-specific auto-filled text
                        if (cat.id !== "Traffic") {
                          if (details === "to_city" || details === "to_village") setDetails("");
                          if (headline === (t("towardsCity") || "Towards City") || headline === (t("towardsVillage") || "Towards Village")) setHeadline("");
                        }

                        // Clear auto-set sub-type headlines from previous structured category
                        const prevStructured = ["Health", "Utility", "Services"].includes(category);
                        const nextStructured = ["Health", "Utility", "Services"].includes(cat.id);
                        if (prevStructured || nextStructured) setHeadline("");

                        setCategory(cat.id);
                      }}
                      className={`relative p-2.5 rounded-xl text-left transition-all duration-300 active:scale-[0.97] group ${category === cat.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                        : "bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100"
                        } ${isLocked ? "opacity-50 grayscale-[0.5]" : ""}`}
                    >
                      {isLocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1.5 opacity-80">{cat.label}</p>
                      <p className={`text-[10px] font-bold leading-tight ${category === cat.id ? "text-white/70" : "text-gray-400"}`}>
                        {cat.hint}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Hint line - shows for selected category (only if not in specialized bus mode) */}
              {(category !== "Traffic" || trafficMode === "general") && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
                    <p className="text-[12px] font-bold text-gray-700">
                      {t(`prompt${category}`)}
                    </p>
                  </div>

                  {QUICK_TAGS[category] && !["Health", "Services", "Utility", "GigsJobs"].includes(category) && (
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
                    if (isDesktop && !isSuperAdmin) {
                      showToast(t("mobileOnlyFeature") || "Bus Radar is a mobile-only feature for accuracy.", "warning");
                      return;
                    }
                    setTrafficMode("bus");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${trafficMode === "bus" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                    } ${isDesktop && !isSuperAdmin ? "opacity-50" : ""}`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  {t("busRadarMode") || "Bus Radar"}
                  {isDesktop && !isSuperAdmin && <Lock className="w-2.5 h-2.5 ml-1" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrafficMode("general");
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${trafficMode === "general" ? "bg-white text-primary shadow-sm" : "text-gray-400"
                    }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("otherTrafficMode") || "Other Issues"}
                </button>
              </div>
            )}

            {/* Sub-type & Urgency Conditional UI (Health, Services, Utility, GigsJobs) */}
            {["Health", "Services", "Utility", "GigsJobs"].includes(category) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-gray-50/50 p-4 rounded-[24px] border border-gray-100 mb-2">
                {/* Sub-type Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t("subTypeLabel")}</p>
                    {["Health", "Utility", "Services"].includes(category) && (
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">*Required</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category === "Health" && [
                      { id: "blood_request", label: t("subTypeBloodRequest") },
                      { id: "ambulance", label: t("subTypeAmbulance") },
                      { id: "pharmacy_info", label: t("subTypePharmacyInfo") },
                      { id: "other", label: t("subTypeOther") }
                    ].map(s => (
                      <button key={s.id} type="button" onClick={() => { 
                        setSubType(s.id as any); 
                        if (s.id !== "other") setHeadline(s.label);
                        else if (headline === t("subTypeBloodRequest") || headline === t("subTypeAmbulance") || headline === t("subTypePharmacyInfo")) setHeadline("");
                      }} className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${subType === s.id ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-600 hover:border-primary/20"}`}>{s.label}</button>
                    ))}
                    {category === "Services" && [
                      { id: "electrician", label: t("subTypeElectrician") },
                      { id: "plumber", label: t("subTypePlumber") },
                      { id: "driver", label: t("subTypeDriver") },
                      { id: "other", label: t("subTypeOther") }
                    ].map(s => (
                      <button key={s.id} type="button" onClick={() => {
                        setSubType(s.id as any);
                        if (s.id !== "other") setHeadline(s.label);
                        else if ([t("subTypeElectrician"), t("subTypePlumber"), t("subTypeDriver")].includes(headline)) setHeadline("");
                      }} className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${subType === s.id ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-600 hover:border-primary/20"}`}>{s.label}</button>
                    ))}
                    {category === "Utility" && [
                      { id: "power_cut", label: t("subTypePowerCut") },
                      { id: "water_issue", label: t("subTypeWaterIssue") },
                      { id: "road_issue", label: t("subTypeRoadIssue") },
                      { id: "other", label: t("subTypeOther") }
                    ].map(s => (
                      <button key={s.id} type="button" onClick={() => { 
                        setSubType(s.id as any); 
                        if (s.id !== "other") setHeadline(s.label);
                        else if (headline === t("subTypePowerCut") || headline === t("subTypeWaterIssue") || headline === t("subTypeRoadIssue")) setHeadline("");
                      }} className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${subType === s.id ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-600 hover:border-primary/20"}`}>{s.label}</button>
                    ))}
                    {category === "GigsJobs" && [
                      { id: "job_full_time", label: t("subTypeJobFullTime") },
                      { id: "job_part_time", label: t("subTypeJobPartTime") },
                      { id: "gig_one_time", label: t("subTypeGigOneTime") }
                    ].map(s => (
                      <button key={s.id} type="button" onClick={() => setSubType(s.id as any)} className={`p-3 rounded-xl border text-[11px] font-bold transition-all ${subType === s.id ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-600 hover:border-primary/20"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {category === "GigsJobs" && (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">
                      {subType === "gig_one_time" ? t("budgetLabel") : t("salaryLabel")}
                    </p>
                    <input 
                      type="text" 
                      value={reward} 
                      onChange={(e) => setReward(e.target.value)} 
                      placeholder={subType === "gig_one_time" ? "e.g. ₹500 (Fixed)" : "e.g. ₹15,000 / month"} 
                      className="w-full p-4 rounded-2xl bg-white border border-gray-100 focus:border-primary/30 outline-none text-sm font-bold text-gray-900 placeholder:text-gray-200 shadow-inner" 
                    />
                  </div>
                )}

                {/* Urgency Selector */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t("urgencyLabel")}</p>
                  <div className="flex gap-2">
                    {["low", "medium", "urgent"].map(level => (
                      <button key={level} type="button" onClick={() => setUrgencyLevel(level as any)} className={`flex-1 p-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${urgencyLevel === level ? (level === 'urgent' ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-200" : "bg-primary border-primary text-white shadow-md shadow-primary/20") : "bg-white border-gray-100 text-gray-400 hover:border-primary/20"}`}>{t(`urgency${level.charAt(0).toUpperCase() + level.slice(1)}`)}</button>
                    ))}
                  </div>
                </div>

                {/* Contact Mode - Hidden for Utility, Traffic, Alerts */}
                {!["Utility", "Traffic", "Alerts"].includes(category) && (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t("contactModeLabel")}</p>
                      <div className="flex gap-2">
                        {["whatsapp", "call"].map(mode => (
                          <button key={mode} type="button" onClick={() => setContactMode(mode as any)} className={`flex-1 p-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${contactMode === mode ? "bg-primary border-primary text-white shadow-md shadow-primary/20" : "bg-white border-gray-100 text-gray-400 hover:border-primary/20"}`}>{t(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}</button>
                        ))}
                      </div>
                    </div>

                    {contactMode && (
                      <div className="space-y-2 animate-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">{t("contactPhoneLabel")}</p>
                        <input 
                          type="tel" 
                          value={contactPhone} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) setContactPhone(val);
                          }} 
                          placeholder="0000000000" 
                          maxLength={10}
                          className="w-full p-4 rounded-2xl bg-white border border-gray-100 focus:border-primary/30 outline-none text-sm font-bold text-gray-900 placeholder:text-gray-200 shadow-inner" 
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {category === "Traffic" && trafficMode === "bus" ? (
              /* ── Bus Spott Strategy: Quick Snap Grid vs Manual ── */
              <div className="space-y-5 animate-in slide-in-from-right duration-300">
                {isQuickMode ? (
                  /* ── PHASE 1: THE GRID (1-Tap Flow) ── */
                  <div className="space-y-6">
                    {/* The Radar Snap Grid — Dual-Direction 1-Tap Utility */}
                    {nearestAnchor ? (
                      <div className="space-y-4">
                        {/* Precision Locating / Scanning State */}
                        {isDesktop ? (
                          <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                              <Lock className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-red-700 uppercase tracking-widest mb-1">Mobile Exclusive</p>
                               <p className="text-xs font-bold text-red-600/60 leading-tight">
                                  Live Bus Radar requires physical presence and high-precision GPS. Please use the mobile app to post snapshots.
                               </p>
                            </div>
                          </div>
                        ) : (!accuracy || accuracy > 200) ? (
                          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-4 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center relative">
                                <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none mb-1">{t("locating")}</p>
                                <p className="text-[11px] font-bold text-amber-600/70 uppercase tracking-tighter">Stabilizing Geofence...</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-amber-600/30 uppercase tracking-widest">{Math.round(accuracy || 0)}m</span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                              <Sparkles className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-bold text-emerald-900/70 leading-tight">
                                Tap the arrow corresponding to the bus direction.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className={`grid grid-cols-1 gap-4 transition-all duration-500 ${((!accuracy || accuracy > 500) || (isDesktop && !isSuperAdmin)) ? "opacity-30 grayscale pointer-events-none" : "opacity-100 grayscale-0"}`}>
                          {[
                            { id: "KSRTC", label: t("busCategoryKSRTC"), tag: "red", icon: <Zap className="w-4 h-4" />, bg: "bg-red-600" },
                            { id: "Private", label: t("busCategoryPrivate"), tag: "blue", icon: <Bus className="w-4 h-4" />, bg: "bg-sky-500" },
                          ].map((bus) => {
                            const upLabel = t("towardsTown") || "Towards Town";
                            const downLabel = t("towardsVillage") || "Towards Village";
                            
                            return (
                              <div key={bus.id} className="bg-white border border-gray-100 rounded-[28px] p-2 flex flex-col gap-2 shadow-sm group">
                                <div className="flex items-center gap-2 px-2 pt-1">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm ${bus.bg}`}>
                                    {bus.id.includes("KSRTC") ? <Zap className="w-3.5 h-3.5" /> : <Bus className="w-3.5 h-3.5" />}
                                  </div>
                                  <p className="text-[11px] font-black text-gray-900 tracking-tight">{bus.label}</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickSnap(bus.id, "to_city", bus.tag as any)}
                                    disabled={loading}
                                    className={`flex items-center justify-between p-4 rounded-2xl active:scale-95 transition-all outline-none border ${bus.id === 'KSRTC' ? 'bg-red-50/30 hover:bg-red-50 border-red-100/20' : 'bg-blue-50/30 hover:bg-blue-50 border-blue-100/20'} group/btn`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover/btn:scale-110 ${bus.bg}`}>
                                        <ArrowUpRight className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                                          {t("towards") || "Towards"}
                                        </span>
                                        <span className={`text-[15px] font-black leading-tight text-gray-900 ${language === 'ml' ? 'ml-text' : ''}`}>
                                          {upLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${bus.id === 'KSRTC' ? 'text-red-600/30' : 'text-blue-600/30'}`} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleQuickSnap(bus.id, "to_village", bus.tag as any)}
                                    disabled={loading}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-gray-50 active:scale-95 transition-all outline-none border border-gray-100/50 group/btn"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform group-hover/btn:scale-110 ${bus.bg}`}>
                                        <ArrowDownRight className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                                          {t("towards") || "Towards"}
                                        </span>
                                        <span className={`text-[15px] font-black leading-tight text-gray-900 ${language === 'ml' ? 'ml-text' : ''}`}>
                                          {downLabel}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setIsQuickMode(false)}
                          className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          {t("searchByRoute") || "Search Route / Manual Mode"}
                        </button>
                      </div>
                    ) : (
                      <div className="py-2">
                        {/* Instructional State for Unknown Anchors */}
                        <div className="bg-amber-50 p-4 rounded-[28px] border-2 border-amber-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                          <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-amber-500 mb-2.5 animate-pulse">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <h3 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">
                             New Radar Zone! 🛰️
                          </h3>
                          <p className="text-[10px] font-bold text-amber-800/60 leading-tight px-4">
                             {t("tooFarFromRoad") || "Name this stop to unlock Quick Radar here!"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer Stats / Status */}
                  </div>
                ) : (
                  /* ── PHASE 2: MANUAL FORM (Fallback) ── */
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2">
                       <button 
                         type="button"
                         onClick={() => setIsQuickMode(true)}
                         className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest"
                       >
                         <ArrowLeft className="w-3.5 h-3.5" />
                         {t("back")}
                       </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 block">
                        {t("category") || "Bus Type"}
                      </label>
                      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[24px]">
                        {[
                          { id: "KSRTC", label: t("busCategoryKSRTC"), color: "red", bg: "bg-red-600", active: "bg-white text-red-600 shadow-sm border-red-100" },
                          { id: "Private", label: t("busCategoryPrivate"), color: "blue", bg: "bg-sky-500", active: "bg-white text-sky-600 shadow-sm border-blue-100" },
                        ].map((cat) => {
                          const isActive = (cat.id === 'KSRTC' && colorTag === 'red') || (cat.id === 'Private' && colorTag === 'blue');
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setColorTag(cat.color as any);
                                setTrafficMode("bus");
                              }}
                              className={`flex-1 py-3 px-4 rounded-[20px] text-[11px] font-black transition-all border-2 flex items-center justify-center gap-2 ${
                                isActive 
                                  ? cat.active 
                                  : "border-transparent text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full ${cat.bg}`} />
                              {cat.label}
                            </button>
                          );
                        })}
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

                    <div className="grid grid-cols-2 gap-3 min-h-[56px]">
                      {(() => {
                        const upLabel = t("towardsTown") || "Towards Town";
                        const downLabel = t("towardsVillage") || "Towards Village";
                        
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setDetails("to_city");
                                setHeadline(upLabel);
                              }}
                              className={`px-3 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 h-full min-h-[64px] overflow-hidden ${details === "to_city"
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/20 hover:bg-gray-100"
                                }`}
                            >
                              <ArrowLeft className={`w-4 h-4 shrink-0 ${details === "to_city" ? "opacity-100" : "opacity-40"}`} />
                              <span className="leading-tight text-center text-[10px] sm:text-[13px] truncate uppercase tracking-tighter">
                                {upLabel}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDetails("to_village");
                                setHeadline(downLabel);
                              }}
                              className={`px-3 rounded-2xl font-black text-sm border-2 transition-all flex items-center justify-center gap-2 h-full min-h-[64px] overflow-hidden ${details === "to_village"
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/20 hover:bg-gray-100"
                                }`}
                            >
                              <span className="leading-tight text-center text-[10px] sm:text-[13px] truncate uppercase tracking-tighter">
                                {downLabel}
                              </span>
                              <ArrowRight className={`w-4 h-4 shrink-0 ${details === "to_village" ? "opacity-100" : "opacity-40"}`} />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Default Post UI ── */
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                {/* Map hidden for minimalist flow */}

                {/* Headline: hidden by default for structured categories (Health/Utility/Services), re-appears only when 'Other' is picked */}
                {(!['Utility', 'Health', 'Services'].includes(category) || subType === 'other') && (
                  <div className="space-y-1.5">
                    <label htmlFor="post-headline" className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 block">
                      {t("headlineLabel")}
                    </label>
                    <div className="relative">
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
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold ${headline.length >= 100 ? "text-red-500" : "text-gray-300"}`}>
                        {headline.length}/100
                      </span>
                    </div>
                  </div>
                )}

                {/* Landmark with Autocomplete */}
                <div className="relative">
                  <div className="flex items-center justify-between ml-1 mb-1">
                    <label htmlFor="post-landmark" className="text-[9px] font-black uppercase tracking-widest text-primary/50 block">
                      {getLandmarkLabel()}
                    </label>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{t("optionalLabel")}</span>
                  </div>
                  <div className="relative group">
                    <input
                      id="post-landmark"
                      type="text"
                      placeholder={getLandmarkPlaceholder()}
                      value={landmark}
                      disabled={loading}
                      onChange={(e) => {
                        setLandmark(e.target.value.slice(0, 50));
                        if (selectedLocation) setSelectedLocation(null);
                      }}
                      className={`w-full bg-gray-50 border-2 py-3 px-5 rounded-2xl focus:border-primary outline-none transition-all font-medium text-sm text-gray-900 placeholder:text-gray-400 disabled:opacity-50 ${selectedLocation ? "border-emerald-500 shadow-sm shadow-emerald-500/10" : "border-gray-100"}`}
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    )}
                    {selectedLocation && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                        <MapPin className="w-4 h-4 fill-emerald-500/20" />
                      </div>
                    )}
                  </div>

                  {/* Search Suggestions Dropdown */}
                  {searchSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {searchSuggestions.map((feat: any, idx: number) => {
                        const name = feat.properties.name || feat.properties.street || "Unknown Place";
                        const context = [feat.properties.city, feat.properties.state].filter(Boolean).join(", ");
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const [lon, lat] = feat.geometry.coordinates;
                              setLandmark(name);
                              setSelectedLocation({ lat, lng: lon, name });
                              setSearchSuggestions([]);
                            }}
                            className="w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                          >
                            <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-900 leading-none mb-1">{name}</p>
                              {context && <p className="text-[10px] text-gray-400 font-medium">{context}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="relative">
                  <div className="flex items-center justify-between ml-1 mb-1">
                    <label htmlFor="post-details" className="text-[9px] font-black uppercase tracking-widest text-primary/50 block">{t("detailsLabel")}</label>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{t("optionalLabel")}</span>
                  </div>
                  <textarea
                    id="post-details"
                    placeholder={getDetailsPlaceholder()}
                    value={details}
                    disabled={loading}
                    onChange={(e) => setDetails(e.target.value.slice(0, 1500))}
                    rows={3}
                    className="w-full bg-gray-50 border-2 border-gray-100 py-4 px-5 rounded-2xl focus:border-primary outline-none transition-colors text-sm text-gray-600 placeholder:text-gray-400 resize-none font-medium disabled:opacity-50"
                  />
                  <span className={`absolute right-4 bottom-2 text-[10px] font-bold ${details.length >= 1500 ? "text-red-500" : "text-gray-300"}`}>
                    {details.length}/1500
                  </span>
                </div>

                {/* Post Intent (Temporary tracking vs Static Info) */}
                {['Health', 'Utility', 'Services'].includes(category) && (
                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary/50 ml-1 block mb-2">
                      {t("postIntentTitle") || "What kind of update is this?"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInformational(false)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                          !isInformational 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-primary/20"
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full absolute top-3.5 right-3 ${!isInformational ? 'bg-primary' : 'bg-gray-200'}`} />
                        <span className={`block text-[11px] font-black uppercase tracking-widest mb-1 leading-none ${!isInformational ? 'text-primary' : 'text-gray-400'}`}>{t("postIntentLive") || "Live Issue"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInformational(true)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-center min-h-[50px] ${
                          isInformational 
                            ? "bg-emerald-50 border-emerald-500 shadow-sm" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-emerald-500/20"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full absolute top-1/2 -translate-y-1/2 right-3 ${isInformational ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                        <span className={`block text-[11px] font-black uppercase tracking-widest mb-1 leading-none ${isInformational ? 'text-emerald-600' : 'text-gray-400'}`}>{t("postIntentInfo") || "General Info"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                    className={`py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-2 ${timingStatus === status
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
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-1">
                      {t("stopNameLabel") || "Stop Name"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Town Hospital Stop"
                      value={suggestedName}
                      disabled={suggesting}
                      onChange={(e) => setSuggestedName(e.target.value)}
                      className="w-full bg-white border-2 border-primary/10 py-3.5 px-4 rounded-xl focus:border-primary outline-none text-[13px] font-bold shadow-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary/40 ml-1">
                      {t("commonRoutesLabel") || "Routes passing here"}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2 p-1">
                      {suggestedRoutes.map((route, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 animate-in zoom-in duration-200">
                          <span className="text-[11px] font-bold">{route}</span>
                          <button 
                            type="button" 
                            onClick={() => removeRouteTag(route)}
                            className="p-0.5 hover:bg-primary/20 rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {suggestedRoutes.length === 0 && (
                        <p className="text-[10px] text-gray-300 font-bold italic py-1 leading-none ml-1">
                           No routes added yet...
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t("commonRoutesHint") || "e.g. To City, 12, Fast"}
                        value={routeInput}
                        disabled={suggesting}
                        onChange={(e) => setRouteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRouteTag();
                          }
                        }}
                        className="w-full bg-white border-2 border-primary/10 py-3.5 pl-4 pr-12 rounded-xl focus:border-primary outline-none text-[13px] font-bold shadow-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={addRouteTag}
                        disabled={!routeInput.trim() || suggesting}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-sm active:scale-95 disabled:opacity-30 transition-all font-black text-xl"
                      >
                         +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold px-1 leading-tight italic">
                {t("suggestionNote")}
              </p>
              <button
                onClick={handleSuggestStop}
                disabled={suggesting || !suggestedName.trim()}
                className="w-full h-[48px] flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 transition-all"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 fill-white/20" />}
                {t("suggestStop")}
              </button>
            </div>
          )}

          {/* Dev Sync Utility (Merged with ID to prevent duplicates) */}
          {process.env.NODE_ENV === "development" && (
            <div className="flex justify-start px-1 mb-2">
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Sync 7 Anchors to Firebase? (Existing IDs will be updated/merged, no duplicates)")) {
                    setLoading(true);
                    const { seedAnchorsToFirestore } = await import("./../lib/anchors");
                    const res = await seedAnchorsToFirestore();
                    setLoading(false);
                    if (res.success) alert(`✅ Synced ${res.count} anchors to Firestore!`);
                  }
                }}
                className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-gray-300 hover:text-primary transition-all p-1"
              >
                <Settings className="w-3 h-3 opacity-40" />
                Dev: Sync Anchors
              </button>
            </div>
          )}

          <div className={`grid ${(!isQuickMode || category !== "Traffic" || trafficMode !== "bus") ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3.5 px-2 rounded-xl font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 text-[10px] border border-gray-100"
            >
              {t("cancel")}
            </button>
            {(!isQuickMode || category !== "Traffic" || trafficMode !== "bus") && (
              <button
                type="submit"
                form="post-form"
                disabled={loading || suggesting || (!headline.trim() && category !== "Traffic")}
                className="flex items-center justify-center gap-2 py-3.5 px-2 rounded-xl font-black uppercase tracking-[2px] text-white bg-primary shadow-lg shadow-primary/20 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50 text-[10px]"
              >
                {(loading || suggesting)
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><Send className="w-4 h-4 shrink-0" aria-hidden="true" /> <span className="leading-none">{t("postUpdate")}</span></>
                }
              </button>
            )}
          </div>
        </div>

        {/* Required for Firebase Phone Auth reCAPTCHA */}
        <div id="recaptcha-container" className="hidden" />
      </div>
    </div>

    <ConversionModal 
      isOpen={showConversionModal} 
      onClose={() => setShowConversionModal(false)}
      actionType="post"
      karmaAmount={isBusSpott ? 5 : 2}
    />
    </>
  );
};

export default CreatePostModal;