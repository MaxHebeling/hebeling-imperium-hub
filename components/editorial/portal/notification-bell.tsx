"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  locale?: "es" | "en";
}

export function NotificationBell({ locale = "es" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/editorial/client/notifications?limit=20");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/editorial/client/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1) return locale === "es" ? "ahora" : "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {locale === "es" ? "Notificaciones" : "Notifications"}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-[#1a3a6b] hover:text-[#2a5a9b] font-medium"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {locale === "es" ? "Marcar todo leido" : "Mark all read"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {locale === "es" ? "Sin notificaciones" : "No notifications"}
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 ${
                    !n.is_read ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#1a3a6b] shrink-0 mt-1.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-1">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {formatTimeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
