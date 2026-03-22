"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  User,
  Shield,
  Activity,
  Lock,
  Settings,
  Edit,
  UserCog,
  Ban,
  Trash2,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Building2,
  Calendar,
  Globe,
  Monitor,
  Smartphone,
  LogIn,
  LogOut,
  FileText,
  Download,
  AlertTriangle,
  Key,
  Bell,
} from "lucide-react";
import Link from "next/link";

type MemberRole = "admin" | "manager" | "user" | "viewer";
type MemberStatus = "active" | "inactive" | "pending" | "suspended";
type PermissionLevel = "none" | "view" | "edit" | "create" | "delete" | "admin";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: MemberRole;
  department?: string;
  status: MemberStatus;
  created_at: string;
  last_active: string;
  phone?: string;
  title?: string;
  location?: string;
}

interface Permission {
  module: string;
  level: PermissionLevel;
  lastModified: string;
}

interface ActivityEvent {
  id: string;
  type: "login" | "logout" | "profile_update" | "document_access" | "resource_modify" | "report_generate";
  description: string;
  timestamp: string;
  ip?: string;
  device?: string;
}

interface Session {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bgClass: string }> = {
  admin: { label: "Admin", color: "text-purple-400", bgClass: "bg-purple-500/10 border-purple-500/30" },
  manager: { label: "Manager", color: "text-blue-400", bgClass: "bg-blue-500/10 border-blue-500/30" },
  user: { label: "User", color: "text-cyan-400", bgClass: "bg-cyan-500/10 border-cyan-500/30" },
  viewer: { label: "Viewer", color: "text-gray-400", bgClass: "bg-gray-500/10 border-gray-500/30" },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "text-emerald-400", bgClass: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  inactive: { label: "Inactive", color: "text-gray-400", bgClass: "bg-gray-500/10 border-gray-500/30", icon: <Clock className="h-3 w-3" /> },
  pending: { label: "Pending", color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30", icon: <Clock className="h-3 w-3" /> },
  suspended: { label: "Suspended", color: "text-red-400", bgClass: "bg-red-500/10 border-red-500/30", icon: <Ban className="h-3 w-3" /> },
};

const PERMISSION_LEVELS: PermissionLevel[] = ["none", "view", "edit", "create", "delete", "admin"];

const PERMISSION_CONFIG: Record<PermissionLevel, { label: string; color: string }> = {
  none: { label: "None", color: "text-gray-500" },
  view: { label: "View", color: "text-gray-400" },
  edit: { label: "Edit", color: "text-blue-400" },
  create: { label: "Create", color: "text-cyan-400" },
  delete: { label: "Delete", color: "text-amber-400" },
  admin: { label: "Admin", color: "text-purple-400" },
};

// Mock data
const mockMember: TeamMember = {
  id: "2",
  name: "Sarah Chen",
  email: "sarah@hebeling.io",
  avatar_url: undefined,
  role: "manager",
  department: "Operations",
  status: "active",
  created_at: "2024-02-20",
  last_active: "2025-03-06T09:15:00Z",
  phone: "+1 555-0101",
  title: "Operations Manager",
  location: "San Francisco, CA",
};

const mockPermissions: Permission[] = [
  { module: "CRM", level: "admin", lastModified: "2024-06-15" },
  { module: "Deals", level: "edit", lastModified: "2024-06-15" },
  { module: "Clients", level: "admin", lastModified: "2024-06-15" },
  { module: "Projects", level: "edit", lastModified: "2024-06-15" },
  { module: "Websites", level: "view", lastModified: "2024-06-15" },
  { module: "Documents", level: "create", lastModified: "2024-06-15" },
  { module: "Payments", level: "view", lastModified: "2024-06-15" },
  { module: "Investors", level: "none", lastModified: "2024-06-15" },
  { module: "Automations", level: "edit", lastModified: "2024-06-15" },
];

const mockActivity: ActivityEvent[] = [
  { id: "1", type: "login", description: "Logged in from Chrome on macOS", timestamp: "2025-03-06T09:15:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
  { id: "2", type: "document_access", description: "Viewed Q1 Revenue Report", timestamp: "2025-03-06T08:45:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
  { id: "3", type: "resource_modify", description: "Updated client profile: Acme Corp", timestamp: "2025-03-05T16:30:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
  { id: "4", type: "report_generate", description: "Generated Operations Dashboard Report", timestamp: "2025-03-05T14:20:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
  { id: "5", type: "logout", description: "Logged out", timestamp: "2025-03-05T18:00:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
  { id: "6", type: "login", description: "Logged in from Safari on iPhone", timestamp: "2025-03-04T20:30:00Z", ip: "10.0.0.15", device: "Safari / iOS" },
  { id: "7", type: "profile_update", description: "Updated profile photo", timestamp: "2025-03-03T11:00:00Z", ip: "192.168.1.105", device: "Chrome / macOS" },
];

const mockSessions: Session[] = [
  { id: "1", device: "Chrome on macOS", deviceType: "desktop", ip: "192.168.1.105", location: "San Francisco, CA", lastActive: "2025-03-06T09:15:00Z", current: true },
  { id: "2", device: "Safari on iPhone", deviceType: "mobile", ip: "10.0.0.15", location: "San Francisco, CA", lastActive: "2025-03-04T20:30:00Z", current: false },
  { id: "3", device: "Chrome on Windows", deviceType: "desktop", ip: "192.168.1.110", location: "Remote Office", lastActive: "2025-02-28T14:00:00Z", current: false },
];

const mockAccessLog = [
  { module: "CRM", lastAccessed: "2025-03-06T08:30:00Z", accessCount: 245, ip: "192.168.1.105" },
  { module: "Clients", lastAccessed: "2025-03-06T09:00:00Z", accessCount: 189, ip: "192.168.1.105" },
  { module: "Deals", lastAccessed: "2025-03-05T16:45:00Z", accessCount: 156, ip: "192.168.1.105" },
  { module: "Documents", lastAccessed: "2025-03-05T14:20:00Z", accessCount: 78, ip: "192.168.1.105" },
  { module: "Projects", lastAccessed: "2025-03-04T11:30:00Z", accessCount: 112, ip: "192.168.1.105" },
  { module: "Automations", lastAccessed: "2025-03-03T09:15:00Z", accessCount: 34, ip: "192.168.1.105" },
];

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getActivityIcon(type: ActivityEvent["type"]) {
  switch (type) {
    case "login": return <LogIn className="h-4 w-4 text-emerald-400" />;
    case "logout": return <LogOut className="h-4 w-4 text-gray-400" />;
    case "profile_update": return <User className="h-4 w-4 text-blue-400" />;
    case "document_access": return <FileText className="h-4 w-4 text-amber-400" />;
    case "resource_modify": return <Edit className="h-4 w-4 text-cyan-400" />;
    case "report_generate": return <Download className="h-4 w-4 text-purple-400" />;
  }
}

function getDeviceIcon(type: Session["deviceType"]) {
  switch (type) {
    case "desktop": return <Monitor className="h-4 w-4" />;
    case "mobile": return <Smartphone className="h-4 w-4" />;
    case "tablet": return <Monitor className="h-4 w-4" />;
  }
}

export default function TeamMemberDetailPage() {
  const [member] = useState<TeamMember>(mockMember);
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [selectedRole, setSelectedRole] = useState<MemberRole>(member.role);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [activityFilter, setActivityFilter] = useState("all");

  const roleConfig = ROLE_CONFIG[member.role];
  const statusConfig = STATUS_CONFIG[member.status];

  const filteredActivity = activityFilter === "all" 
    ? mockActivity 
    : mockActivity.filter(a => a.type === activityFilter);

  const updatePermission = (module: string, level: PermissionLevel) => {
    setPermissions(prev => 
      prev.map(p => p.module === module ? { ...p, level, lastModified: new Date().toISOString().split("T")[0] } : p)
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/team" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Team
        </Link>
        <span>/</span>
        <span className="text-foreground">{member.name}</span>
      </div>

      {/* Premium Header Card */}
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={member.avatar_url} alt={member.name} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
                  <Badge variant="outline" className={`${statusConfig.bgClass} ${statusConfig.color} border gap-1`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </div>
                {member.title && (
                  <p className="text-muted-foreground">{member.title}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className={`${roleConfig.bgClass} ${roleConfig.color} border`}>
                    {roleConfig.label}
                  </Badge>
                  {member.department && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {member.department}
                    </span>
                  )}
                  {member.location && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {member.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <UserCog className="h-4 w-4" />
                Change Role
              </Button>
              {member.status === "suspended" ? (
                <Button variant="outline" size="sm" className="gap-2 text-emerald-400 hover:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Reactivate
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 text-amber-400 hover:text-amber-300">
                  <Ban className="h-4 w-4" />
                  Suspend
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-card/40 border border-border/40 p-1">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 data-[state=active]:bg-background">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2 data-[state=active]:bg-background">
            <Lock className="h-4 w-4" />
            Access
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-background">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <Card className="bg-card/40 border-border/40 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="text-foreground">{member.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {member.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                    <p className="text-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {member.phone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                    <p className="text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {member.department || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                    <p className="text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {member.location || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Title</p>
                    <p className="text-foreground">{member.title || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="bg-card/40 border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-medium">User Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Joined</p>
                  <p className="text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Active</p>
                  <p className="text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {getRelativeTime(member.last_active)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Actions</p>
                  <p className="text-2xl font-bold text-foreground">1,247</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Resources Assigned</p>
                  <p className="text-foreground">12 Clients, 8 Projects</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivity.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-border/30">
                    <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
                      {getActivityIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRelativeTime(event.timestamp)} {event.ip && `• ${event.ip}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {/* Current Role */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-medium">Current Role</CardTitle>
              <CardDescription>Change the user&apos;s role to adjust their default permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as MemberRole)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {selectedRole !== member.role && (
                  <Button size="sm">Save Role Change</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions Matrix */}
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-medium">Module Permissions</CardTitle>
              <CardDescription>Configure specific permissions for each module</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Module</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Permission Level</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Last Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.module} className="hover:bg-muted/20 border-border/30">
                      <TableCell className="font-medium text-foreground">{perm.module}</TableCell>
                      <TableCell>
                        <Select 
                          value={perm.level} 
                          onValueChange={(v) => updatePermission(perm.module, v as PermissionLevel)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERMISSION_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                <span className={PERMISSION_CONFIG[level].color}>
                                  {PERMISSION_CONFIG[level].label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(perm.lastModified).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save All Permissions</Button>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-card/40 border-border/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Activity History</CardTitle>
                <CardDescription>Complete log of user actions</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login">Logins</SelectItem>
                    <SelectItem value="logout">Logouts</SelectItem>
                    <SelectItem value="profile_update">Profile Updates</SelectItem>
                    <SelectItem value="document_access">Document Access</SelectItem>
                    <SelectItem value="resource_modify">Modifications</SelectItem>
                    <SelectItem value="report_generate">Reports</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredActivity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-4 rounded-lg bg-background/30 border border-border/30">
                    <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                      {getActivityIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        {event.ip && <span>IP: {event.ip}</span>}
                        {event.device && <span>Device: {event.device}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card className="bg-card/40 border-border/40 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-medium">Module Access Log</CardTitle>
              <CardDescription>Track which modules this user has accessed</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="text-muted-foreground font-medium">Module</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Last Accessed</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Access Count</TableHead>
                    <TableHead className="text-muted-foreground font-medium">IP Address</TableHead>
                    <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAccessLog.map((log) => (
                    <TableRow key={log.module} className="hover:bg-muted/20 border-border/30">
                      <TableCell className="font-medium text-foreground">{log.module}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {getRelativeTime(log.lastAccessed)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.accessCount}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{log.ip}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          Revoke Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Notifications */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "deals", label: "Deal updates", description: "Notifications about deal progress and changes", checked: true },
                { id: "clients", label: "Client activity", description: "Alerts when clients perform actions", checked: true },
                { id: "projects", label: "Project updates", description: "Status changes and deadline reminders", checked: false },
                { id: "reports", label: "Weekly reports", description: "Summary of weekly performance metrics", checked: true },
              ].map((notif) => (
                <div key={notif.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">{notif.label}</p>
                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                  </div>
                  <Checkbox defaultChecked={notif.checked} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Two-Factor Auth */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled 
                      ? "Your account is secured with two-factor authentication" 
                      : "Add an extra layer of security to the account"}
                  </p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-card/40 border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        {session.device}
                        {session.current && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            Current
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location} • IP: {session.ip} • {getRelativeTime(session.lastActive)}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-card/40 border-red-500/20">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily disable this account. User won&apos;t be able to access the system.
                  </p>
                </div>
                <Button variant="outline" className="text-amber-400 hover:text-amber-300 border-amber-400/30">
                  <Ban className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-red-500/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete this account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
