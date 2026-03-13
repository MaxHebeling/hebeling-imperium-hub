"use client";

import { TrendingUp, TrendingDown, Users, FolderOpen, BookOpen, DollarSign, CalendarCheck, Cpu } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  chartData?: Array<{ value: number }>;
  accentColor: string;
  textAccent: string;
}

function MetricCard({ title, value, icon, trend, chartData, accentColor, textAccent }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 group transition-all duration-200 hover:border-primary/40"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-border ${textAccent}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-destructive"}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-2xl font-bold font-sans ${textAccent} mb-3`}>{value}</p>

      {chartData && (
        <div className="h-7 opacity-50 group-hover:opacity-80 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip
                contentStyle={{ backgroundColor: "#1C2B42", border: "1px solid #C8A84B40", borderRadius: "6px", fontSize: 11 }}
                itemStyle={{ color: "#C8A84B" }}
                cursor={false}
              />
              <Line type="monotone" dataKey="value" stroke="#C8A84B" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function MetricsSection() {
  const metrics: MetricCardProps[] = [
    {
      title: "New Leads Today",
      value: "24",
      icon: <Users className="w-4 h-4" />,
      trend: 12,
      accentColor: "bg-primary",
      textAccent: "text-primary",
      chartData: [{ value: 18 }, { value: 21 }, { value: 19 }, { value: 24 }],
    },
    {
      title: "Active Projects",
      value: "8",
      icon: <FolderOpen className="w-4 h-4" />,
      trend: 5,
      accentColor: "bg-emerald-500",
      textAccent: "text-emerald-400",
      chartData: [{ value: 6 }, { value: 7 }, { value: 7 }, { value: 8 }],
    },
    {
      title: "Books in Production",
      value: "12",
      icon: <BookOpen className="w-4 h-4" />,
      trend: -2,
      accentColor: "bg-secondary",
      textAccent: "text-[#C8A84B]",
      chartData: [{ value: 14 }, { value: 13 }, { value: 12 }, { value: 12 }],
    },
    {
      title: "Monthly Revenue",
      value: "$127.5K",
      icon: <DollarSign className="w-4 h-4" />,
      trend: 23,
      accentColor: "bg-primary",
      textAccent: "text-primary",
      chartData: [{ value: 80 }, { value: 100 }, { value: 115 }, { value: 127 }],
    },
    {
      title: "Meetings Scheduled",
      value: "16",
      icon: <CalendarCheck className="w-4 h-4" />,
      trend: 8,
      accentColor: "bg-[#4A7FB5]",
      textAccent: "text-[#7EB3E8]",
      chartData: [{ value: 12 }, { value: 14 }, { value: 15 }, { value: 16 }],
    },
    {
      title: "AI Activity",
      value: "324",
      icon: <Cpu className="w-4 h-4" />,
      trend: 34,
      accentColor: "bg-emerald-500",
      textAccent: "text-emerald-400",
      chartData: [{ value: 240 }, { value: 280 }, { value: 300 }, { value: 324 }],
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
