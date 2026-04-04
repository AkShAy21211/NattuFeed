"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Loader2, Send, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

interface VerificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ROLES = [
  // === TIER 1: AUTHORITY & MEDICAL (High Trust - Blue/Emerald) ===
  { id: "police", label: "Police / Fire Officer", icon: "👮", tier: 1, color: "blue" },
  { id: "official", label: "Ward / Panchayat Officer", icon: "🏛️", tier: 1, color: "blue" },
  { id: "doctor", label: "Doctor", icon: "👨‍⚕️", tier: 1, color: "emerald" },
  { id: "nurse", label: "Nurse / Medical Staff", icon: "🏥", tier: 1, color: "emerald" },
  { id: "pharmacist", label: "Pharmacist", icon: "💊", tier: 1, color: "emerald" },

  // === TIER 2: COMMUNITY BACKBONE (Connector Trust - Purple/Indigo) ===
  { id: "asha", label: "ASHA Worker", icon: "👩‍⚕️", tier: 2, color: "purple" },
  { id: "kudumbashree", label: "Kudumbashree Member", icon: "👩‍🌾", tier: 2, color: "purple" },
  { id: "teacher", label: "Teacher / Principal", icon: "📚", tier: 2, color: "indigo" },
  { id: "priest", label: "Religious Leader", icon: "⛪", tier: 2, color: "purple" },
  { id: "shopkeeper", label: "Shop / Bakery Owner", icon: "☕", tier: 2, color: "indigo" },

  // === TIER 3: EYES & EARS (Utility Trust - Amber/Orange) ===
  { id: "auto", label: "Auto Rickshaw Driver", icon: "🛺", tier: 3, color: "amber" },
  { id: "bus", label: "Bus Conductor / Driver", icon: "🚌", tier: 3, color: "amber" },
  { id: "delivery", label: "Delivery Agent", icon: "📦", tier: 3, color: "amber" },
  { id: "worker", label: "Electrician / Plumber", icon: "🔧", tier: 3, color: "orange" },
  { id: "elder", label: "Ward Elder", icon: "👵", tier: 3, color: "orange" },
  { id: "volunteer", label: "NGO Volunteer", icon: "🤝", tier: 3, color: "orange" },

  // === CATCH-ALL ===
  { id: "other", label: "Other Trusted Position", icon: "✨", tier: 3, color: "gray" },
];

const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [proofDetails, setProofDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Check for existing request on open
  React.useEffect(() => {
    if (isOpen && user?.uid) {
      const checkStatus = async () => {
        setLoadingStatus(true);
        try {
          const docRef = doc(db, "verification_requests", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setExistingRequest(docSnap.data());
          } else {
            setExistingRequest(null);
          }
        } catch (error) {
          console.error("Error checking request status:", error);
        } finally {
          setLoadingStatus(false);
        }
      };
      checkStatus();
    }
  }, [isOpen, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "verification_requests", user.uid), {
        userId: user.uid,
        userName: profile?.name || user.displayName || "Unknown",
        userEmail: user.email || "",
        role,
        description,
        proofDetails,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      showToast(t("verificationRequestSent") || "Request sent successfully!", "success");
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setRole("");
        setDescription("");
      }, 3000);
    } catch (error) {
      console.error("Verification request error:", error);
      showToast(t("verificationRequestFailed") || "Failed to send request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-5 flex flex-col mx-0 sm:mx-4 animate-in slide-in-from-bottom duration-300 max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Professional Proof</h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Identify as a trusted source</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loadingStatus ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checking status...</p>
          </div>
        ) : isSuccess || (existingRequest?.status === "pending") ? (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className={`w-20 h-20 ${isSuccess || existingRequest?.status === "pending" ? "bg-amber-100 border-amber-50" : "bg-emerald-100 border-emerald-50"} rounded-full flex items-center justify-center mb-6 border-4`}>
              <CheckCircle2 className={`w-10 h-10 ${isSuccess || existingRequest?.status === "pending" ? "text-amber-600" : "text-emerald-600"}`} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
              {isSuccess || existingRequest?.status === "pending" ? "Under Review" : "Request Received!"}
            </h3>
            <p className="text-sm text-gray-500 max-w-[260px] font-medium leading-relaxed">
              {existingRequest?.status === "pending" 
                ? "Your professional verification is currently being reviewed by our ward monitors." 
                : "Our moderators will review your profile shortly. You'll see a badge once verified."}
            </p>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-gray-100"
            >
              Close Status
            </button>
          </div>
        ) : existingRequest?.status === "approved" ? (
          <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-50">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Profile Verified</h3>
            <p className="text-sm text-gray-500 max-w-[260px] font-medium leading-relaxed">
              You are already a verified **{existingRequest.role}**. Your updates carry maximum community trust.
            </p>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20"
            >
              Great, Thanks!
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                      role === r.id
                        ? "bg-primary/5 border-primary shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{r.icon}</span>
                      <span className={`text-[12px] font-bold ${role === r.id ? "text-primary" : "text-gray-700"}`}>
                        {r.label}
                      </span>
                    </div>
                    {role === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Proof Section */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">
                  {role === "elder" ? "Community History" : 
                   role === "transport" ? "Vehicle / Unit Details" :
                   role === "asha" || role === "kudumbashree" ? "Unit / Group Name" :
                   "Registration ID / Institution"}
                </label>
                <textarea
                  value={proofDetails}
                  onChange={(e) => setProofDetails(e.target.value)}
                  placeholder={
                    role === "doctor" ? "Ex: TCMC Registration #..." :
                    role === "police" || role === "official" ? "Ex: Department ID / Office Name..." :
                    role === "asha" ? "Ex: Primary Health Centre (PHC) name..." :
                    role === "kudumbashree" ? "Ex: ADS / CDS Unit Number..." :
                    role === "transport" ? "Ex: KL-13-A-1234 (Auto Number)..." :
                    role === "elder" ? "Ex: Lived in Ward 4 for 40 years..." :
                    "Ex: License number, institution address, or shop name..."
                  }
                  rows={2}
                  className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-2xl focus:border-primary outline-none transition-all text-[12px] font-medium min-h-[50px] resize-none"
                  required={["police", "doctor", "official", "asha", "kudumbashree", "teacher"].includes(role)}
                />
                {!["police", "doctor", "official", "asha", "kudumbashree", "teacher"].includes(role) && (
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider px-1">Optional for this role</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block px-1">
                  How do you help the community?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    role === "transport" ? "Mention your daily route or stand location..." :
                    role === "shopkeeper" ? "Mention your shop's daily presence..." :
                    role === "volunteer" ? "Describe your social service activities..." :
                    "What kind of updates do you plan to provide to your neighbors?"
                  }
                  className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-2xl focus:border-primary outline-none transition-all text-[12px] font-medium min-h-[80px] resize-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !role}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed px-4">
              By submitting, you agree to provide truthful information. Providing false details may lead to account restrictions.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerificationRequestModal;
