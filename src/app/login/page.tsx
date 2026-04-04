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

    } catch {
      showToast(t("googleFail"), "error");
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
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] sm:min-h-[80vh] px-6 overflow-hidden py-10">

      {/* ── Background Flares & Depth ── */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-[20%] left-[-20%] w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating Sparkles/Particles */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary/20 rounded-full animate-ping" />
      <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-emerald-400/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-10 w-1 h-1 bg-amber-400/20 rounded-full animate-ping" style={{ animationDelay: '3s' }} />

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

      <div className="relative w-full max-w-sm space-y-2 z-10">

        {/* ── Local Identity Hook ── */}
        <div className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block bg-white/60 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/40 shadow-sm relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-emerald-100/20 to-emerald-50/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <p className="text-[14px] font-black text-emerald-900 leading-tight flex items-center justify-center gap-2">
              {t('loginIdentityLine')}
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1 opacity-70">
              {t('loginIdentitySub')}
            </p>
          </div>
        </div>

        {/* ════════ STEP 1: Phone + Name ════════ */}
        {!otpMode ? (
          <>
            {/* Google sign-in */}
            {/* Google sign-in with Shimmer */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="group relative w-full h-16 flex items-center justify-center gap-3 bg-white border border-gray-100 py-4 px-6 rounded-2xl font-black text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.97] disabled:opacity-50 shadow-xl shadow-black/5 overflow-hidden uppercase text-[11px] tracking-[0.15em]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <div className="transition-transform group-hover:scale-110 duration-300">
                  <GoogleLogo />
                </div>
              )}
              {t("contGoogle")}
            </button>

            {!SHOW_PHONE_AUTH && (
              <div className="pt-4 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <p className="text-[12px] font-bold text-gray-400 text-center italic">
                  {t("connecting")}
                </p>
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
            className="space-y-6 animate-in slide-in-from-right duration-500 p-1"
          >
            <button
              type="button"
              onClick={() => { setOtpMode(false); setOtp(""); }}
              className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 px-3 py-2 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToOptions")}
            </button>

            <div className="text-center px-4">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{t("verifyOtpTitle")}</h2>
              <p className="text-[13px] font-bold text-gray-400 mt-2">{t("sentTo", { phoneNumber })}</p>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-focus-within:bg-primary/10 transition-colors" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="relative w-full bg-white/80 backdrop-blur-sm border-2 border-gray-100 py-6 px-6 text-center text-4xl font-black tracking-[0.4em] rounded-[2rem] focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-xl shadow-black/5"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary text-white py-5 px-6 rounded-2xl font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-[11px]"
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

      <p className="mt-8 text-center text-[10px] text-gray-400 max-w-[280px] leading-relaxed relative z-10 font-medium opacity-60">
        {t("legalNote")}{" "}
        <Link href="/terms" className="text-primary font-bold hover:underline">{t("termsOfServiceTitle")}</Link> &{" "}
        <Link href="/privacy" className="text-primary font-bold hover:underline">{t("privacyPolicyTitle")}</Link>
      </p>
    </div>
  );
}

/* ─── Small sub-components ──────────────────────────────────────── */


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