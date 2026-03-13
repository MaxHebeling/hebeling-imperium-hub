"use client";

import { Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function AiPanel() {
  const aiMetrics = [
    { name: "Leads Researched", value: 284, icon: "🔍" },
    { name: "Emails Sent", value: 1240, icon: "✉️" },
    { name: "Calls Handled", value: 42, icon: "☎️" },
    { name: "Meetings Scheduled", value: 16, icon: "📅" },
    { name: "Conversions", value: 8, icon: "✅" },
  ];

  const chartData = [
    { name: "Mon", value: 45 },
    { name: "Tue", value: 52 },
    { name: "Wed", value: 48 },
    { name: "Thu", value: 61 },
    { name: "Fri", value: 58 },
    { name: "Sat", value: 38 },
    { name: "Sun", value: 32 },
  ];

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-card/80">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-cyan-400/10">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">ANNA AI System</h3>
        </div>
        <p className="text-sm text-muted-foreground">Autonomous AI operations & automation metrics</p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metrics Cards */}
          <div className="lg:col-span-1 space-y-3">
            {aiMetrics.map((metric) => (
              <div
                key={metric.name}
                className="rounded-lg border border-border/40 bg-background/50 p-4 hover:bg-background/80 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.name}
                  </p>
                  <span className="text-lg">{metric.icon}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
            ))}
          </div>

          {/* Activity Chart */}
          <div className="lg:col-span-2 rounded-lg border border-border/40 bg-background/50 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-4">Weekly Activity Trend</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(212, 175, 55, 0.1)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                  stroke="rgba(148, 163, 184, 0.2)"
                />
                <YAxis
                  tick={{ fill: "rgba(148, 163, 184, 0.6)", fontSize: 12 }}
                  stroke="rgba(148, 163, 184, 0.2)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "6px",
                    color: "#D4AF37",
                  }}
                  cursor={{ fill: "rgba(212, 175, 55, 0.05)" }}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <span className="text-sm text-muted-foreground">System Status</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
            <span className="text-sm text-muted-foreground">Last Update</span>
            <span className="text-sm font-semibold text-cyan-400">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-400/5 border border-amber-400/20">
            <span className="text-sm text-muted-foreground">Efficiency</span>
            <span className="text-sm font-semibold text-amber-400">94.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
