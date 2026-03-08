'use client';

import { useLanguage } from "@/lib/i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Shield,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import Link from "next/link";
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
import { Input } from "@/components/ui/input";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  plan: string;
  members_count: number;
  created_at: string;
}

interface OrganizationsContentProps {
  organizations: Organization[];
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

export function OrganizationsContent({ organizations }: OrganizationsContentProps) {
  const { t } = useLanguage();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              {t.organizations.management}
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            {t.organizations.title}
          </h1>
          <p className="text-muted-foreground">
            {t.organizations.subtitle}
          </p>
        </div>
        <Link href="/app/organizations/new">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            {t.organizations.newOrganization}
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <Card className="bg-card/40 border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.organizations.searchPlaceholder}
                className="pl-9 h-10 bg-background/50 border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card className="bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            {t.organizations.allOrganizations} ({organizations.length})
          </CardTitle>
          <CardDescription>
            {t.organizations.overview}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <EmptyOrgState t={t} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead>{t.organizations.organization}</TableHead>
                    <TableHead>{t.organizations.plan}</TableHead>
                    <TableHead>{t.organizations.status}</TableHead>
                    <TableHead className="text-right">{t.nav.team}</TableHead>
                    <TableHead className="text-right">{t.common.created}</TableHead>
                    <TableHead className="text-right">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow
                      key={org.id}
                      className="border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={`/app/organizations/${org.id}`}
                          className="flex items-center gap-3 group cursor-pointer"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground group-hover:text-primary transition-colors">
                              {org.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {org.slug}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={planColors[org.plan] || planColors.starter}
                        >
                          {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[org.status] || statusColors.active}
                        >
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{org.members_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/organizations/${org.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t.common.view}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t.common.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t.organizations.totalOrganizations}
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {organizations.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t.common.active}
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {organizations.filter((o) => o.status === "active").length}
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
                  {t.organizations.totalMembers}
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {organizations.reduce((sum, o) => sum + o.members_count, 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyOrgState({ t }: { t: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
        <Building2 className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{t.organizations.noOrganizations}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        {t.organizations.createFirst}
      </p>
      <Link href="/app/organizations/new" className="mt-4">
        <Button size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          {t.organizations.createOrganization}
        </Button>
      </Link>
    </div>
  );
}
