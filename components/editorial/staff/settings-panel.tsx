"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell,
  Palette,
  Save,
  Loader2,
  Mail,
  Smartphone,
  Database,
} from "lucide-react";

interface SettingsConfig {
  notifications: {
    emailOnStageComplete: boolean;
    emailOnComment: boolean;
    emailOnUpload: boolean;
    pushNotifications: boolean;
    digestFrequency: "daily" | "weekly" | "never";
  };
  editorial: {
    defaultLanguage: string;
    autoAssignEditor: boolean;
    requireApprovalForAdvance: boolean;
    enableAiSuggestions: boolean;
    maxUploadSizeMb: number;
  };
  display: {
    compactMode: boolean;
    showAiBadges: boolean;
    defaultView: "grid" | "list" | "kanban";
    timezone: string;
  };
}

const DEFAULT_SETTINGS: SettingsConfig = {
  notifications: {
    emailOnStageComplete: true,
    emailOnComment: true,
    emailOnUpload: false,
    pushNotifications: true,
    digestFrequency: "daily",
  },
  editorial: {
    defaultLanguage: "es",
    autoAssignEditor: true,
    requireApprovalForAdvance: true,
    enableAiSuggestions: true,
    maxUploadSizeMb: 50,
  },
  display: {
    compactMode: false,
    showAiBadges: true,
    defaultView: "grid",
    timezone: "America/Mexico_City",
  },
};

interface SettingsPanelProps {
  companyId?: string;
}

export function SettingsPanel({ companyId }: SettingsPanelProps) {
  const [settings, setSettings] = useState<SettingsConfig>({ ...DEFAULT_SETTINGS });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveSettings() {
    setSaving(true);
    try {
      const endpoint = companyId
        ? `/api/staff/companies/${companyId}/settings`
        : "/api/staff/settings";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </div>
          <CardDescription>Configura como recibir las notificaciones del sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Email al completar etapa</Label>
            </div>
            <Switch
              checked={settings.notifications.emailOnStageComplete}
              onCheckedChange={(v) =>
                setSettings({ ...settings, notifications: { ...settings.notifications, emailOnStageComplete: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Email al recibir comentario</Label>
            </div>
            <Switch
              checked={settings.notifications.emailOnComment}
              onCheckedChange={(v) =>
                setSettings({ ...settings, notifications: { ...settings.notifications, emailOnComment: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Notificaciones push</Label>
            </div>
            <Switch
              checked={settings.notifications.pushNotifications}
              onCheckedChange={(v) =>
                setSettings({ ...settings, notifications: { ...settings.notifications, pushNotifications: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Resumen por email</Label>
            <Select
              value={settings.notifications.digestFrequency}
              onValueChange={(v) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, digestFrequency: v as "daily" | "weekly" | "never" },
                })
              }
            >
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Editorial */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Editorial</CardTitle>
          </div>
          <CardDescription>Configuracion del flujo editorial.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Idioma predeterminado</Label>
            <Select
              value={settings.editorial.defaultLanguage}
              onValueChange={(v) =>
                setSettings({ ...settings, editorial: { ...settings.editorial, defaultLanguage: v } })
              }
            >
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Espanol</SelectItem>
                <SelectItem value="en">Ingles</SelectItem>
                <SelectItem value="pt">Portugues</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Auto-asignar editor</Label>
            <Switch
              checked={settings.editorial.autoAssignEditor}
              onCheckedChange={(v) =>
                setSettings({ ...settings, editorial: { ...settings.editorial, autoAssignEditor: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Requerir aprobacion para avanzar etapa</Label>
            <Switch
              checked={settings.editorial.requireApprovalForAdvance}
              onCheckedChange={(v) =>
                setSettings({ ...settings, editorial: { ...settings.editorial, requireApprovalForAdvance: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Sugerencias de IA habilitadas</Label>
            <Switch
              checked={settings.editorial.enableAiSuggestions}
              onCheckedChange={(v) =>
                setSettings({ ...settings, editorial: { ...settings.editorial, enableAiSuggestions: v } })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Visualizacion</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Modo compacto</Label>
            <Switch
              checked={settings.display.compactMode}
              onCheckedChange={(v) =>
                setSettings({ ...settings, display: { ...settings.display, compactMode: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Mostrar badges de IA</Label>
            <Switch
              checked={settings.display.showAiBadges}
              onCheckedChange={(v) =>
                setSettings({ ...settings, display: { ...settings.display, showAiBadges: v } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Vista predeterminada</Label>
            <Select
              value={settings.display.defaultView}
              onValueChange={(v) =>
                setSettings({ ...settings, display: { ...settings.display, defaultView: v as "grid" | "list" | "kanban" } })
              }
            >
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Cuadricula</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-2">
        {saved && <Badge className="bg-emerald-500/10 text-emerald-600 self-center">Guardado</Badge>}
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando..." : "Guardar configuracion"}
        </Button>
      </div>
    </div>
  );
}
