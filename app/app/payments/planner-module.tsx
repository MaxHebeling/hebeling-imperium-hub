"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Wallet,
} from "lucide-react";

type Scope = "personal" | "empresarial";
type WeekKey = "w1" | "w2" | "w3" | "w4" | "w5";
type PaymentCategory = "deuda" | "fijo" | "servicio" | "variable";
type DebtPriority = "alta" | "media" | "baja";

interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  week: WeekKey;
  scope: Scope;
  received: boolean;
}

interface PaymentItem {
  id: string;
  name: string;
  amount: number;
  week: WeekKey;
  dueDay: number;
  scope: Scope;
  category: PaymentCategory;
  debtId: string | null;
  paid: boolean;
}

interface DebtItem {
  id: string;
  name: string;
  initialBalance: number;
  minPayment: number;
  dueDay: number;
  scope: Scope;
  priority: DebtPriority;
}

interface PlannerState {
  month: string;
  openingBalance: number;
  reserveTarget: number;
  incomes: IncomeItem[];
  payments: PaymentItem[];
  debts: DebtItem[];
}

interface FinancePlannerModuleProps {
  isUnlocked: boolean;
}

const STORAGE_KEY = "hebeling-finance-planner-v1";
const FINANCE_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const USER_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "keydown",
  "click",
  "touchstart",
];

const WEEK_OPTIONS: Array<{ value: WeekKey; label: string }> = [
  { value: "w1", label: "Semana 1 (días 1-7)" },
  { value: "w2", label: "Semana 2 (días 8-14)" },
  { value: "w3", label: "Semana 3 (días 15-21)" },
  { value: "w4", label: "Semana 4 (días 22-28)" },
  { value: "w5", label: "Semana 5 (días 29-31)" },
];

const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  deuda: "Deuda",
  fijo: "Gasto fijo",
  servicio: "Servicio",
  variable: "Variable",
};

const PRIORITY_LABELS: Record<DebtPriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function getCurrentMonthValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekFromDay(day: number): WeekKey {
  if (day <= 7) return "w1";
  if (day <= 14) return "w2";
  if (day <= 21) return "w3";
  if (day <= 28) return "w4";
  return "w5";
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultPlannerState(): PlannerState {
  return {
    month: getCurrentMonthValue(),
    openingBalance: 0,
    reserveTarget: 0,
    incomes: [],
    payments: [],
    debts: [],
  };
}

export function FinancePlannerModule({ isUnlocked }: FinancePlannerModuleProps) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [unlocking, setUnlocking] = useState(false);
  const [lockError, setLockError] = useState("");
  const [password, setPassword] = useState("");
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockInProgressRef = useRef(false);

  const [planner, setPlanner] = useState<PlannerState>(getDefaultPlannerState());
  const [isLoaded, setIsLoaded] = useState(false);

  const [incomeForm, setIncomeForm] = useState({
    name: "",
    amount: "",
    week: "w1" as WeekKey,
    scope: "personal" as Scope,
  });

  const [paymentForm, setPaymentForm] = useState({
    name: "",
    amount: "",
    dueDay: "1",
    week: "w1" as WeekKey,
    scope: "personal" as Scope,
    category: "fijo" as PaymentCategory,
    debtId: "none",
  });

  const [debtForm, setDebtForm] = useState({
    name: "",
    initialBalance: "",
    minPayment: "",
    dueDay: "1",
    scope: "personal" as Scope,
    priority: "media" as DebtPriority,
  });

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification(title, {
      body,
      tag: "finance-vault-security",
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    try {
      await Notification.requestPermission();
    } catch {
      // Ignore permission errors to avoid blocking auth flow.
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (!inactivityTimerRef.current) return;
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }, []);

  const lockModule = useCallback(
    async (reason: "manual" | "inactivity") => {
      if (lockInProgressRef.current) return;
      lockInProgressRef.current = true;
      clearInactivityTimer();

      try {
        await fetch("/api/finance/lock", { method: "POST" });
      } finally {
        setUnlocked(false);
        setPassword("");
        setLockError(
          reason === "inactivity"
            ? "Sesión bloqueada por inactividad (5 minutos)."
            : ""
        );

        if (reason === "inactivity") {
          showBrowserNotification(
            "Finance Vault bloqueado",
            "Se bloqueó automáticamente tras 5 minutos de inactividad."
          );
        } else {
          showBrowserNotification(
            "Finance Vault bloqueado",
            "El módulo fue bloqueado manualmente."
          );
        }

        router.refresh();
        lockInProgressRef.current = false;
      }
    },
    [clearInactivityTimer, router, showBrowserNotification]
  );

  const resetInactivityTimer = useCallback(() => {
    if (!unlocked) return;
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      void lockModule("inactivity");
    }, FINANCE_INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer, lockModule, unlocked]);

  useEffect(() => {
    if (!unlocked) {
      setIsLoaded(true);
      return;
    }

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as PlannerState;
        setPlanner(parsedState);
      } catch {
        setPlanner(getDefaultPlannerState());
      }
    }

    setIsLoaded(true);
  }, [unlocked]);

  useEffect(() => {
    // localStorage stores planner content only (not auth/session state).
    if (!unlocked || !isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planner));
  }, [planner, unlocked, isLoaded]);

  useEffect(() => {
    if (!unlocked || !isLoaded) {
      clearInactivityTimer();
      return;
    }

    // Security behavior:
    // - Any user interaction resets the inactivity timer.
    // - No interaction for 5 minutes triggers server-side lock endpoint.
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    USER_ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity);
    });

    resetInactivityTimer();

    return () => {
      USER_ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      clearInactivityTimer();
    };
  }, [clearInactivityTimer, isLoaded, resetInactivityTimer, unlocked]);

  const financialSummary = useMemo(() => {
    const plannedIncome = planner.incomes.reduce((sum, item) => sum + item.amount, 0);
    const plannedPayments = planner.payments.reduce((sum, item) => sum + item.amount, 0);
    const actualIncome = planner.incomes
      .filter((item) => item.received)
      .reduce((sum, item) => sum + item.amount, 0);
    const actualPayments = planner.payments
      .filter((item) => item.paid)
      .reduce((sum, item) => sum + item.amount, 0);

    const projectedClosing = planner.openingBalance + plannedIncome - plannedPayments;
    const actualClosing = planner.openingBalance + actualIncome - actualPayments;

    return {
      plannedIncome,
      plannedPayments,
      actualIncome,
      actualPayments,
      projectedClosing,
      actualClosing,
      reserveGap: planner.reserveTarget - projectedClosing,
    };
  }, [planner]);

  const weeklySummary = useMemo(() => {
    return WEEK_OPTIONS.map((week) => {
      const incomes = planner.incomes.filter((item) => item.week === week.value);
      const payments = planner.payments.filter((item) => item.week === week.value);

      const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
      const paymentsTotal = payments.reduce((sum, item) => sum + item.amount, 0);
      const net = incomeTotal - paymentsTotal;

      return {
        ...week,
        incomes,
        payments,
        incomeTotal,
        paymentsTotal,
        net,
      };
    });
  }, [planner.incomes, planner.payments]);

  const debtBreakdown = useMemo(() => {
    const paidByDebtId = planner.payments
      .filter((payment) => payment.paid && payment.debtId)
      .reduce<Record<string, number>>((acc, payment) => {
        const key = payment.debtId!;
        acc[key] = (acc[key] || 0) + payment.amount;
        return acc;
      }, {});

    return planner.debts.map((debt) => {
      const paid = paidByDebtId[debt.id] || 0;
      const remaining = Math.max(debt.initialBalance - paid, 0);
      const progress =
        debt.initialBalance > 0
          ? Math.min((paid / debt.initialBalance) * 100, 100)
          : 100;

      return { ...debt, paid, remaining, progress };
    });
  }, [planner.debts, planner.payments]);

  async function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUnlocking(true);
    setLockError("");

    try {
      const response = await fetch("/api/finance/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setLockError(payload.error || "No fue posible desbloquear el módulo.");
        return;
      }

      await requestNotificationPermission();
      setUnlocked(true);
      setPassword("");
      setLockError("");
      showBrowserNotification(
        "Finance Vault desbloqueado",
        "Acceso concedido al módulo financiero."
      );
      router.refresh();
    } catch {
      setLockError("Error de conexión. Intenta nuevamente.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleLockModule() {
    await lockModule("manual");
  }

  function addIncome() {
    const amount = Number(incomeForm.amount);
    if (!incomeForm.name.trim() || Number.isNaN(amount) || amount <= 0) return;

    const income: IncomeItem = {
      id: generateId(),
      name: incomeForm.name.trim(),
      amount,
      week: incomeForm.week,
      scope: incomeForm.scope,
      received: false,
    };

    setPlanner((prev) => ({ ...prev, incomes: [income, ...prev.incomes] }));
    setIncomeForm({ name: "", amount: "", week: incomeForm.week, scope: incomeForm.scope });
  }

  function addPayment() {
    const amount = Number(paymentForm.amount);
    const dueDay = Number(paymentForm.dueDay);
    if (!paymentForm.name.trim() || Number.isNaN(amount) || amount <= 0) return;

    const payment: PaymentItem = {
      id: generateId(),
      name: paymentForm.name.trim(),
      amount,
      week: paymentForm.week,
      dueDay: Number.isNaN(dueDay) ? 1 : Math.max(1, Math.min(31, dueDay)),
      scope: paymentForm.scope,
      category: paymentForm.category,
      debtId: paymentForm.debtId === "none" ? null : paymentForm.debtId,
      paid: false,
    };

    setPlanner((prev) => ({ ...prev, payments: [payment, ...prev.payments] }));
    setPaymentForm({
      name: "",
      amount: "",
      dueDay: "1",
      week: paymentForm.week,
      scope: paymentForm.scope,
      category: paymentForm.category,
      debtId: "none",
    });
  }

  function addDebt() {
    const initialBalance = Number(debtForm.initialBalance);
    const minPayment = Number(debtForm.minPayment);
    const dueDay = Number(debtForm.dueDay);
    if (!debtForm.name.trim() || Number.isNaN(initialBalance) || initialBalance <= 0) return;

    const safeDueDay = Number.isNaN(dueDay) ? 1 : Math.max(1, Math.min(31, dueDay));
    const debtId = generateId();
    const debt: DebtItem = {
      id: debtId,
      name: debtForm.name.trim(),
      initialBalance,
      minPayment: Number.isNaN(minPayment) ? 0 : Math.max(0, minPayment),
      dueDay: safeDueDay,
      scope: debtForm.scope,
      priority: debtForm.priority,
    };

    const autoPayment: PaymentItem | null =
      debt.minPayment > 0
        ? {
            id: generateId(),
            name: `Pago mínimo: ${debt.name}`,
            amount: debt.minPayment,
            week: getWeekFromDay(safeDueDay),
            dueDay: safeDueDay,
            scope: debt.scope,
            category: "deuda",
            debtId,
            paid: false,
          }
        : null;

    setPlanner((prev) => ({
      ...prev,
      debts: [debt, ...prev.debts],
      payments: autoPayment ? [autoPayment, ...prev.payments] : prev.payments,
    }));

    setDebtForm({
      name: "",
      initialBalance: "",
      minPayment: "",
      dueDay: "1",
      scope: debtForm.scope,
      priority: debtForm.priority,
    });
  }

  if (!unlocked) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Módulo de Finanzas protegido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="finance-password">Clave de acceso</Label>
                <Input
                  id="finance-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la clave del módulo"
                  required
                />
              </div>

              {lockError && (
                <p className="text-sm text-destructive">{lockError}</p>
              )}

              <Button type="submit" className="w-full" disabled={unlocking}>
                {unlocking ? "Validando..." : "Desbloquear Finanzas"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Este candado aplica incluso dentro de Hebeling OS. Configura la
                clave en la variable de entorno <code>FINANCE_MODULE_KEY</code>.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Planificador Financiero (Personal / Empresarial)
          </h1>
          <p className="text-muted-foreground">
            Control mensual por semanas para ingresos, pagos y deudas.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="space-y-1">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={planner.month}
              onChange={(e) =>
                setPlanner((prev) => ({ ...prev, month: e.target.value }))
              }
            />
          </div>
          <Button variant="outline" className="self-end" onClick={handleLockModule}>
            <Lock className="h-4 w-4 mr-2" />
            Bloquear módulo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Flujo proyectado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary.projectedClosing.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos: ${financialSummary.plannedIncome.toLocaleString()} - Pagos: $
              {financialSummary.plannedPayments.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Reserva de seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              value={planner.reserveTarget}
              onChange={(e) =>
                setPlanner((prev) => ({
                  ...prev,
                  reserveTarget: Number(e.target.value) || 0,
                }))
              }
              placeholder="Meta de reserva"
            />
            <p className="text-xs text-muted-foreground">
              {financialSummary.reserveGap > 0
                ? `Faltan $${financialSummary.reserveGap.toLocaleString()} para la meta`
                : "Meta cubierta con el flujo proyectado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Saldo de apertura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={planner.openingBalance}
              onChange={(e) =>
                setPlanner((prev) => ({
                  ...prev,
                  openingBalance: Number(e.target.value) || 0,
                }))
              }
              placeholder="Saldo inicial del mes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Cierre real acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary.actualClosing.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos cobrados: ${financialSummary.actualIncome.toLocaleString()} - Pagos
              ejecutados: ${financialSummary.actualPayments.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weeks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weeks">Semanas</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="debts">Deudas</TabsTrigger>
        </TabsList>

        <TabsContent value="weeks" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {weeklySummary.map((week) => (
              <Card key={week.value}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    {week.label}
                    <Badge variant={week.net >= 0 ? "default" : "destructive"}>
                      Neto: ${week.net.toLocaleString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border p-2">
                      <p className="text-muted-foreground">Ingresos</p>
                      <p className="font-semibold">${week.incomeTotal.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <p className="text-muted-foreground">Pagos</p>
                      <p className="font-semibold">${week.paymentsTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {week.incomes.length === 0 && week.payments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Sin movimientos programados.
                      </p>
                    )}

                    {week.incomes.map((income) => (
                      <div
                        key={income.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={income.received}
                            onCheckedChange={(checked) =>
                              setPlanner((prev) => ({
                                ...prev,
                                incomes: prev.incomes.map((item) =>
                                  item.id === income.id
                                    ? { ...item, received: checked === true }
                                    : item
                                ),
                              }))
                            }
                          />
                          <div>
                            <p className="text-sm font-medium">{income.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {income.scope === "personal" ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )}
                              {income.scope}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">
                          +${income.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {week.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={payment.paid}
                            onCheckedChange={(checked) =>
                              setPlanner((prev) => ({
                                ...prev,
                                payments: prev.payments.map((item) =>
                                  item.id === payment.id
                                    ? { ...item, paid: checked === true }
                                    : item
                                ),
                              }))
                            }
                          />
                          <div>
                            <p className="text-sm font-medium">{payment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[payment.category]} - Día {payment.dueDay}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">
                          -${payment.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agregar ingreso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input
                    value={incomeForm.name}
                    onChange={(e) =>
                      setIncomeForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Sueldo, ventas, cobro cliente..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      value={incomeForm.amount}
                      onChange={(e) =>
                        setIncomeForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Semana</Label>
                    <Select
                      value={incomeForm.week}
                      onValueChange={(value) =>
                        setIncomeForm((prev) => ({ ...prev, week: value as WeekKey }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEK_OPTIONS.map((week) => (
                          <SelectItem key={week.value} value={week.value}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={incomeForm.scope}
                    onValueChange={(value) =>
                      setIncomeForm((prev) => ({ ...prev, scope: value as Scope }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addIncome} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ingreso
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agregar pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Concepto</Label>
                  <Input
                    value={paymentForm.name}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Renta, proveedor, tarjeta..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Día de pago</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={paymentForm.dueDay}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          dueDay: e.target.value,
                          week: getWeekFromDay(Number(e.target.value) || 1),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Semana</Label>
                    <Select
                      value={paymentForm.week}
                      onValueChange={(value) =>
                        setPaymentForm((prev) => ({ ...prev, week: value as WeekKey }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEK_OPTIONS.map((week) => (
                          <SelectItem key={week.value} value={week.value}>
                            {week.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={paymentForm.category}
                      onValueChange={(value) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          category: value as PaymentCategory,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deuda">Deuda</SelectItem>
                        <SelectItem value="fijo">Fijo</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={paymentForm.scope}
                      onValueChange={(value) =>
                        setPaymentForm((prev) => ({ ...prev, scope: value as Scope }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="empresarial">Empresarial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Relacionar deuda</Label>
                    <Select
                      value={paymentForm.debtId}
                      onValueChange={(value) =>
                        setPaymentForm((prev) => ({ ...prev, debtId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin relación</SelectItem>
                        {planner.debts.map((debt) => (
                          <SelectItem key={debt.id} value={debt.id}>
                            {debt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addPayment} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar pago
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimientos del mes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {planner.incomes.length === 0 && planner.payments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aún no hay movimientos cargados.
                </p>
              )}

              {planner.incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="text-sm font-medium">{income.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ingreso - {income.scope} - {WEEK_OPTIONS.find((w) => w.value === income.week)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-600">
                      +${income.amount.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPlanner((prev) => ({
                          ...prev,
                          incomes: prev.incomes.filter((item) => item.id !== income.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              {planner.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="text-sm font-medium">{payment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[payment.category]} - {payment.scope} - Día {payment.dueDay}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600">
                      -${payment.amount.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPlanner((prev) => ({
                          ...prev,
                          payments: prev.payments.filter((item) => item.id !== payment.id),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrar deuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre de la deuda</Label>
                  <Input
                    value={debtForm.name}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Tarjeta principal, préstamo..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saldo actual</Label>
                  <Input
                    type="number"
                    value={debtForm.initialBalance}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        initialBalance: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pago mínimo mensual</Label>
                  <Input
                    type="number"
                    value={debtForm.minPayment}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        minPayment: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Día de vencimiento</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={debtForm.dueDay}
                    onChange={(e) =>
                      setDebtForm((prev) => ({ ...prev, dueDay: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={debtForm.scope}
                    onValueChange={(value) =>
                      setDebtForm((prev) => ({ ...prev, scope: value as Scope }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="empresarial">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={debtForm.priority}
                    onValueChange={(value) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        priority: value as DebtPriority,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={addDebt}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar deuda y programar pago mínimo
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {debtBreakdown.map((debt) => (
              <Card key={debt.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {debt.name}
                    <Badge variant="outline">{PRIORITY_LABELS[debt.priority]}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo inicial</span>
                    <span className="font-medium">${debt.initialBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pagado este mes</span>
                    <span className="font-medium text-emerald-600">
                      ${debt.paid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo pendiente</span>
                    <span className="font-medium text-red-600">
                      ${debt.remaining.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={debt.progress} />
                  <p className="text-xs text-muted-foreground">
                    Vence el día {debt.dueDay} - {debt.scope}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setPlanner((prev) => ({
                        ...prev,
                        debts: prev.debts.filter((item) => item.id !== debt.id),
                        payments: prev.payments.filter((item) => item.debtId !== debt.id),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar deuda
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {debtBreakdown.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No hay deudas registradas todavía.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
