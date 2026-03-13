"use client";

import { AlertCircle, CheckCircle2, Clock, FileUp, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityItem {
  id: string;
  type: "manuscript" | "lead" | "meeting" | "client" | "automation";
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

export function SystemActivityFeed() {
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "manuscript",
      title: "New manuscript uploaded",
      description: "The Echoes of Tomorrow - Kingdom Editorial",
      timestamp: "2 min ago",
      icon: <FileUp className="w-4 h-4" />,
      color: "text-blue-400",
    },
    {
      id: "2",
      type: "lead",
      title: "New lead detected",
      description: "Potential enterprise client from US market",
      timestamp: "15 min ago",
      icon: <AlertCircle className="w-4 h-4" />,
      color: "text-amber-400",
    },
    {
      id: "3",
      type: "meeting",
      title: "Meeting scheduled",
      description: "Q1 Strategic Planning Session - Max Hebeling",
      timestamp: "28 min ago",
      icon: <Clock className="w-4 h-4" />,
      color: "text-purple-400",
    },
    {
      id: "4",
      type: "client",
      title: "New client registered",
      description: "iKingdom Acquisitions - Premium tier",
      timestamp: "1 hour ago",
      icon: <Users className="w-4 h-4" />,
      color: "text-cyan-400",
    },
    {
      id: "5",
      type: "automation",
      title: "Automation executed",
      description: "Email campaign sent to 1,240 leads - 34% open rate",
      timestamp: "2 hours ago",
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-400",
    },
  ];

  return (
    <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-card/80">
        <h3 className="text-lg font-semibold text-foreground">System Activity</h3>
        <p className="text-sm text-muted-foreground">Real-time event stream</p>
      </div>

      {/* Activity Feed */}
      <ScrollArea className="h-96">
        <div className="divide-y divide-border/40">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-accent/30 transition-colors duration-200 group"
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div
                  className={`${activity.color} mt-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`}
                >
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-amber-400/80 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1.5">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
