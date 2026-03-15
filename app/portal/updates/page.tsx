"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BookOpen, MessageSquare, CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getTranslations } from "@/lib/editorial/i18n/portal-translations";

interface UpdateItem {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

function getUpdateIcon(type: string) {
  switch (type) {
    case "stage_started":
    case "stage_completed":
      return CheckCircle2;
    case "comment_staff":
      return MessageSquare;
    case "project_update":
      return BookOpen;
    default:
      return Bell;
  }
}

function formatUpdateDate(dateStr: string, locale: PortalLocale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<PortalLocale>("es");

  const t = getTranslations(locale);

  useEffect(() => {
    const saved = localStorage.getItem("reino-locale") as PortalLocale | null;
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/editorial/client/notifications");
      const json = await res.json();
      if (json.success) {
        // Filter to show only editorial updates (not birthday, etc.)
        const editorial = (json.notifications ?? []).filter(
          (n: UpdateItem) => ["stage_started", "stage_completed", "comment_staff", "project_update", "file_shared", "welcome"].includes(n.type)
        );
        setUpdates(editorial);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t.projectUpdates}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.updatesDesc}</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="w-6 h-6 text-[#1a3a6b] animate-spin" />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 flex flex-col items-center gap-4 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#1a3a6b]/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-[#1a3a6b]/40" />
          </div>
          <div>
            <p className="font-semibold text-gray-700">{t.noUpdatesYet}</p>
            <p className="text-sm text-gray-400 mt-1">{t.updatesDesc}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          {/* Timeline style feed */}
          <div className="px-5 py-4">
            <div className="relative">
              {updates.map((update, idx) => {
                const Icon = getUpdateIcon(update.type);
                const isLast = idx === updates.length - 1;

                return (
                  <div key={update.id} className="relative pb-6 last:pb-0">
                    {/* Connector line */}
                    {!isLast && (
                      <div className="absolute left-[17px] top-[36px] w-0.5 h-[calc(100%-18px)] bg-gray-200" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-[#1a3a6b]/10 text-[#1a3a6b] shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{update.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{update.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {formatUpdateDate(update.created_at, locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
