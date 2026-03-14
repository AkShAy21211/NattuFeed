"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { KERALA_DISTRICTS, KERALA_LSG_DATA, District } from "@/constants/keralaData";
import { X, Save, Loader2, User, MapPin } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState(profile?.name || "");
  const [district, setDistrict] = useState<District | "">(profile?.district as District || "");
  const [localBody, setLocalBody] = useState(profile?.localBody || "");
  const [ward, setWard] = useState(profile?.ward || "");
  const [lsgSearch, setLsgSearch] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);

  // Re-sync if profile changes while modal is closed
  React.useEffect(() => {
    if (isOpen && profile) {
      setName(profile.name || "");
      setDistrict(profile.district as District || "");
      setLocalBody(profile.localBody || "");
      setWard(profile.ward || "");
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

    setIsUpdating(true);
    try {
      await updateProfile({
        name: name.trim(),
        district,
        localBody,
        ward,
        onboarded: true
      });
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
          <h2 className="text-xl font-black text-gray-900">{t('editLocationTitle')}</h2>
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

          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-6 shrink-0 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isUpdating || !name.trim()}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white bg-primary hover:bg-opacity-95 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
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
