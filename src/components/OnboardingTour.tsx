"use client";

import React, { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const OnboardingTour: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();

  useEffect(() => {
    // Only run for authenticated users who haven't completed onboarding
    // onboardingStep: 0 = Not started, 1 = Completed
    if (!user || profile?.onboardingStep !== 0) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: "#000000",
      overlayOpacity: 0.85,
      stagePadding: 8,
      nextBtnText: t("onboarding.nextBtn"),
      prevBtnText: t("onboarding.prevBtn"),
      doneBtnText: t("onboarding.finishBtn"),
      steps: [
        {
          element: "body",
          popover: {
            title: t("onboarding.welcomeTitle"),
            description: t("onboarding.welcomeDesc"),
            align: "start"
          }
        },
        {
          element: "#spott-bus-btn",
          popover: {
            title: t("onboarding.stepPostTitle"),
            description: t("onboarding.stepPostDesc"),
            side: "left",
            align: "center"
          }
        },
        {
          element: "#category-filters",
          popover: {
            title: t("onboarding.stepFilterTitle"),
            description: t("onboarding.stepFilterDesc"),
            side: "bottom",
            align: "start"
          }
        },
        {
          element: "#me-too-action",
          popover: {
            title: t("onboarding.stepVerifyTitle"),
            description: t("onboarding.stepVerifyDesc"),
            side: "top",
            align: "center"
          }
        },
        {
          element: "#tab-profile",
          popover: {
            title: t("onboarding.stepKarmaTitle"),
            description: t("onboarding.stepKarmaDesc"),
            side: "top",
            align: "center"
          }
        }
      ],
      onDestroyed: async () => {
        // Mark onboarding as completed in Firestore
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { onboardingStep: 1 });
        } catch (err) {
          console.error("Failed to update onboarding status:", err);
        }
      }
    });

    // Start tour with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, profile?.onboardingStep, t, language]);

  return null;
};

export default OnboardingTour;
