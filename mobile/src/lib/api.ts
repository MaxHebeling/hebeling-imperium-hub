import { supabase } from "./supabase";

/**
 * API client — se conecta a las mismas APIs del portal web de Reino Editorial.
 * Base URL configurable para desarrollo/producción.
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "https://hebeling-imperium-hub.vercel.app";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function apiGet<T>(path: string): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json };
    }
    return { success: false, error: json.error ?? "Error desconocido" };
  } catch {
    return { success: false, error: "Error de conexión. Verifica tu red e intenta de nuevo." };
  }
}

async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      return { success: true, data: json };
    }
    return { success: false, error: json.error ?? "Error desconocido" };
  } catch {
    return { success: false, error: "Error de conexión. Verifica tu red e intenta de nuevo." };
  }
}

// ─── Endpoints del portal ────────────────────────────────────────────

export async function fetchProjects() {
  return apiGet<{ projects: EditorialProject[] }>("/api/editorial/client/projects/list");
}

export async function fetchProjectProgress(projectId: string) {
  return apiGet<ProjectProgressData>(`/api/editorial/client/projects/${projectId}/progress`);
}

export async function fetchNotifications(limit = 20) {
  return apiGet<{ notifications: EditorialNotification[]; unreadCount: number }>(
    `/api/editorial/client/notifications?limit=${limit}`
  );
}

export async function markNotificationsRead() {
  return apiPost("/api/editorial/client/notifications", { action: "markAllRead" });
}

export async function sendComment(projectId: string, comment: string) {
  return apiPost(`/api/editorial/client/projects/${projectId}/comments`, { comment });
}

export async function sendCoverRequest(
  projectId: string,
  data: { authorPrompt: string; colorPalette?: string; references?: string; imageStyle: string }
) {
  return apiPost(`/api/editorial/client/projects/${projectId}/cover-request`, data);
}

// ─── Tipos ───────────────────────────────────────────────────────────

export interface EditorialProject {
  id: string;
  title: string;
  subtitle?: string;
  author_name?: string;
  language?: string;
  genre?: string;
  current_stage: string;
  status: string;
  progress_percent: number;
  due_date?: string;
  created_at: string;
}

export interface EditorialFile {
  id: string;
  file_type: string;
  version: number;
  size_bytes: number;
  created_at: string;
  storage_path?: string;
}

export interface EditorialComment {
  id: string;
  comment: string;
  author_type: "client" | "staff";
  created_at: string;
}

export interface EditorialExport {
  id: string;
  export_type: string;
  version: number;
  created_at: string;
}

export interface EditorialNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  project_id?: string;
}

export interface ProjectProgressData {
  project: EditorialProject;
  stages: Array<{
    id: string;
    stage_key: string;
    status: string;
    started_at?: string;
    completed_at?: string;
  }>;
  files: EditorialFile[];
  comments: EditorialComment[];
  exports: EditorialExport[];
}
