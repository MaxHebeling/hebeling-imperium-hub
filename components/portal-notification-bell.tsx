"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, MessageSquare, Zap, ArrowRight, BookOpen, FileText, PartyPopper } from "lucide-react";
import type { EditorialNotification, NotificationType } from "@/lib/editorial/notifications/types";

/** Icon + color mapping per notification type. */
const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  welcome: { icon: PartyPopper, color: "text-yellow-500" },
  stage_started: { icon: ArrowRight, color: "text-blue-500" },
  stage_completed: { icon: Check, color: "text-green-500" },
  comment_staff: { icon: MessageSquare, color: "text-purple-500" },
  comment_client: { icon: MessageSquare, color: "text-indigo-500" },
  suggestion: { icon: Zap, color: "text-orange-500" },
  project_update: { icon: BookOpen, color: "text-cyan-500" },
  file_shared: { icon: FileText, color: "text-teal-500" },
  project_completed: { icon: PartyPopper, color: "text-emerald-500" },
  birthday: { icon: PartyPopper, color: "text-pink-500" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "Justo ahora";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<EditorialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/editorial/client/notifications?limit=20");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.notifications ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/editorial/client/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative p-2 rounded-lg text-gray-400 hover:text-[#1a3a6b] hover:bg-[#1a3a6b]/5 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-[#1a3a6b]">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-[#2a5a9b] hover:text-[#1a3a6b] font-medium transition-colors"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.welcome;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                      !n.is_read ? "bg-[#1a3a6b]/[0.03]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-[#1a3a6b]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
