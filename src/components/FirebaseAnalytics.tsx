"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { app } from "@/lib/firebase";
import { usePathname, useSearchParams } from "next/navigation";
import { logEvent } from "firebase/analytics";

export default function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initAnalytics = async () => {
      const supported = await isSupported();
      if (supported) {
        const analytics = getAnalytics(app);
        
        // Log page view on route change
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        logEvent(analytics, "page_view", {
          page_path: url,
        });
      }
    };

    initAnalytics();
  }, [pathname, searchParams]);

  return null;
}
