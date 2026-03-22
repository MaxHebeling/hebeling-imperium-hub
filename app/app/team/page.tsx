"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Upload,
  Shield,
  Search,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  Trash2,
  CheckCircle2,
  Clock,
  Activity,
  Building2,
} from "lucide-react";
import Link from "next/link";

type MemberRole = "admin" | "manager" | "user" | "viewer";
type MemberStatus = "active" | "inactive" | "pending" | "suspended";

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
}

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bgClass: string }> = {
  admin: {
    label: "Admin",
    color: "text-purple-400",
    bgClass: "bg-purple-500/10 border-purple-500/30",
  },
  manager: {
    label: "Manager",
    color: "text-blue-400",
    bgClass: "bg-blue-500/10 border-blue-500/30",
  },
  user: {
    label: "User",
    color: "text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/30",
  },
  viewer: {
    label: "Viewer",
    color: "text-gray-400",
    bgClass: "bg-gray-500/10 border-gray-500/30",
  },
};

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; bgClass: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  inactive: {
    label: "Inactive",
    color: "text-gray-400",
    bgClass: "bg-gray-500/10 border-gray-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  suspended: {
    label: "Suspended",
    color: "text-red-400",
    bgClass: "bg-red-500/10 border-red-500/30",
    icon: <Ban className="h-3 w-3" />,
  },
};

// Mock data
const mockMembers: TeamMember[] = [
  {
    id: "1",
    name: "Max Hebeling",
    email: "max@hebeling.io",
    avatar_url: undefined,
    role: "admin",
    department: "Executive",
    status: "active",
    created_at: "2024-01-15",
    last_active: "2025-03-06T10:30:00Z",
    phone: "+1 555-0100",
  },
  {
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
  },
  {
    id: "3",
    name: "James Wilson",
    email: "james@hebeling.io",
    avatar_url: undefined,
    role: "user",
    department: "Development",
    status: "active",
    created_at: "2024-03-10",
    last_active: "2025-03-05T18:45:00Z",
    phone: "+1 555-0102",
  },
  {
    id: "4",
    name: "Emily Rodriguez",
    email: "emily@hebeling.io",
    avatar_url: undefined,
    role: "user",
    department: "Design",
    status: "active",
    created_at: "2024-04-05",
    last_active: "2025-03-06T08:00:00Z",
  },
  {
    id: "5",
    name: "Michael Foster",
    email: "michael@hebeling.io",
    avatar_url: undefined,
    role: "viewer",
    department: "Finance",
    status: "inactive",
    created_at: "2024-05-12",
    last_active: "2025-02-15T14:30:00Z",
  },
  {
    id: "6",
    name: "Lisa Park",
    email: "lisa@hebeling.io",
    avatar_url: undefined,
    role: "manager",
    department: "Marketing",
    status: "active",
    created_at: "2024-06-01",
    last_active: "2025-03-06T07:45:00Z",
  },
  {
    id: "7",
    name: "David Thompson",
    email: "david.t@hebeling.io",
    avatar_url: undefined,
    role: "user",
    department: "Development",
    status: "pending",
    created_at: "2025-03-01",
    last_active: "2025-03-01T10:00:00Z",
  },
  {
    id: "8",
    name: "Anna Martinez",
    email: "anna@hebeling.io",
    avatar_url: undefined,
    role: "user",
    department: "Sales",
    status: "suspended",
    created_at: "2024-07-20",
    last_active: "2025-02-01T16:20:00Z",
  },
];

const departments = ["Executive", "Operations", "Development", "Design", "Finance", "Marketing", "Sales"];

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
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TeamPage() {
  const [members] = useState<TeamMember[]>(mockMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("user");

  // Stats
  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    pending: members.filter((m) => m.status === "pending").length,
    admins: members.filter((m) => m.role === "admin").length,
    departments: new Set(members.map((m) => m.department).filter(Boolean)).size,
    lastActivity: members.reduce((latest, m) => {
      const date = new Date(m.last_active);
      return date > latest ? date : latest;
    }, new Date(0)),
  };

  // Filtered members
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || member.department === departmentFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const handleInvite = () => {
    // TODO: Implement invite logic
    setIsInviteOpen(false);
    setInviteEmail("");
    setInviteRole("user");
  };

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              System Active
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Team Management
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Manage team members, roles, permissions, and organization structure.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/app/team/roles">
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">View Roles</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Members</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.admins}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Admins</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.departments}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Departments</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border/40 hover:bg-card/60 transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{getRelativeTime(stats.lastActivity.toISOString())}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Last Activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card/30 border-border/40">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[150px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-background/50 border-border/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      {filteredMembers.length === 0 ? (
        <Card className="bg-card/40 border-border/40">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-xl bg-muted/30 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">No team members found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              {members.length === 0
                ? "Get started by inviting your first team member"
                : "Try adjusting your filters to find who you're looking for"}
            </p>
            {members.length === 0 && (
              <Button onClick={() => setIsInviteOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/40 border-border/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium">Department</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Last Active</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];
                const statusConfig = STATUS_CONFIG[member.status];
                return (
                  <TableRow
                    key={member.id}
                    className="hover:bg-muted/20 border-border/30 transition-colors group"
                  >
                    <TableCell>
                      <Link
                        href={`/app/team/${member.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatar_url} alt={member.name} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{member.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${roleConfig.bgClass} ${roleConfig.color} border`}
                      >
                        {roleConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.department ? (
                        <span className="text-muted-foreground">{member.department}</span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`gap-1.5 ${statusConfig.bgClass} ${statusConfig.color} border`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getRelativeTime(member.last_active)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/app/team/${member.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/team/${member.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <UserCog className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Shield className="h-4 w-4 mr-2" />
                              Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status === "suspended" ? (
                              <DropdownMenuItem className="cursor-pointer text-emerald-400">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer text-amber-400">
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`Remove "${member.name}" from the team? This cannot be undone.`)) {
                                  fetch(`/api/team/${member.id}`, { method: "DELETE" })
                                    .then(res => res.json())
                                    .then(data => { if (data.success) window.location.reload(); });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Recent Activity Section */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Recent Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "David Thompson joined the team", time: "5 days ago", type: "join" },
              { action: "Lisa Park role changed to Manager", time: "2 weeks ago", type: "role" },
              { action: "Anna Martinez was suspended", time: "1 month ago", type: "suspend" },
              { action: "Emily Rodriguez joined Design team", time: "2 months ago", type: "join" },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/30"
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === "join"
                      ? "bg-emerald-500/10"
                      : activity.type === "role"
                      ? "bg-blue-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  {activity.type === "join" ? (
                    <UserPlus className="h-4 w-4 text-emerald-400" />
                  ) : activity.type === "role" ? (
                    <Shield className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Ban className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
