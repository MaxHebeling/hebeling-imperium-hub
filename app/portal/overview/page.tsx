import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FolderKanban, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  FileText
} from "lucide-react";

const projects = [
  {
    id: 1,
    name: "Brand Identity Redesign",
    status: "in-progress",
    progress: 65,
    dueDate: "Mar 15, 2026",
    lastUpdate: "2 days ago",
  },
  {
    id: 2,
    name: "Website Development",
    status: "review",
    progress: 90,
    dueDate: "Mar 20, 2026",
    lastUpdate: "1 day ago",
  },
  {
    id: 3,
    name: "Marketing Collateral",
    status: "pending",
    progress: 20,
    dueDate: "Apr 1, 2026",
    lastUpdate: "5 days ago",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  "in-progress": { label: "In Progress", variant: "default" },
  "review": { label: "Under Review", variant: "secondary" },
  "pending": { label: "Pending", variant: "outline" },
  "completed": { label: "Completed", variant: "default" },
};

export default function PortalOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your active projects and recent updates.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">3</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">2</p>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">8</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Upload Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Share files, feedback, or assets with your project team
                </p>
              </div>
            </div>
            <Button className="shrink-0">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Status */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Project Status</CardTitle>
              <CardDescription>Track progress on your active projects</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{project.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Due {project.dueDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusConfig[project.status].variant}>
                      {statusConfig[project.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {project.lastUpdate}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
