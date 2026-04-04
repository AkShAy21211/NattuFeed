"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignalLow } from "lucide-react";
import Header from "@/components/Header";
import TabBar from "@/components/TabBar";
import InstallPrompt from "./InstallPrompt";
import IOSInstallPrompt from "./IOSInstallPrompt";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { LocationProvider } from "@/context/LocationContext";
import AuthGuard from "./AuthGuard";
import GuestActionSync from "./GuestActionSync";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPostPage = pathname.startsWith("/post/") && pathname.split("/").length === 3;
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <LocationProvider>
          <div className="mobile-container overflow-hidden flex flex-col h-screen">
            {isOffline && (
              <div
                role="alert"
                className="bg-red-600 text-white px-6 py-2 flex items-center justify-center gap-2 z-[1000] sticky top-0 animate-in slide-in-from-top duration-300"
              >
                <SignalLow className="w-3 h-3 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Connection lost. Check your internet.</span>
              </div>
            )}
            {!isPostPage && <Header />}
            <main id="main-content" className="flex-1 overflow-y-auto bg-white">
              <AuthGuard>
                {children}
              </AuthGuard>
            </main>
            {!isLoginPage && !isPostPage && <TabBar />}
            <InstallPrompt />
            <IOSInstallPrompt />
            <GuestActionSync />
          </div>
          </LocationProvider>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
