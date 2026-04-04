"use client";

import { useState, useEffect } from "react";

export function useDevice() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSize = () => {
      setIsDesktop(window.innerWidth > 1024);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return { isDesktop: mounted ? isDesktop : false, mounted };
}
