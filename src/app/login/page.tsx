"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Phone, ArrowLeft, Loader2, User as UserIcon, MapPin, Bus, ShoppingBag, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import type { ConfirmationResult } from "firebase/auth";

export default function LoginPage() {
  const { signInWithGoogle, signInWithOTP } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState("");
  
  // Toggle this to true to re-enable Phone OTP Authentication
  const SHOW_PHONE_AUTH = false;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      showToast(t("welcomeBack"), "success");
    } catch {
      showToast(t("googleFail"), "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Request OTP ── */
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      showToast(t("validPhone"), "error");
      return;
    }
    if (name.trim().length < 2) {
      showToast(t("validName") || "Please enter a valid name", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithOTP(`+91${phoneNumber}`, name.trim());
      setConfirmationResult(result);
      setOtpMode(true);
    } catch (err) {
      console.error("OTP request failed:", err);
      showToast(t("otpSendFail"), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify OTP ── */
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      showToast(t("welcomeBack"), "success");
      // AuthContext handles redirect after successful confirmation
    } catch (err) {
      console.error("OTP verification failed:", err);
      showToast(t("invalidOtp"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 overflow-hidden">
      
      {/* ── Background Flares ── */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
      <div className="absolute bottom-[20%] left-[-20%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      {/* ── Brand ── */}
      <div className="relative text-center mb-10 z-10">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl animate-pulse" />
          <img
            src="/logo.png"
            alt="NattuFeed Logo"
            className="relative w-24 h-24 drop-shadow-2xl"
          />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">NattuFeed</h1>
        <p className="text-sm font-bold text-primary tracking-[0.2em] uppercase mt-2 opacity-80">{t("connecting")}</p>
      </div>

      <div className="relative w-full max-w-sm space-y-4 z-10">

        {/* ════════ STEP 1: Phone + Name ════════ */}
        {!otpMode ? (
          <>
            {/* Google sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full h-16 flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 px-6 rounded-xl font-black text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-gray-200/20 uppercase text-[11px] tracking-wider"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <GoogleLogo />
              )}
              {t("contGoogle")}
            </button>

            {!SHOW_PHONE_AUTH && (
              <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-center mb-6">{t("featureTitle")}</p>
                <div className="grid grid-cols-2 gap-3">
                  <FeatureItem icon={<Bus className="w-5 h-5" />} label={t("featureTraffic")} />
                  <FeatureItem icon={<ShoppingBag className="w-5 h-5" />} label={t("featureMarket")} />
                  <FeatureItem icon={<ShieldAlert className="w-5 h-5" />} label={t("featureAlerts")} />
                  <FeatureItem icon={<CheckCircle2 className="w-5 h-5" />} label={t("featureTrust")} />
                </div>
              </div>
            )}

            {SHOW_PHONE_AUTH && (
              <>
                <Divider />

                {/* Phone + name form */}
                <form onSubmit={handleOtpRequest} className="space-y-3">
                  {/* Name */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pr-3 border-r-2 border-gray-200 flex items-center">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("fullNameLabel") || "Full Name"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border-2 border-gray-100 py-4 pl-14 pr-6 rounded-2xl focus:border-primary outline-none transition-colors font-medium shadow-sm"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pr-3 border-r-2 border-gray-200 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-600">+91</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={t("phonePlaceholder") || "00000 00000"}
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setPhoneNumber(val);
                      }}
                      className="w-full bg-white border-2 border-gray-100 py-4 pl-24 pr-6 rounded-2xl focus:border-primary outline-none transition-colors font-medium shadow-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length !== 10 || name.trim().length < 2}
                    className="w-full bg-primary text-white py-4 px-6 rounded-xl font-black uppercase tracking-[2px] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 text-[11px] shadow-lg shadow-primary/20"
                  >
                    {loading
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      : t("signInPhone")
                    }
                  </button>
                </form>
              </>
            )}
          </>

        ) : (
          /* ════════ STEP 2: OTP Entry ════════ */
          <form
            onSubmit={handleOtpVerify}
            className="space-y-5 animate-in slide-in-from-right duration-300"
          >
            <button
              type="button"
              onClick={() => { setOtpMode(false); setOtp(""); }}
              className="flex items-center gap-1.5 text-primary font-bold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToOptions")}
            </button>

            <div className="text-center">
              <h2 className="text-xl font-black text-gray-900">{t("verifyOtpTitle")}</h2>
              <p className="text-sm text-gray-400 mt-1">{t("sentTo", { phoneNumber })}</p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              placeholder="• • • • • •"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white border-2 border-gray-100 py-5 px-6 text-center text-3xl font-black tracking-[0.5em] rounded-2xl focus:border-primary outline-none transition-colors shadow-sm"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary text-white py-4 px-6 rounded-xl font-black uppercase tracking-[2px] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-[11px] shadow-lg shadow-primary/20"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><LogIn className="w-5 h-5" /> {t("confirmEnter")}</>
              }
            </button>
          </form>
        )}
      </div>

      {/* Required for Firebase Phone Auth reCAPTCHA — must stay in the DOM */}
      <div id="recaptcha-container" className="hidden" />

      <p className="mt-12 text-center text-[10px] text-gray-400 max-w-[280px] leading-relaxed relative z-10 font-medium">
        {t("legalNote")}{" "}
        <Link href="/terms" className="text-primary font-bold hover:underline">{t("termsOfServiceTitle")}</Link> &{" "}
        <Link href="/privacy" className="text-primary font-bold hover:underline">{t("privacyPolicyTitle")}</Link>
      </p>
    </div>
  );
}

/* ─── Small sub-components ──────────────────────────────────────── */

function FeatureItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-white/40 backdrop-blur-sm border border-gray-100 p-4 rounded-[2rem] flex flex-col items-center text-center gap-2 transition-all hover:border-primary/20 hover:bg-white/60">
      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-[10px] font-black leading-tight text-gray-600 line-clamp-2">{label}</span>
    </div>
  );
}

function Divider() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t("or")}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}