"use client";

import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface KarmaNotificationProps {
  isVisible: boolean;
  onComplete: () => void;
}

const KarmaNotification: React.FC<KarmaNotificationProps> = ({ isVisible, onComplete }) => {
  const { t } = useLanguage();
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender) return null;

  return (
    <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="flex items-center gap-1.5 bg-accent text-white px-3 py-1.5 rounded-full shadow-lg font-black text-xs animate-in slide-in-from-bottom-4 fade-in zoom-in duration-300 fill-mode-forwards">
        <Star className="w-3.5 h-3.5 fill-current text-white" />
        {t('plus1Karma')}
      </div>
    </div>
  );
};

export default KarmaNotification;
