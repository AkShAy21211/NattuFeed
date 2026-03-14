"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Phone, ArrowLeft, Loader2, User as UserIcon } from "lucide-react";
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

  /* ── Google sign-in ── */
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
      // AuthContext handles redirect after successful confirmation
    } catch (err) {
      console.error("OTP verification failed:", err);
      showToast(t("invalidOtp"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6">

      {/* ── Brand ── */}
      <div className="text-center mb-10">
        <img
          src="/logo.png"
          alt="NattuFeed Logo"
          className="w-24 h-24 mx-auto mb-4 drop-shadow-lg"
        />
        <h1 className="text-3xl font-black text-primary tracking-tight">NattuFeed</h1>
        <p className="text-sm text-gray-400 mt-1.5">{t("connecting")}</p>
      </div>

      <div className="w-full space-y-4">

        {/* ════════ STEP 1: Phone + Name ════════ */}
        {!otpMode ? (
          <>
            {/* Google sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 px-6 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                /*
                 * FIX: was https://www.google.com/favicon.ico — that's a
                 * 16×16 favicon, not the Google brand logo. Using the
                 * official SVG logo instead.
                 */
                <GoogleLogo />
              )}
              {t("contGoogle")}
            </button>

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
                  className="w-full bg-gray-50 border-2 border-gray-100 py-4 pl-14 pr-6 rounded-2xl focus:border-primary outline-none transition-colors font-medium"
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
                  className="w-full bg-gray-50 border-2 border-gray-100 py-4 pl-24 pr-6 rounded-2xl focus:border-primary outline-none transition-colors font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10 || name.trim().length < 2}
                className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  : t("signInPhone")
                }
              </button>
            </form>
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

            {/*
             * FIX: added maxLength={6} and inputMode="numeric" so mobile
             * keyboards show a numpad and users can't paste a longer string.
             * tracking-[0.5em] instead of [1em] — [1em] was pushing the
             * last digit outside the input boundary on small screens.
             */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="• • • • • •"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-gray-50 border-2 border-gray-100 py-5 px-6 text-center text-3xl font-black tracking-[0.5em] rounded-2xl focus:border-primary outline-none transition-colors"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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

      <p className="mt-10 text-center text-xs text-gray-400 max-w-[280px] leading-relaxed">
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