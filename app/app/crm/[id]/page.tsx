import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Mail,
  User,
  Calendar,
  FolderKanban,
  Globe,
  FileText,
  Ticket,
  ArrowLeft,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

type TenantStatus = "lead" | "active" | "paused" | "archived";
type ProjectStatus = "pending" | "in_progress" | "waiting_client" | "completed" | "cancelled";
type WebsiteStatus = "draft" | "in_progress" | "live" | "paused" | "archived";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  status: TenantStatus;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  phase: string;
  status: ProjectStatus;
  due_date: string | null;
  created_at: string;
}

interface Website {
  id: string;
  name: string;
  primary_domain: string | null;
  status: WebsiteStatus;
  environment: string | null;
  created_at: string;
}

interface Document {
  id: string;
  type: string;
  status: string | null;
  file_url: string | null;
  created_at: string;
}

interface TicketRecord {
  id: string;
  subject: string;
  status: TicketStatus;
  created_at: string;
}

const statusColors: Record<TenantStatus, string> = {
  lead: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const projectStatusColors: Record<ProjectStatus, string> = {
  pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  waiting_client: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const websiteStatusColors: Record<WebsiteStatus, string> = {
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  live: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const ticketStatusColors: Record<TicketStatus, string> = {
  open: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  closed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // Fetch related data in parallel
  const [projectsResult, websitesResult, documentsResult, ticketsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, phase, status, due_date, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("websites")
      .select("id, name, primary_domain, status, environment, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id, type, status, file_url, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tickets")
      .select("id, subject, status, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const projects = (projectsResult.data || []) as Project[];
  const websites = (websitesResult.data || []) as Website[];
  const documents = (documentsResult.data || []) as Document[];
  const tickets = (ticketsResult.data || []) as TicketRecord[];

  const typedTenant = tenant as Tenant;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/app/crm">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {typedTenant.name}
              </h1>
              <Badge
                variant="outline"
                className={`capitalize ${statusColors[typedTenant.status]}`}
              >
                {typedTenant.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Client Profile</p>
          </div>
        </div>
        <Link href={`/app/crm/${id}/edit`}>
          <Button variant="outline">Edit Client</Button>
        </Link>
      </div>

      {/* Client Info Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primary Contact</p>
                <p className="text-sm font-medium text-foreground">
                  {typedTenant.primary_contact_name || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {typedTenant.primary_contact_email || "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(typedTenant.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="websites" className="gap-2">
            <Globe className="h-4 w-4" />
            Websites
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {websites.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {tickets.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Projects</CardTitle>
              <CardDescription>All projects for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create a project for this client to track work and progress."
                />
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <FolderKanban className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{project.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground capitalize">
                              {project.phase}
                            </span>
                            {project.due_date && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due {formatDate(project.due_date)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize ${projectStatusColors[project.status]}`}
                      >
                        {project.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Websites Tab */}
        <TabsContent value="websites">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Websites</CardTitle>
              <CardDescription>Web properties for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {websites.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No websites yet"
                  description="Add a website to track this client's web properties."
                />
              ) : (
                <div className="space-y-3">
                  {websites.map((website) => (
                    <div
                      key={website.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{website.name}</p>
                          {website.primary_domain && (
                            <a
                              href={`https://${website.primary_domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                            >
                              {website.primary_domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize ${websiteStatusColors[website.status]}`}
                      >
                        {website.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Documents</CardTitle>
              <CardDescription>Files and documents for this client</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No documents yet"
                  description="Upload documents to keep track of contracts, proposals, and more."
                />
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">{doc.type}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      {doc.status && (
                        <Badge variant="outline" className="capitalize">
                          {doc.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Support Tickets</CardTitle>
              <CardDescription>Support requests from this client</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No tickets yet"
                  description="Support tickets will appear here when created."
                />
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          <Ticket className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize ${ticketStatusColors[ticket.status]}`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{description}</p>
    </div>
  );
}
