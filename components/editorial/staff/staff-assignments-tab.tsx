 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus } from "lucide-react";
import type {
  EditorialProjectStaffAssignment,
  StaffProjectMember,
} from "@/lib/editorial/types/editorial";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_LABELS: Record<string, string> = {
  author: "Autor",
  editor: "Editor",
  reviewer: "Revisor",
  manager: "Manager",
  proofreader: "Corrector",
  designer: "Diseñador",
};

const PLACEHOLDER_ROLES: Record<string, string> = {
  manager: "Por asignar",
  proofreader: "Por asignar",
  designer: "Por asignar",
};

interface StaffAssignmentsTabProps {
  members: StaffProjectMember[];
  staffAssignments: EditorialProjectStaffAssignment[];
  projectId: string;
}

export function StaffAssignmentsTab({
  members,
  staffAssignments,
  projectId,
}: StaffAssignmentsTabProps) {
  const router = useRouter();
  const [open, setOpen] = useState<"members" | "staff" | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assignMembers() {
    setError(null);
    const value = email.trim();
    if (!value) {
      setError("Ingresa un email.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, role }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo asignar.");
        return;
      }
      setEmail("");
      setOpen(null);
      router.refresh();
    } catch {
      setError("Error de red al asignar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function assignStaff() {
    setError(null);
    const value = email.trim();
    if (!value) {
      setError("Ingresa un email.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/staff/projects/${projectId}/staff-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, role }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "No se pudo asignar.");
        return;
      }
      setEmail("");
      setOpen(null);
      router.refresh();
    } catch {
      setError("Error de red al asignar.");
    } finally {
      setIsSaving(false);
    }
  }

  const byRole = members.reduce<Record<string, StaffProjectMember[]>>((acc, m) => {
    const r = m.role;
    if (!acc[r]) acc[r] = [];
    acc[r].push(m);
    return acc;
  }, {});

  const staffByRole = staffAssignments.reduce<Record<string, EditorialProjectStaffAssignment[]>>(
    (acc, a) => {
      if (!acc[a.role]) acc[a.role] = [];
      acc[a.role].push(a);
      return acc;
    },
    {}
  );

  const staffRows: { roleKey: string; label: string; assignee: EditorialProjectStaffAssignment | null }[] =
    [
      { roleKey: "manager", label: ROLE_LABELS.manager, assignee: (staffByRole["manager"] ?? [])[0] ?? null },
      { roleKey: "editor", label: ROLE_LABELS.editor, assignee: (staffByRole["editor"] ?? [])[0] ?? null },
      { roleKey: "reviewer", label: ROLE_LABELS.reviewer, assignee: (staffByRole["reviewer"] ?? [])[0] ?? null },
      { roleKey: "proofreader", label: ROLE_LABELS.proofreader, assignee: (staffByRole["proofreader"] ?? [])[0] ?? null },
      { roleKey: "designer", label: ROLE_LABELS.designer, assignee: (staffByRole["designer"] ?? [])[0] ?? null },
    ];

  const memberRows: { roleKey: string; label: string; people: StaffProjectMember[] }[] = [
    { roleKey: "author", label: ROLE_LABELS.author, people: byRole["author"] ?? [] },
    { roleKey: "editor", label: ROLE_LABELS.editor, people: byRole["editor"] ?? [] },
    { roleKey: "reviewer", label: ROLE_LABELS.reviewer, people: byRole["reviewer"] ?? [] },
  ];

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Asignaciones
          </CardTitle>
          <CardDescription>
            Staff del proyecto + miembros (autor/editor/revisor).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Asigna por email desde `profiles.email`.
            </p>
            <div className="flex gap-2">
              <Dialog open={open === "staff"} onOpenChange={(v) => setOpen(v ? "staff" : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Asignar staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Asignar staff</DialogTitle>
                    <DialogDescription>
                      Manager, editor, revisor, corrector y diseñador (1 por rol).
                    </DialogDescription>
                  </DialogHeader>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="persona@editorial.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="reviewer">Revisor</SelectItem>
                          <SelectItem value="proofreader">Corrector</SelectItem>
                          <SelectItem value="designer">Diseñador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setOpen(null)} disabled={isSaving}>
                      Cancelar
                    </Button>
                    <Button onClick={assignStaff} disabled={isSaving}>
                      {isSaving ? "Guardando…" : "Asignar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={open === "members"} onOpenChange={(v) => setOpen(v ? "members" : null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Asignar miembro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Asignar miembro (legacy)</DialogTitle>
                  <DialogDescription>
                    Autor/editor/revisor vía `editorial_project_members`.
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="persona@editorial.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Autor</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="reviewer">Revisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setOpen(null)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={assignMembers} disabled={isSaving}>
                    {isSaving ? "Guardando…" : "Asignar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Staff del proyecto
              </h4>
              <ul className="space-y-0">
                {staffRows.map(({ roleKey, label, assignee }, i) => {
                  const placeholder = PLACEHOLDER_ROLES[roleKey];
                  const value =
                    assignee?.user_full_name ?? assignee?.user_email ?? assignee?.user_id ?? null;

                  return (
                    <li
                      key={roleKey}
                      className={`flex flex-col gap-1 py-3 ${
                        i < staffRows.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                      </span>
                      {value ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm">{value}</span>
                          <Badge variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <UserPlus className="h-3.5 w-3.5" />
                          {placeholder ?? "Por asignar"}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Miembros (legacy)
              </h4>
              <ul className="space-y-0">
                {memberRows.map(({ roleKey, label, people }, i) => {
                  const hasPeople = people.length > 0;

                  return (
                    <li
                      key={roleKey}
                      className={`flex flex-col gap-1 py-3 ${
                        i < memberRows.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                      </span>
                      {hasPeople ? (
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          {people.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1.5 text-sm"
                            >
                              <span>{m.full_name ?? m.email ?? m.user_id}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <UserPlus className="h-3.5 w-3.5" />
                          Por asignar
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
