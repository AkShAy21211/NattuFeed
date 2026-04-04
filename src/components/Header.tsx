import { useLanguage } from "@/context/LanguageContext";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full bg-primary text-white py-2.5 sm:py-3 px-3.5 sm:px-6 shadow-md flex justify-between items-center"
    >
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative shrink-0 scale-90 sm:scale-100 transition-transform">
          <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
          <img src="/logo.png" alt="NattuFeed Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain relative z-10 drop-shadow-sm" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-lg sm:text-xl font-black tracking-tight leading-none drop-shadow-sm truncate">
            Nattu<span className="text-emerald-200">Feed</span>
          </h1>
          <span className={`font-bold text-emerald-100/80 leading-none mt-1.5 truncate ${language === 'ml' ? 'text-[10px] sm:text-[11px]' : 'text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em]'}`}>
            {t('localHub') || "Local Hub"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <NotificationBell />
        <div className="flex items-center bg-black/10 p-0.5 sm:p-1 rounded-full border border-white/10 backdrop-blur-sm">
          <button
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${language === "en" ? "bg-white text-primary shadow-sm" : "text-white/60 hover:text-white"
              }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("ml")}
            aria-pressed={language === "ml"}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${language === "ml" ? "bg-white text-primary shadow-sm" : "text-white/60 hover:text-white"
              }`}
          >
            ML
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
