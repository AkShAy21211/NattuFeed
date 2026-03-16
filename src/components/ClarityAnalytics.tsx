"use client";

import { useEffect } from "react";
import clarity from "@microsoft/clarity";

export default function ClarityAnalytics() {
  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    
    if (clarityId) {
      console.log("🔍 Clarity: Initializing tracking...");
      clarity.init(clarityId);
    } else {
      console.warn("⚠️ Clarity: Project ID missing in environment variables.");
    }
  }, []);

  return null;
}
