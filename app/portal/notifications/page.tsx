"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle2, BookOpen, MessageSquare, FileText, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";

interface PortalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "stage_started":
    case "stage_completed":
      return BookOpen;
    case "comment_staff":
      return MessageSquare;
    case "file_shared":
      return FileText;
    case "birthday":
      return Gift;
    default:
      return Bell;
  }
}

function timeAgo(dateStr: string, locale: PortalLocale): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return locale === "es" ? "Justo ahora" : "Just now";
  if (diffMin < 60) return locale === "es" ? `hace ${diffMin} min` : `${diffMin} min ago`;
  if (diffH < 24) return locale === "es" ? `hace ${diffH} h` : `${diffH} h ago`;
  return locale === "es" ? `hace ${diffD} d` : `${diffD} d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<PortalLocale>("es");

  const t = getTranslations(locale);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/editorial/client/notifications");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/editorial/client/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t.notificationsPage}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.notificationsDesc}</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="border-gray-200 text-gray-600 hover:bg-gray-100 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {t.markAllRead}
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="w-6 h-6 text-[#1a3a6b] animate-spin" />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#1a3a6b]/10 flex items-center justify-center">
            <Bell className="w-7 h-7 text-[#1a3a6b]/40" />
          </div>
          <p className="text-sm text-gray-500">{t.noNotifications}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => {
              const Icon = getNotificationIcon(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                    notif.read ? "bg-white" : "bg-[#1a3a6b]/5"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    notif.read ? "bg-gray-100 text-gray-400" : "bg-[#1a3a6b]/10 text-[#1a3a6b]"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${notif.read ? "text-gray-600" : "text-gray-900"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.created_at, locale)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#1a3a6b] shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
