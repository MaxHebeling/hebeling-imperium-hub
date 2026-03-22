"use client";

import { FileUp, AlertCircle, Clock, Users, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  dot: string;
}

export function SystemActivityFeed() {
  const { locale } = useLanguage();
  const activities: ActivityItem[] = [
    {
      id: "1",
      title: locale === "es" ? "Manuscrito cargado" : "Manuscript uploaded",
      description: "The Echoes of Tomorrow — Reino Editorial",
      timestamp: locale === "es" ? "hace 2 min" : "2m ago",
      icon: <FileUp className="w-3.5 h-3.5" />,
      dot: "bg-[#7EB3E8]",
    },
    {
      id: "2",
      title: locale === "es" ? "Nuevo lead detectado" : "New lead detected",
      description: locale === "es" ? "Cliente enterprise — mercado USA" : "Enterprise client — US market",
      timestamp: locale === "es" ? "hace 15 min" : "15m ago",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      dot: "bg-primary",
    },
    {
      id: "3",
      title: locale === "es" ? "Reunión agendada" : "Meeting scheduled",
      description: "Q1 Strategy — Max Hebeling",
      timestamp: locale === "es" ? "hace 28 min" : "28m ago",
      icon: <Clock className="w-3.5 h-3.5" />,
      dot: "bg-secondary",
    },
    {
      id: "4",
      title: locale === "es" ? "Cliente registrado" : "Client registered",
      description: "iKingdom Acquisitions — Premium",
      timestamp: locale === "es" ? "hace 1 h" : "1h ago",
      icon: <Users className="w-3.5 h-3.5" />,
      dot: "bg-emerald-500",
    },
    {
      id: "5",
      title: locale === "es" ? "Automatización ejecutada" : "Automation executed",
      description: locale === "es" ? "Campaña email — 1,240 leads · 34% apertura" : "Email campaign — 1,240 leads · 34% open",
      timestamp: locale === "es" ? "hace 2 h" : "2h ago",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      dot: "bg-primary",
    },
    {
      id: "6",
      title: locale === "es" ? "Negocio cerrado" : "Deal closed",
      description: locale === "es" ? "Imperium Group — contrato de $61K" : "Imperium Group — $61K contract",
      timestamp: locale === "es" ? "hace 3 h" : "3h ago",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      dot: "bg-emerald-500",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {locale === "es" ? "Actividad del sistema" : "System Activity"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "es" ? "Flujo de eventos en vivo" : "Live event stream"}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {locale === "es" ? "En vivo" : "Live"}
        </span>
      </div>

      <ScrollArea className="h-[360px]">
        <div className="p-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 px-3 py-3 rounded-lg hover:bg-accent/60 transition-colors duration-150 group cursor-default"
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${activity.dot} ring-2 ring-card`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
              </div>

              <span className="text-[10px] text-muted-foreground flex-shrink-0 pt-0.5">{activity.timestamp}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
