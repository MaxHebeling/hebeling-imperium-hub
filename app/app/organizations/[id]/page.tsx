"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  Shield,
  CreditCard,
  Settings,
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  plan: string;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  suspended: "bg-red-500/10 text-red-400 border-red-500/30",
  trial: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const planColors: Record<string, string> = {
  starter: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  professional: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  custom: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  member: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  guest: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

// TODO: Fetch real data from Supabase
const mockOrganization: Organization = {
  id: "",
  name: "",
  slug: "",
  description: "",
  status: "active",
  plan: "enterprise",
  created_at: new Date().toISOString(),
};

const mockMembers: OrganizationMember[] = [];

const mockTeams: Team[] = [];

const mockRoles: Role[] = [];

export default function OrganizationDetailPage() {
  const router = useRouter();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // In production, fetch real data from Supabase
  const organization = mockOrganization;
  const members = mockMembers;
  const teams = mockTeams;
  const roles = mockRoles;

  const copyToClipboard = (text: string, email: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  {organization.name}
                </h1>
                <p className="text-xs text-muted-foreground">ID: {organization.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusColors[organization.status]}>
                {organization.status}
              </Badge>
              <Badge variant="outline" className={planColors[organization.plan]}>
                {organization.plan}
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Members
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {members.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Teams
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {teams.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm font-bold text-foreground mt-2">
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="bg-card/40 border-border/40">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b border-border/30 rounded-none bg-transparent px-6 pt-6">
            <TabsTrigger
              value="overview"
              className="border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="members"
              className="border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Members
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Name</h3>
                <p className="text-sm text-muted-foreground">{organization.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Slug</h3>
                <p className="text-sm text-muted-foreground">{organization.slug}</p>
              </div>
              {organization.description && (
                <div>
                  <h3 className="font-medium text-foreground mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{organization.description}</p>
                </div>
              )}
              <div>
                <h3 className="font-medium text-foreground mb-2">Plan</h3>
                <Badge variant="outline" className={planColors[organization.plan]}>
                  {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Members ({members.length})
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage organization members and their roles
                </p>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Invite Member
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {member.profiles?.full_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              member.profiles?.email &&
                              copyToClipboard(member.profiles.email, member.profiles.email)
                            }
                          >
                            {copiedEmail === member.profiles?.email ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={roleColors[member.role] || roleColors.member}
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Role</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Teams ({teams.length})
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Organize members into teams for better collaboration
                </p>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                New Team
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-muted/30 border-border/30 hover:border-border/60 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{team.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {team.description}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border/30">
                      <Users className="h-3.5 w-3.5" />
                      <span>{team.member_count} members</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="p-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Roles & Permissions
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Define roles and their associated permissions
              </p>

              <div className="space-y-4">
                {roles.map((role) => (
                  <Card key={role.id} className="bg-muted/20 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{role.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {role.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Billing Information
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Current Plan: {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enterprise level organization
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Upgrade Plan
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <h4 className="font-medium text-foreground">Payment Method</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No payment method on file. Add one to enable billing.
                    </p>
                    <Button size="sm" variant="outline" className="mt-3">
                      Add Payment Method
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
