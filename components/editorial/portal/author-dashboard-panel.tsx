"use client";

import { useState, useEffect } from "react";
import type { PortalLocale } from "@/lib/editorial/i18n/portal-translations";
import { getAuthorDashboardTranslations } from "@/lib/editorial/i18n/author-dashboard-translations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookAnalysisData {
  genre: string;
  audience: string[];
  readingLevel: string;
  estimatedReadingTime: { hours: number; minutes: number };
  clarityScore: number; // 0-100
  clarityLabel: string;
  clarityDescription: string;
  flowScore: number;
  flowLabel: string;
  flowDescription: string;
  impactScore: number;
  impactLabel: string;
  impactDescription: string;
  structure: { introduction: boolean; chapters: number; conclusion: boolean; appendix: boolean };
  structureDescription: string;
  strengths: string[];
  improvements: string[];
  themes: string[];
  influenceMap: { segment: string; potential: "high" | "medium" | "moderate" }[];
  lastUpdated: string | null;
}

interface AuthorDashboardPanelProps {
  projectId: string;
  locale: PortalLocale;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AuthorDashboardPanel({ projectId, locale }: AuthorDashboardPanelProps) {
  const t = getAuthorDashboardTranslations(locale);
  const [data, setData] = useState<BookAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/editorial/client/projects/${projectId}/analysis`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silently fail — show noDataYet message
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 px-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a3a6b]/5 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#1a3a6b]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">{t.noDataYet}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a3a6b]">{t.authorDashboard}</h2>
        {data.lastUpdated && (
          <span className="text-xs text-gray-400">
            {t.lastUpdated}: {new Date(data.lastUpdated).toLocaleDateString(locale === "es" ? "es-ES" : "en-US")}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 -mt-4">{t.basedOnEditorialReview}</p>

      {/* Book Profile */}
      <DashboardCard title={t.bookProfile}>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label={t.primaryGenre} value={data.genre} />
          <InfoItem label={t.readingLevel} value={data.readingLevel} />
          <InfoItem label={t.estimatedAudience} value={data.audience[0] || "—"} />
          <InfoItem
            label={t.estimatedReadingTime}
            value={`${data.estimatedReadingTime.hours} ${t.hours} ${data.estimatedReadingTime.minutes} ${t.minutes}`}
          />
        </div>
      </DashboardCard>

      {/* Clarity */}
      <DashboardCard title={t.contentClarity}>
        <p className="text-xs text-gray-400 mb-3">{t.clarityDesc}</p>
        <ScoreBar score={data.clarityScore} label={data.clarityLabel} />
        <p className="text-sm text-gray-600 mt-2">{data.clarityDescription}</p>
      </DashboardCard>

      {/* Narrative Flow */}
      <DashboardCard title={t.narrativeFlow}>
        <p className="text-xs text-gray-400 mb-3">{t.flowDesc}</p>
        <ScoreBar score={data.flowScore} label={data.flowLabel} />
        <p className="text-sm text-gray-600 mt-2">{data.flowDescription}</p>
      </DashboardCard>

      {/* Message Impact */}
      <DashboardCard title={t.messageImpact}>
        <p className="text-xs text-gray-400 mb-3">{t.impactDesc}</p>
        <ScoreBar score={data.impactScore} label={data.impactLabel} />
        <p className="text-sm text-gray-600 mt-2">{data.impactDescription}</p>
      </DashboardCard>

      {/* Book Structure */}
      <DashboardCard title={t.bookStructure}>
        <p className="text-xs text-gray-400 mb-3">{t.structureDesc}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.structure.introduction && <StructureBadge label={t.introduction} />}
          <StructureBadge label={`${data.structure.chapters} ${t.chapters}`} />
          {data.structure.conclusion && <StructureBadge label={t.conclusion} />}
          {data.structure.appendix && <StructureBadge label={t.appendix} />}
        </div>
        <p className="text-sm text-gray-600">{data.structureDescription}</p>
      </DashboardCard>

      {/* Audience */}
      <DashboardCard title={t.estimatedAudienceTitle}>
        <p className="text-xs text-gray-400 mb-3">{t.audienceDesc}</p>
        <div className="flex flex-wrap gap-2">
          {data.audience.map((a, i) => (
            <span key={i} className="px-3 py-1.5 bg-[#1a3a6b]/5 text-[#1a3a6b] rounded-full text-xs font-medium">
              {a}
            </span>
          ))}
        </div>
      </DashboardCard>

      {/* Strengths */}
      <DashboardCard title={t.keyStrengths}>
        <p className="text-xs text-gray-400 mb-3">{t.strengthsDesc}</p>
        <ul className="space-y-2">
          {data.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">{s}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      {/* Improvements */}
      <DashboardCard title={t.improvementOpportunities}>
        <p className="text-xs text-gray-400 mb-3">{t.improvementsDesc}</p>
        <ul className="space-y-2">
          {data.improvements.map((imp, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <span className="text-sm text-gray-700">{imp}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      {/* Key Themes */}
      <DashboardCard title={t.keyThemes}>
        <p className="text-xs text-gray-400 mb-3">{t.themesDesc}</p>
        <div className="flex flex-wrap gap-2">
          {data.themes.map((theme, i) => (
            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
              {theme}
            </span>
          ))}
        </div>
      </DashboardCard>

      {/* Influence Map */}
      <DashboardCard title={t.influenceMap}>
        <p className="text-xs text-gray-400 mb-3">{t.influenceDesc}</p>
        <div className="space-y-3">
          {data.influenceMap.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-700 font-medium">{item.segment}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                item.potential === "high"
                  ? "bg-emerald-50 text-emerald-600"
                  : item.potential === "medium"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {t[item.potential]}
              </span>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
      ? "bg-blue-500"
      : score >= 40
      ? "bg-amber-500"
      : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        score >= 80
          ? "bg-emerald-50 text-emerald-600"
          : score >= 60
          ? "bg-blue-50 text-blue-600"
          : score >= 40
          ? "bg-amber-50 text-amber-600"
          : "bg-red-50 text-red-500"
      }`}>
        {label}
      </span>
    </div>
  );
}

function StructureBadge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1.5 bg-[#1a3a6b]/5 text-[#1a3a6b]/80 rounded-lg text-xs font-medium border border-[#1a3a6b]/10">
      {label}
    </span>
  );
}
