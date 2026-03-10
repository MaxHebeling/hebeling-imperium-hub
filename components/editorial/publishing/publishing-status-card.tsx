"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PublishingStatusCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: "success" | "warning" | "danger";
}

export function PublishingStatusCard({ label, value, icon, highlight }: PublishingStatusCardProps) {
  const highlightClass =
    highlight === "success"
      ? "text-emerald-600"
      : highlight === "warning"
      ? "text-amber-600"
      : highlight === "danger"
      ? "text-red-600"
      : "text-foreground";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          {icon}
        </div>
        <div className={cn("text-2xl font-bold", highlightClass)}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
