"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { KERALA_DISTRICTS, KERALA_LSG_DATA, District } from "@/constants/keralaData";
import { MapPin, Search, ChevronRight, CheckCircle2, X } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

interface QuickSetupProps {
  forceShow?: boolean;
}

const QuickSetup: React.FC<QuickSetupProps> = ({ forceShow = false }) => {
  const { profile, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [district, setDistrict] = useState<District | "">(profile?.district as District || "");
  const [localBody, setLocalBody] = useState(profile?.localBody || "");
  const [ward, setWard] = useState(profile?.ward || "");
  const [lsgSearch, setLsgSearch] = useState(profile?.localBody || "");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isEditing = profile?.onboarded && forceShow;

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

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        district,
        localBody: localBody || lsgSearch, // Fallback to manual entry
        ward,
        onboarded: true,
      });
    } catch (error) {
      console.error("Save Profile Error", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSkip = async () => {
    await updateProfile({ onboarded: true });
  };

  return (
    <section 
      aria-labelledby="setup-title"
      className="mb-6 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 shadow-sm overflow-hidden relative"
    >
      {!forceShow && (
        <button 
          onClick={handleSkip}
          aria-label={t("skipSetup")}
          className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <X size={20} />
        </button>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <MapPin size={24} aria-hidden="true" />
        </div>
        <div>
          <h2 id="setup-title" className="text-xl font-bold text-gray-900">
            {isEditing ? t('editYourNeighborhood') : t('onboardingTitle')}
          </h2>
          <p className="text-sm text-gray-600">
            {isEditing ? t('editLocationSub') : t('onboardingSub')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1: District */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm font-medium text-emerald-800 mb-2">{t('selectDistrict')}</p>
            <div role="group" aria-label="District selection" className="flex flex-wrap gap-2">
              {KERALA_DISTRICTS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDistrict(d);
                    setStep(2);
                  }}
                  aria-pressed={district === d}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    district === d 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
                      : "bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: LSG / Local Body */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setStep(1)}
              className="text-xs text-emerald-600 font-medium mb-2 hover:underline"
            >
              {t('backDistricts')}
            </button>
            <p className="text-sm font-medium text-emerald-800 mb-2">{t('searchBody')}</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchBody')}
                value={lsgSearch}
                onChange={(e) => setLsgSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div role="listbox" aria-label="Local body results" className="flex flex-wrap gap-2 mb-4">
              {filteredLsg.map((b) => (
                <button
                  key={b}
                  role="option"
                  aria-selected={localBody === b}
                  onClick={() => {
                    setLocalBody(b);
                    setLsgSearch(b);
                    setStep(3);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  {b}
                </button>
              ))}
              {lsgSearch && !filteredLsg.includes(lsgSearch) && (
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-white text-emerald-600 border border-dashed border-emerald-400 rounded-xl text-sm italic"
                >
                  {t('using', { value: lsgSearch })}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Ward */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
             <button 
              onClick={() => setStep(2)}
              className="text-xs text-emerald-600 font-medium mb-2 hover:underline"
            >
              {t('backBodies', { district })}
            </button>
            <label htmlFor="ward-input" className="block text-sm font-medium text-emerald-800 mb-2">
              {t('wardTitle')}
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="ward-input"
                type="number"
                placeholder={t('wardPlaceholder')}
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="flex-1 w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isUpdating ? t('saving') : t('finish')}
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} className="flex gap-1 mt-6">
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            aria-hidden="true"
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-emerald-500" : "w-1.5 bg-emerald-200"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default QuickSetup;
