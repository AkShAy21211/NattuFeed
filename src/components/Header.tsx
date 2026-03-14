import { useLanguage } from "@/context/LanguageContext";

const Header = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header 
      role="banner"
      className="sticky top-0 z-50 w-full bg-primary text-white py-3 px-6 shadow-md flex justify-between items-center"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
          <img src="/logo.png" alt="NattuFeed Logo" className="w-10 h-10 object-contain relative z-10 drop-shadow-sm" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-xl font-black tracking-tight leading-none drop-shadow-sm">
            Nattu<span className="text-emerald-200">Feed</span>
          </h1>
          <span className="text-[9px] font-bold text-emerald-100/80 uppercase tracking-[0.2em] leading-none mt-1">
            {t('localHub') || "Local Hub"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/10 p-1 rounded-full border border-white/10 backdrop-blur-sm">
        <button
          onClick={() => setLanguage("en")}
          aria-pressed={language === "en"}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            language === "en" ? "bg-white text-primary shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("ml")}
          aria-pressed={language === "ml"}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
            language === "ml" ? "bg-white text-primary shadow-md" : "text-white/70 hover:text-white hover:bg-white/10"
          }`}
        >
          ML
        </button>
      </div>
    </header>
  );
};

export default Header;
