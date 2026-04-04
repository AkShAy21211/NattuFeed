"use client";

import React, { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, writeBatch, limit
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Bell, Clock, X } from "lucide-react";

interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPhoto?: string;
  postId: string;
  postHeadline: string;
  type: "reaction" | "radar_verify";
  detail: string;
  createdAt: any;
  read: boolean;
}

// ── Robust Relative Time Formatter ──
// Uses Intl for Malayalam support where date-fns might lack locales
function getRelativeTime(date: Date, lang: string) {
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  // Custom "just now" for Malayalam
  if (Math.abs(diffInSeconds) < 60) return lang === 'ml' ? 'ഇപ്പോൾ' : 'just now';

  try {
    const rtf = new Intl.RelativeTimeFormat(lang === 'ml' ? 'ml' : 'en', { numeric: 'auto' });

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');

    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 7) return rtf.format(diffInDays, 'day');

    // Fallback to simple date
    return date.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US');
  } catch (e) {
    return date.toLocaleDateString();
  }
}

export const NotificationList: React.FC<{
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}> = ({ notifications, isOpen, onClose, onMarkAllRead }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-[400px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-primary text-white shrink-0 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/10">
              <Bell className="w-4 h-4 sm:w-5 h-5 text-emerald-200" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className={`font-black leading-none mb-1 truncate ${language === 'ml' ? 'text-[13px] sm:text-[15px]' : 'text-[11px] sm:text-[13px] uppercase tracking-widest'}`}>
                {t("notifications")}
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className={`font-bold text-emerald-100/60 leading-none ${language === 'ml' ? 'text-[10px] sm:text-[11px]' : 'text-[9px] sm:text-[10px] uppercase tracking-widest'}`}>
                  {notifications.filter(n => !n.read).length} {t("unread") || "unread"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onMarkAllRead}
              className={`font-black bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full border border-white/5 transition-all active:scale-95 whitespace-nowrap ${language === 'ml' ? 'text-[10px] sm:text-[11px] py-1.5' : 'text-[9px] sm:text-[10px] uppercase tracking-[0.1em]'
                }`}
            >
              {t("markAllRead")}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
              <X className="w-5 h-5 opacity-80" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 border border-gray-100">
                <Bell className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-gray-900 font-black text-sm uppercase tracking-widest mb-2">{t("noNotifications")}</h3>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-tight leading-relaxed max-w-[200px]">
                We'll notify you when someone interacts with your local updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`relative p-5 flex gap-4 transition-all hover:bg-gray-50/50 ${notif.read ? "bg-white" : "bg-primary/[0.03]"}`}
                >
                  {!notif.read && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                  )}
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 shadow-inner">
                    {notif.actorPhoto ? (
                      <img src={notif.actorPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-gray-400">
                        {notif.actorName[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-900 leading-tight mb-2">
                      {t(notif.type === "reaction" ? "notificationReaction" : "notificationVerified", { name: notif.actorName })}
                      <span className="block font-black text-primary mt-1 truncate">
                        "{notif.postHeadline || "Local Update"}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {getRelativeTime(notif.createdAt?.toDate?.() || new Date(notif.createdAt), language)}
                      </span>
                    </div>
                  </div>
                  {!notif.read && (
                    <div className="mt-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 shadow-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function NotificationBell() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;

    const unreadNotifs = notifications.filter(n => !n.read);
    const batch = writeBatch(db);

    unreadNotifs.forEach(notif => {
      const ref = doc(db, "notifications", notif.id);
      batch.update(ref, { read: true });
    });

    try {
      await batch.commit();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-1.5 sm:p-2 rounded-xl  transition-all active:scale-95 group backdrop-blur-md"
      >
        <Bell className={`w-4 h-4 sm:w-5 h-5 transition-colors ${unreadCount > 0 ? "text-emerald-300" : "text-white/80 group-hover:text-white"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 border-2 border-primary rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg animate-in zoom-in-50 duration-300">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationList
        notifications={notifications}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
}
