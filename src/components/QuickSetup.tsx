"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { KERALA_DISTRICTS, KERALA_LSG_DATA, District } from "@/constants/keralaData";
import { MapPin, Search, ChevronRight, CheckCircle2, Loader2, Star, RotateCcw, ChevronDown, ArrowRight } from "lucide-react";
import { useLocationContext } from "@/context/LocationContext";
import { reverseGeocode, DetectedLocation } from "@/lib/reverseGeocode";

import { useLanguage } from "@/context/LanguageContext";
import { db } from "@/lib/firebase";
import { doc, runTransaction, increment } from "firebase/firestore";

interface QuickSetupProps {
  forceShow?: boolean;
}

type SetupMode = 'detecting' | 'confirm' | 'manual' | 'saving';

const QuickSetup: React.FC<QuickSetupProps> = ({ forceShow = false }) => {
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { lat, lng, loading: locationLoading } = useLocationContext();

  // Detected location from GPS
  const [detected, setDetected] = useState<DetectedLocation | null>(null);
  const [detecting, setDetecting] = useState(false);

  // Manual fallback state
  const [mode, setMode] = useState<SetupMode>('detecting');
  const [district, setDistrict] = useState<District | "">(profile?.district as District || "");
  const [localBody, setLocalBody] = useState(profile?.localBody || "");
  const [lsgSearch, setLsgSearch] = useState(profile?.localBody || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const isEditing = profile?.onboarded && forceShow;

  // Auto-detect location when GPS coordinates are available
  useEffect(() => {
    if (lat && lng && !detected && !detecting && !isEditing) {
      setDetecting(true);
      reverseGeocode(lat, lng).then((result) => {
        setDetected(result);
        if (result.district) {
          setDistrict(result.district);
          setLocalBody(result.localBody || "");
          setLsgSearch(result.localBody || "");
        }
        setMode(result.district ? 'confirm' : 'manual');
        setDetecting(false);
      }).catch(() => {
        setMode('manual');
        setDetecting(false);
      });
    } else if (!locationLoading && !lat && !detecting) {
      // GPS failed or denied — go to manual mode
      setMode('manual');
    }
  }, [lat, lng, locationLoading]);

  // For editing mode, start in manual
  useEffect(() => {
    if (isEditing) setMode('manual');
  }, [isEditing]);

  const filteredLsg = useMemo(() => {
    if (!district) return [];
    const bodies = KERALA_LSG_DATA[district] || [];
    if (!lsgSearch) return bodies.slice(0, 5);
    return bodies.filter((b) =>
      b.toLowerCase().includes(lsgSearch.toLowerCase())
    );
  }, [district, lsgSearch]);

  // Only show if user is logged in, and they are either not onboarded OR forceShow is true
  if (!profile || (profile.onboarded && !forceShow)) return null;

  const handleSave = async (saveDistrict?: District | "", saveLocalBody?: string) => {
    if (!profile || !user) return;
    const finalDistrict = saveDistrict ?? district;
    const finalLocalBody = saveLocalBody ?? localBody ?? lsgSearch;

    setIsUpdating(true);
    setMode('saving');
    try {
      const isNewlyComplete = finalDistrict && finalLocalBody;
      const shouldGrantBonus = isNewlyComplete && !profile.identityBonusReceived;

      if (shouldGrantBonus) {
        const userRef = doc(db, "users", user.uid);
        await runTransaction(db, async (tx) => {
          tx.update(userRef, {
            karmaTotal: increment(5),
            karmaWeekly: increment(5),
            identityBonusReceived: true,
            district: finalDistrict,
            localBody: finalLocalBody,
            ward: "",
            onboarded: true
          });
        });
      } else {
        await updateProfile({
          district: finalDistrict,
          localBody: finalLocalBody,
          ward: "",
          onboarded: true,
        });
      }
    } catch (error) {
      console.error("Save Profile Error", error);
      setMode('confirm');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section
      aria-labelledby="setup-title"
      className="mb-6 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm overflow-hidden relative"
    >
      {/* ── Header ── */}
      {!isEditing && (
        <div className="flex items-center gap-2 mb-4 bg-white/40 rounded-2xl p-2 px-3 border border-white/20 self-start">
          <Star size={12} className="fill-amber-400 text-amber-500" />
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
            {t('profileIdentityBonus')}
          </span>
        </div>
      )}

      <div className="space-y-4">
        {/* ═══════════════════════════════════════════ */}
        {/* MODE: Detecting (Loading) */}
        {/* ═══════════════════════════════════════════ */}
        {(mode === 'detecting' || detecting) && (
          <div className="flex flex-col items-center py-6 animate-in fade-in duration-300">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-bold text-emerald-700">
              {t('detectingLocation') || 'Detecting your neighborhood...'}
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              {t('detectingLocationSub') || 'Using GPS to find your area'}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MODE: Confirm (1-tap) */}
        {/* ═══════════════════════════════════════════ */}
        {mode === 'confirm' && detected && !detecting && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            {/* Detected location display */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-emerald-100/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-emerald-100 p-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                    {t('locationDetected') || 'Location Detected'}
                  </p>
                </div>
                <h3 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
                  {detected.localBody || detected.displayName || 'Your Area'}
                </h3>
                {detected.district && (
                  <p className="text-[13px] font-bold text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <MapPin size={12} className="text-gray-300" />
                    {detected.district} District
                  </p>
                )}
              </div>
            </div>

            {/* Confirm + Change buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSave(detected.district || undefined, detected.localBody || detected.displayName || undefined)}
                disabled={isUpdating}
                className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-[0.1em] rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xl shadow-emerald-100 flex justify-center items-center gap-2.5 active:scale-[0.97] text-sm"
              >
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t('yesThatsMe') || "Confirm Location"}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                onClick={() => setMode('manual')}
                className="self-center flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
              >
                <RotateCcw size={12} />
                {t('changeLocation') || 'Change Location'}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MODE: Saving */}
        {/* ═══════════════════════════════════════════ */}
        {mode === 'saving' && (
          <div className="flex flex-col items-center py-6 animate-in fade-in duration-300">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-bold text-emerald-700">
              {t('saving') || 'Setting up your feed...'}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MODE: Manual (Fallback — 2-step) */}
        {/* ═══════════════════════════════════════════ */}
        {mode === 'manual' && !detecting && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
            {/* District Picker */}
            {!district ? (
              <div>
                <p className="text-sm font-medium text-emerald-800 mb-2">{t('selectDistrict')}</p>
                <div role="group" aria-label="District selection" className="flex flex-wrap gap-2">
                  {KERALA_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDistrict(d)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:scale-95"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Local Body Search + Save */
              <div className="space-y-3">
                {/* Selected district chip */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setDistrict(""); setLocalBody(""); setLsgSearch(""); }}
                    className="text-xs text-emerald-600 font-medium hover:underline"
                  >
                    ← {t('backDistricts') || 'Back to districts'}
                  </button>
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">
                    {district}
                  </span>
                </div>

                {/* Search */}
                <p className="text-sm font-medium text-emerald-800">{t('searchBody')}</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={lsgSearch}
                    onChange={(e) => { setLsgSearch(e.target.value); setLocalBody(""); }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Results */}
                <div className="flex flex-wrap gap-2">
                  {filteredLsg.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setLocalBody(b); setLsgSearch(b); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        localBody === b
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {b}
                    </button>
                  ))}
                  {lsgSearch && !filteredLsg.includes(lsgSearch) && (
                    <button
                      onClick={() => setLocalBody(lsgSearch)}
                      className={`px-4 py-2 border border-dashed rounded-xl text-sm italic ${
                        localBody === lsgSearch
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-emerald-600 border-emerald-400"
                      }`}
                    >
                      {t('using', { value: lsgSearch })}
                    </button>
                  )}
                </div>

                {/* Save button */}
                {(localBody || lsgSearch) && (
                  <button
                    onClick={() => handleSave()}
                    disabled={isUpdating}
                    className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t('finish')}
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {mode !== 'saving' && (
        <div className="flex gap-1 mt-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${
            mode === 'detecting' ? 'w-8 bg-emerald-500 animate-pulse' : 'w-8 bg-emerald-500'
          }`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${
            mode === 'confirm' || mode === 'manual' ? 'w-8 bg-emerald-500' : 'w-1.5 bg-emerald-200'
          }`} />
        </div>
      )}
    </section>
  );
};

export default QuickSetup;
