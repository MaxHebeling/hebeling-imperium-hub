"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  chartData?: Array<{ value: number }>;
  color: string;
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  chartData,
  color,
}: MetricCardProps) {
  const isPositive = trend && trend >= 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/50 p-6 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group">
      {/* Gold accent border on hover */}
      <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-amber-500/30 transition-all duration-300 pointer-events-none" />

      {/* Background gradient accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-all duration-300`} />

      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>{icon}</div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                isPositive
                  ? "text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Title and Value */}
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-3xl font-bold text-foreground mb-4">{value}</p>

        {/* Micro Chart */}
        {chartData && chartData.length > 0 && (
          <div className="h-8 opacity-60 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(212, 175, 55, 0.2)",
                    borderRadius: "6px",
                  }}
                  cursor={false}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export function MetricsSection() {
  const metrics: MetricCardProps[] = [
    {
      title: "New Leads Today",
      value: "24",
      icon: "👥",
      trend: 12,
      color: "text-blue-400",
      chartData: [
        { value: 18 },
        { value: 21 },
        { value: 19 },
        { value: 24 },
      ],
    },
    {
      title: "Active Projects",
      value: "8",
      icon: "📊",
      trend: 5,
      color: "text-emerald-400",
      chartData: [
        { value: 6 },
        { value: 7 },
        { value: 7 },
        { value: 8 },
      ],
    },
    {
      title: "Books in Production",
      value: "12",
      icon: "📚",
      trend: -2,
      color: "text-amber-400",
      chartData: [
        { value: 14 },
        { value: 13 },
        { value: 12 },
        { value: 12 },
      ],
    },
    {
      title: "Monthly Revenue",
      value: "$127.5K",
      icon: "💰",
      trend: 23,
      color: "text-yellow-400",
      chartData: [
        { value: 80 },
        { value: 100 },
        { value: 115 },
        { value: 127 },
      ],
    },
    {
      title: "Meetings Scheduled",
      value: "16",
      icon: "📅",
      trend: 8,
      color: "text-purple-400",
      chartData: [
        { value: 12 },
        { value: 14 },
        { value: 15 },
        { value: 16 },
      ],
    },
    {
      title: "AI Activity",
      value: "324",
      icon: "🤖",
      trend: 34,
      color: "text-cyan-400",
      chartData: [
        { value: 240 },
        { value: 280 },
        { value: 300 },
        { value: 324 },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}
