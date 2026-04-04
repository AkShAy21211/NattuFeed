import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Trophy, User } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

const TabBar = () => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isFeedActive = pathname === "/" || pathname.startsWith("/post/") || pathname.startsWith("/stop/") || pathname === "/guide";
  const isLeaderboardActive = pathname === "/leaderboard";
  const isSettingsActive = pathname === "/settings" || pathname === "/profile";

  return (
    <nav 
      aria-label="Main Navigation"
      className="fixed bottom-0 z-50 w-full max-w-[480px] mx-auto inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 py-3 px-6 flex justify-around items-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)] pb-safe"
    >
      <Link 
        href="/" 
        id="tab-feed"
        className="flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1.5 group relative px-4 rounded-xl"
        aria-label={t('feed')}
        aria-current={isFeedActive ? "page" : undefined}
      >
        <Home 
          className={`w-6 h-6 transition-all duration-300 ${
            isFeedActive ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[11px] font-bold leading-tight transition-all duration-300 ${
            isFeedActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary/70'
        }`}>
          {t('feed')}
        </span>
        {isFeedActive && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
      
      <Link 
        href="/leaderboard" 
        id="tab-leaderboard"
        className="flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1.5 group relative px-4 rounded-xl"
        aria-label={t('leaderboard')}
        aria-current={isLeaderboardActive ? "page" : undefined}
      >
        <Trophy 
          className={`w-6 h-6 transition-all duration-300 ${
            isLeaderboardActive ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[11px] font-bold transition-all duration-300 ${
            isLeaderboardActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary/70'
        }`}>
          {t('leaderboard')}
        </span>
        {isLeaderboardActive && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
      
      <Link 
        href="/settings" 
        id="tab-settings"
        className="flex min-h-[48px] min-w-[72px] flex-col items-center justify-center gap-1.5 group relative px-4 rounded-xl"
        aria-label={t('settings') || "Settings"}
        aria-current={isSettingsActive ? "page" : undefined}
      >
        <Settings
          className={`w-6 h-6 transition-all duration-300 ${
            isSettingsActive ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[11px] font-bold transition-all duration-300 ${
            isSettingsActive ? 'text-primary' : 'text-gray-500 group-hover:text-primary/70'
        }`}>
          {t('settings') || "Settings"}
        </span>
        {isSettingsActive && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
    </nav>
  );
};

export default TabBar;
