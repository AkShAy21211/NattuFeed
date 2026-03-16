import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User } from 'lucide-react';
import { useLanguage } from "@/context/LanguageContext";

const TabBar = () => {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav 
      aria-label="Main Navigation"
      className="fixed bottom-0 z-50 w-full max-w-[480px] mx-auto inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-100 py-3 px-6 flex justify-around items-center shadow-[0_-4px_24px_rgba(0,0,0,0.04)] pb-safe"
    >
      <Link 
        href="/" 
        id="tab-feed"
        className="flex flex-col items-center gap-1.5 group relative px-4"
        aria-label={t('feed')}
      >
        <Home 
          className={`w-6 h-6 transition-all duration-300 ${
            pathname === '/' ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[10px] font-bold leading-tight transition-all duration-300 ${
            pathname === '/' ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'
        }`}>
          {t('feed')}
        </span>
        {pathname === '/' && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
      
      <Link 
        href="/leaderboard" 
        id="tab-leaderboard"
        className="flex flex-col items-center gap-1.5 group relative px-4"
        aria-label={t('leaderboard')}
      >
        <Trophy 
          className={`w-6 h-6 transition-all duration-300 ${
            pathname === '/leaderboard' ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[10px] font-bold transition-all duration-300 ${
            pathname === '/leaderboard' ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'
        }`}>
          {t('leaderboard')}
        </span>
        {pathname === '/leaderboard' && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
      
      <Link 
        href="/profile" 
        id="tab-profile"
        className="flex flex-col items-center gap-1.5 group relative px-4"
        aria-label={t('profile')}
      >
        <User 
          className={`w-6 h-6 transition-all duration-300 ${
            pathname === '/profile' ? 'text-primary scale-110 fill-primary/10' : 'text-gray-400 group-hover:text-primary/70'
          }`} 
        />
        <span className={`text-[10px] font-bold transition-all duration-300 ${
            pathname === '/profile' ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'
        }`}>
          {t('profile')}
        </span>
        {pathname === '/profile' && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
        )}
      </Link>
    </nav>
  );
};

export default TabBar;
