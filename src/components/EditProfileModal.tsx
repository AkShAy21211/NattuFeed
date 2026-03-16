"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { KERALA_DISTRICTS, KERALA_LSG_DATA, District } from "@/constants/keralaData";
import { X, Save, Loader2, User, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, runTransaction, increment } from "firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState(profile?.name || "");
  const [district, setDistrict] = useState<District | "">(profile?.district as District || "");
  const [localBody, setLocalBody] = useState(profile?.localBody || "");
  const [ward, setWard] = useState(profile?.ward || "");
  const [ageGroup, setAgeGroup] = useState(profile?.ageGroup || "");
  const [lsgSearch, setLsgSearch] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);

  // Re-sync if profile changes while modal is closed
  React.useEffect(() => {
    if (isOpen && profile) {
      setName(profile.name || "");
      setDistrict(profile.district as District || "");
      setLocalBody(profile.localBody || "");
      setWard(profile.ward || "");
      setAgeGroup(profile.ageGroup || "");
      setLsgSearch("");
    }
  }, [isOpen, profile]);

  const filteredLsg = useMemo(() => {
    if (!district) return [];
    const bodies = KERALA_LSG_DATA[district] || [];
    if (!lsgSearch) return bodies.slice(0, 5);
    return bodies.filter((b) => 
      b.toLowerCase().includes(lsgSearch.toLowerCase())
    );
  }, [district, lsgSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(t("nameRequired"), "error");
      return;
    }

    if (!user || !profile) return;

    setIsUpdating(true);
    try {
      const isNewlyComplete = district && localBody && ward;
      const shouldGrantBonus = isNewlyComplete && !profile.identityBonusReceived;

      if (shouldGrantBonus) {
        const userRef = doc(db, "users", user.uid);
        await runTransaction(db, async (tx) => {
          tx.update(userRef, {
            name: name.trim(),
            district,
            localBody,
            ward,
            ageGroup,
            onboarded: true,
            identityBonusReceived: true,
            karmaTotal: increment(10),
            karmaWeekly: increment(10),
          });
        });
      } else {
        await updateProfile({
          name: name.trim(),
          district,
          localBody,
          ward,
          ageGroup,
          onboarded: true
        });
      }
      showToast(t('profileUpdated'), "success");
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      showToast(t("failedToUpdateProfile"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        className="bg-white w-full max-w-[440px] max-h-[85vh] sm:max-h-[80vh] overflow-y-auto rounded-3xl sm:rounded-[32px] shadow-2xl p-6 flex flex-col mx-4 mb-4 sm:mb-0 animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-black text-gray-900">{t('editProfile')}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-primary" />
              {t('fullNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-xl focus:border-primary outline-none transition-all font-medium text-gray-900"
              placeholder={t('fullNamePlaceholder')}
              required
            />
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Location Fields */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} className="text-emerald-500" />
              {t('primaryLocation')}
            </label>
            <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed">
              {t('locationTrustNote')}
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('selectDistrict')}</p>
                <div role="group" className="flex flex-wrap gap-2">
                  {KERALA_DISTRICTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDistrict(d);
                        setLocalBody(""); // reset local body when district changes
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        district === d 
                          ? "bg-emerald-600 text-white shadow-sm" 
                           : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {district && (
                <div className="space-y-4 pt-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('searchLocalBody')}</p>
                    <input
                      type="text"
                      placeholder={t('searchPanchayatPlaceholder')}
                      value={lsgSearch}
                      onChange={(e) => setLsgSearch(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-medium mb-2"
                    />
                    <div className="flex flex-wrap gap-2">
                      {filteredLsg.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setLocalBody(b);
                            setLsgSearch(""); // clear search on select
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                            localBody === b
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                      {filteredLsg.length === 0 && lsgSearch && (
                         <span className="text-xs text-gray-400 py-1">{t("noMatchesFound")}</span>
                      )}
                    </div>
                  </div>

                  <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('wardStreetOptional')}</p>
                     <input
                        type="number"
                        placeholder={t("wardStreetPlaceholder")}
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 py-3 px-4 rounded-xl focus:border-emerald-500 outline-none transition-all text-sm font-medium text-gray-900"
                     />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Age Group Field */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-blue-500" />
              {t('ageGroup')} <span className="text-[10px] text-gray-300 normal-case font-medium">{t('optionalLabel')}</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'youth', label: t('ageYouth') },
                { id: 'youngAdult', label: t('ageYoungAdult') },
                { id: 'middleAge', label: t('ageMiddleAge') },
                { id: 'senior', label: t('ageSenior') }
              ].map((age) => (
                <button
                  key={age.id}
                  type="button"
                  onClick={() => setAgeGroup(age.id)}
                  className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    ageGroup === age.id 
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                      : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 shrink-0 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95 order-2 sm:order-1"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-opacity-95 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 order-1 sm:order-2"
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t('saveChanges')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
