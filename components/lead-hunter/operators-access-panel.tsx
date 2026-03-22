"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Clock3,
  Copy,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type OperatorRole = "sales" | "ops";
type OperatorStatus = "active" | "invited";

type BrandOperator = {
  id: string;
  fullName: string | null;
  email: string;
  role: OperatorRole;
  status: OperatorStatus;
  invitedAt: string | null;
  lastSignInAt: string | null;
};

type OperatorsResponse = {
  success: true;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  canInvite: boolean;
  operators: BrandOperator[];
};

type InviteSharePayload = {
  subject: string;
  message: string;
  accessUrl: string;
  ctaLabel: string;
};

type InviteSuccessPayload = {
  success: true;
  message: string;
  emailSent?: boolean;
  share?: InviteSharePayload;
};

function formatDate(value: string | null, locale: "es" | "en") {
  if (!value) {
    return locale === "es" ? "Sin registro" : "No record";
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LeadHunterOperatorsAccessPanel() {
  const { locale } = useLanguage();
  const { toast } = useToast();
  const [operators, setOperators] = useState<BrandOperator[]>([]);
  const [canInvite, setCanInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OperatorRole>("ops");
  const [submitting, setSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    emailSent: boolean;
    share: InviteSharePayload | null;
  } | null>(null);
  const [copiedValue, setCopiedValue] = useState<"message" | "link" | null>(null);

  const copy = useMemo(
    () => ({
      title: locale === "es" ? "Acceso del operador" : "Operator access",
      subtitle:
        locale === "es"
          ? "Invita y controla al responsable de Lead Hunter sin abrir acceso al resto del sistema."
          : "Invite and control the Lead Hunter operator without exposing the rest of the OS.",
      inviteTitle: locale === "es" ? "Invitar operador" : "Invite operator",
      inviteDescription:
        locale === "es"
          ? "Este usuario entra por tu web, queda limitado a Lead Hunter y puede operar todo dentro de esa empresa."
          : "This user signs in through your website, stays limited to Lead Hunter, and can operate everything inside that company.",
      fullName: locale === "es" ? "Nombre completo" : "Full name",
      email: locale === "es" ? "Correo" : "Email",
      role: locale === "es" ? "Perfil interno" : "Internal role",
      sendInvite: locale === "es" ? "Enviar invitación" : "Send invite",
      sending: locale === "es" ? "Enviando..." : "Sending...",
      refresh: locale === "es" ? "Actualizar" : "Refresh",
      activeOperators: locale === "es" ? "Operadores actuales" : "Current operators",
      noOperators:
        locale === "es"
          ? "Todavía no hay operadores asignados a Lead Hunter."
          : "There are no operators assigned to Lead Hunter yet.",
      noPermission:
        locale === "es"
          ? "Las invitaciones las administra el dueño o un admin. Tu acceso ya está limitado correctamente a Lead Hunter."
          : "Invitations are managed by the owner or an admin. Your own access is already correctly limited to Lead Hunter.",
      inviteNote:
        locale === "es"
          ? "Si el correo es nuevo, recibe una invitación para activar su cuenta. Si ya existe, recibe un acceso seguro para entrar directo."
          : "If the email is new, it receives an invitation to activate the account. If it already exists, it receives a secure sign-in link.",
      deliveryTitle:
        locale === "es"
          ? "Entrega profesional del acceso"
          : "Professional access delivery",
      deliveryDescription:
        locale === "es"
          ? "El sistema envia un correo premium y ademas te deja el mensaje privado listo para copiar o reenviar manualmente."
          : "The system sends a premium email and also leaves the private message ready to copy or forward manually.",
      emailDelivered:
        locale === "es"
          ? "Correo premium enviado"
          : "Premium email sent",
      emailPending:
        locale === "es"
          ? "Acceso listo para compartir"
          : "Access ready to share",
      emailDeliveredDescription:
        locale === "es"
          ? "El operador recibio el acceso con una presentacion profesional desde HEBELING OS."
          : "The operator received the access through a professional HEBELING OS presentation.",
      emailPendingDescription:
        locale === "es"
          ? "El acceso ya esta generado. Puedes copiar el mensaje privado o el enlace seguro desde aqui."
          : "The access is already generated. You can copy the private message or secure link from here.",
      copyMessage:
        locale === "es" ? "Copiar mensaje privado" : "Copy private message",
      copyLink:
        locale === "es" ? "Copiar enlace seguro" : "Copy secure link",
      copiedMessage:
        locale === "es" ? "Mensaje copiado" : "Message copied",
      copiedLink:
        locale === "es" ? "Enlace copiado" : "Link copied",
      copySuccessTitle:
        locale === "es" ? "Acceso copiado" : "Access copied",
      messagePreview:
        locale === "es" ? "Vista previa del mensaje" : "Message preview",
      opsLabel: locale === "es" ? "Operaciones" : "Operations",
      salesLabel: locale === "es" ? "Ventas" : "Sales",
      fullAccess:
        locale === "es"
          ? "Acceso completo dentro de Lead Hunter"
          : "Full access inside Lead Hunter",
      invited: locale === "es" ? "Invitado" : "Invited",
      active: locale === "es" ? "Activo" : "Active",
      lastAccess: locale === "es" ? "Último acceso" : "Last access",
      invitedOn: locale === "es" ? "Invitado el" : "Invited on",
      fetchError:
        locale === "es"
          ? "No pude cargar los operadores de Lead Hunter."
          : "I could not load the Lead Hunter operators.",
      successTitle:
        locale === "es" ? "Invitación enviada" : "Invitation sent",
      successDescription:
        locale === "es"
          ? "El operador ya recibió su acceso para Lead Hunter."
          : "The operator has already received access to Lead Hunter.",
      inviteError:
        locale === "es"
          ? "No pude enviar la invitación."
          : "I could not send the invitation.",
    }),
    [locale]
  );

  const loadOperators = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await fetch("/api/staff/brands/lead-hunter/operators", {
          credentials: "include",
        });
        const payload = (await response.json()) as
          | OperatorsResponse
          | { success: false; error?: string };

        if (!response.ok || !payload.success) {
          throw new Error(
            "error" in payload ? payload.error || copy.fetchError : copy.fetchError
          );
        }

        setOperators(payload.operators);
        setCanInvite(payload.canInvite);
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : copy.fetchError;
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [copy.fetchError]
  );

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  const handleCopy = useCallback(
    async (mode: "message" | "link") => {
      if (!inviteResult?.share) {
        return;
      }

      const value =
        mode === "message" ? inviteResult.share.message : inviteResult.share.accessUrl;

      await navigator.clipboard.writeText(value);
      setCopiedValue(mode);
      toast({
        title: copy.copySuccessTitle,
        description: mode === "message" ? copy.copiedMessage : copy.copiedLink,
      });
      window.setTimeout(() => setCopiedValue(null), 1800);
    },
    [copy.copiedLink, copy.copiedMessage, copy.copySuccessTitle, inviteResult, toast]
  );

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/staff/brands/lead-hunter/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const payload = (await response.json()) as
        | InviteSuccessPayload
        | {
            success: false;
            error?: string;
          };

      if (!response.ok || !payload.success) {
        throw new Error(
          "error" in payload ? payload.error || copy.inviteError : copy.inviteError
        );
      }

      toast({
        title: copy.successTitle,
        description:
          payload.message || copy.successDescription,
      });

      setInviteResult({
        email: inviteEmail,
        emailSent: payload.emailSent ?? false,
        share: payload.share ?? null,
      });
      setInviteName("");
      setInviteEmail("");
      setInviteRole("ops");
      await loadOperators("refresh");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : copy.inviteError;
      toast({
        title: copy.inviteError,
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
      <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-[#E1A24A]" />
            {copy.title}
          </CardTitle>
          <CardDescription className="text-[#9FB2CC]">
            {copy.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#C96F2D]/20 bg-[#C96F2D]/8 p-4">
            <p className="text-sm leading-7 text-[#F7E6CE]">{copy.inviteDescription}</p>
          </div>

          {canInvite ? (
            <form className="space-y-4" onSubmit={handleInvite}>
              <div className="space-y-2">
                <Label htmlFor="lead-hunter-operator-name" className="text-[#D6DEEA]">
                  {copy.fullName}
                </Label>
                <Input
                  id="lead-hunter-operator-name"
                  value={inviteName}
                  onChange={(event) => setInviteName(event.target.value)}
                  placeholder={locale === "es" ? "Nombre del operador" : "Operator name"}
                  className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#E7ECF5]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lead-hunter-operator-email" className="text-[#D6DEEA]">
                  {copy.email}
                </Label>
                <Input
                  id="lead-hunter-operator-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="operator@company.com"
                  className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#E7ECF5]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#D6DEEA]">{copy.role}</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as OperatorRole)}
                >
                  <SelectTrigger className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#E7ECF5]">
                    <SelectValue placeholder={copy.role} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ops">{copy.opsLabel}</SelectItem>
                    <SelectItem value="sales">{copy.salesLabel}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#8FA2BC]">{copy.fullAccess}</p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {copy.sending}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {copy.sendInvite}
                  </>
                )}
              </Button>

              <p className="text-xs leading-6 text-[#8FA2BC]">{copy.inviteNote}</p>
            </form>
          ) : (
            <Alert className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#D6DEEA]">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>{copy.title}</AlertTitle>
              <AlertDescription>{copy.noPermission}</AlertDescription>
            </Alert>
          )}

          {inviteResult?.share ? (
            <div className="rounded-[24px] border border-[#E1A24A]/18 bg-[#0B1524]/85 p-4">
              <div className="flex flex-col gap-3 border-b border-[#1E3048] pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#E1A24A]">
                    {copy.deliveryTitle}
                  </p>
                  <h3 className="text-base font-semibold text-[#F5F7FB]">
                    {inviteResult.emailSent ? copy.emailDelivered : copy.emailPending}
                  </h3>
                  <p className="text-sm leading-7 text-[#9FB2CC]">
                    {inviteResult.emailSent
                      ? copy.emailDeliveredDescription
                      : copy.emailPendingDescription}
                  </p>
                </div>
                <Badge className="self-start border-[#E1A24A]/20 bg-[#E1A24A]/10 text-[#F7D7AF] hover:bg-[#E1A24A]/10">
                  {inviteResult.email}
                </Badge>
              </div>

              <div className="space-y-3 pt-4">
                <p className="text-sm leading-7 text-[#C7D2E4]">
                  {copy.deliveryDescription}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  <Button
                    type="button"
                    onClick={() => handleCopy("message")}
                    className="bg-[linear-gradient(135deg,#C96F2D,#E1A24A)] text-white hover:opacity-95"
                  >
                    {copiedValue === "message" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copiedValue === "message" ? copy.copiedMessage : copy.copyMessage}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleCopy("link")}
                    className="border-[#1E3048] bg-[#101B2B] text-[#E7ECF5] hover:bg-[#162235]"
                  >
                    {copiedValue === "link" ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    {copiedValue === "link" ? copy.copiedLink : copy.copyLink}
                  </Button>
                </div>

                <div className="rounded-2xl border border-[#1E3048] bg-[#09111E] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8FA2BC]">
                    {copy.messagePreview}
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-7 text-[#D6DEEA]">
                    {inviteResult.share.message}
                  </pre>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-[#1E3048] bg-[#162235]/80 text-[#E7ECF5]">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-[#E1A24A]" />
              {copy.activeOperators}
            </CardTitle>
            <CardDescription className="text-[#9FB2CC]">
              {copy.fullAccess}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => loadOperators("refresh")}
            disabled={refreshing || loading}
            className="border-[#1E3048] bg-[#0F1B2D]/70 text-[#D6DEEA] hover:bg-[#162235]"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">{copy.refresh}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-2xl bg-[#0F1B2D]/70" />
              <Skeleton className="h-20 rounded-2xl bg-[#0F1B2D]/70" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-100">
              <Mail className="h-4 w-4" />
              <AlertTitle>{copy.fetchError}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : operators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#1E3048] bg-[#0F1B2D]/60 px-4 py-10 text-center text-sm text-[#9FB2CC]">
              {copy.noOperators}
            </div>
          ) : (
            operators.map((operator) => {
              const roleLabel =
                operator.role === "ops" ? copy.opsLabel : copy.salesLabel;

              return (
                <div
                  key={operator.id}
                  className="rounded-2xl border border-[#1E3048] bg-[#0F1B2D]/70 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-[#E7ECF5]">
                          {operator.fullName || operator.email}
                        </p>
                        <Badge className="border-[#C96F2D]/20 bg-[#C96F2D]/10 text-[#F7D7AF] hover:bg-[#C96F2D]/10">
                          {roleLabel}
                        </Badge>
                        <Badge
                          className={
                            operator.status === "active"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10"
                          }
                        >
                          {operator.status === "active" ? (
                            <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                          ) : (
                            <Clock3 className="mr-1 h-3.5 w-3.5" />
                          )}
                          {operator.status === "active" ? copy.active : copy.invited}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#9FB2CC]">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{operator.email}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-[#8FA2BC] lg:text-right">
                      <p>
                        {copy.invitedOn}: {formatDate(operator.invitedAt, locale)}
                      </p>
                      <p>
                        {copy.lastAccess}: {formatDate(operator.lastSignInAt, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
