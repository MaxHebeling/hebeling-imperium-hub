"use client";

import { Cpu, Search, Mail, Phone, CalendarCheck, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/lib/i18n";

export function AiPanel() {
  const { locale } = useLanguage();
  const aiMetrics = [
    { name: locale === "es" ? "Leads investigados" : "Leads Researched", value: 284, icon: <Search className="w-3.5 h-3.5" /> },
    { name: locale === "es" ? "Emails enviados" : "Emails Sent", value: 1240, icon: <Mail className="w-3.5 h-3.5" /> },
    { name: locale === "es" ? "Llamadas atendidas" : "Calls Handled", value: 42, icon: <Phone className="w-3.5 h-3.5" /> },
    { name: locale === "es" ? "Reuniones agendadas" : "Meetings Booked", value: 16, icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    { name: locale === "es" ? "Conversiones" : "Conversions", value: 8, icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ];

  const chartData = [
    { name: locale === "es" ? "Lun" : "Mon", value: 45 },
    { name: locale === "es" ? "Mar" : "Tue", value: 52 },
    { name: locale === "es" ? "Mié" : "Wed", value: 48 },
    { name: locale === "es" ? "Jue" : "Thu", value: 61 },
    { name: locale === "es" ? "Vie" : "Fri", value: 58 },
    { name: locale === "es" ? "Sáb" : "Sat", value: 38 },
    { name: locale === "es" ? "Dom" : "Sun", value: 32 },
  ];

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">ANNA AI System</h3>
            <p className="text-xs text-muted-foreground">
              {locale === "es" ? "Operaciones autónomas" : "Autonomous operations"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {locale === "es" ? "Operativo" : "Operational"}
          </div>
          <div className="text-xs text-muted-foreground border border-border rounded-full px-2.5 py-0.5">
            {locale === "es" ? "Eficiencia" : "Efficiency"} <span className="text-primary font-semibold">94.2%</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Metrics column — 2 cols */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-3">
            {aiMetrics.map((metric) => (
              <div
                key={metric.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-primary/30 transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    {metric.icon}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{metric.name}</p>
                </div>
                <p className="text-base font-bold text-foreground tabular-nums">{metric.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Chart — 3 cols */}
          <div className="lg:col-span-3 rounded-lg border border-border bg-background/50 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest">
                {locale === "es" ? "Actividad semanal" : "Weekly Activity"}
              </h4>
              <span className="text-xs text-muted-foreground">
                {locale === "es" ? "Esta semana" : "This week"}
              </span>
            </div>
            <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3F5A" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#8FA3BF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#8FA3BF", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#243450",
                      border: "1px solid #C8A84B40",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "#C8A84B" }}
                    cursor={{ fill: "rgba(200,168,75,0.06)" }}
                  />
                  <Bar dataKey="value" fill="#C8A84B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
