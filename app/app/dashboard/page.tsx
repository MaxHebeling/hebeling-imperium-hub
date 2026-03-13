import { MetricsSection } from "@/components/dashboard/metrics-section";
import { SystemActivityFeed } from "@/components/dashboard/system-activity-feed";
import { CompaniesPanel } from "@/components/dashboard/companies-panel";
import { AiPanel } from "@/components/dashboard/ai-panel";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Operating System Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of Hebeling Imperium operations</p>
      </div>

      {/* Main Grid Layout */}
      <div className="space-y-6">
        {/* Section 1: Metrics */}
        <MetricsSection />

        {/* Section 2 & 3: Activity Feed + Companies Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Activity - 1 column */}
          <div className="lg:col-span-1">
            <SystemActivityFeed />
          </div>

          {/* Companies Panel - 2 columns */}
          <div className="lg:col-span-2">
            <CompaniesPanel />
          </div>
        </div>

        {/* Section 4: AI Panel (ANNA) */}
        <AiPanel />
      </div>
    </div>
  );
}
