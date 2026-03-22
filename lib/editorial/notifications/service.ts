import { getAdminClient } from "@/lib/leads/helpers";
import type { EditorialAnyStageKey } from "../types/editorial";
import type {
  CreateNotificationPayload,
  EditorialNotification,
} from "./types";
import {
  STAGE_CLIENT_LABELS,
  STAGE_CLIENT_MESSAGES,
} from "../pipeline/client-delays";
import { resolvePipelineStageKey } from "../pipeline/stage-compat";

// ---------------------------------------------------------------------------
// Core CRUD
// ---------------------------------------------------------------------------

/** Insert a single notification row. */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<EditorialNotification | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("editorial_notifications")
    .insert({
      project_id: payload.projectId,
      recipient_id: payload.recipientId,
      recipient_type: payload.recipientType,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      stage_key: payload.stageKey ?? null,
      metadata: payload.metadata ?? null,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("[notifications] create error:", error.message);
    return null;
  }
  return data as EditorialNotification;
}

/** Fetch notifications for a given recipient (newest first). */
export async function getNotifications(
  recipientId: string,
  opts?: { unreadOnly?: boolean; limit?: number; projectId?: string }
): Promise<EditorialNotification[]> {
  const supabase = getAdminClient();
  let query = supabase
    .from("editorial_notifications")
    .select("*")
    .eq("recipient_id", recipientId)
    .order("created_at", { ascending: false });

  if (opts?.unreadOnly) {
    query = query.eq("is_read", false);
  }
  if (opts?.projectId) {
    query = query.eq("project_id", opts.projectId);
  }
  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[notifications] fetch error:", error.message);
    return [];
  }
  return (data ?? []) as EditorialNotification[];
}

/** Mark one notification as read. */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("editorial_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  return !error;
}

/** Mark all notifications for a recipient as read. */
export async function markAllAsRead(recipientId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("editorial_notifications")
    .update({ is_read: true })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);
  return !error;
}

/** Count unread notifications. */
export async function getUnreadCount(recipientId: string): Promise<number> {
  const supabase = getAdminClient();
  const { count, error } = await supabase
    .from("editorial_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// High-level helpers — call these from the pipeline / comments / etc.
// ---------------------------------------------------------------------------

/** Send welcome notification when a client is linked to a project. */
export async function notifyWelcome(
  projectId: string,
  clientId: string,
  projectTitle: string
): Promise<void> {
  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "welcome",
    title: "¡Bienvenido a Reino Editorial!",
    message: `Tu libro "${projectTitle}" ya está en nuestras manos. Aquí podrás seguir todo el proceso editorial en tiempo real.`,
  });
}

/** Notify client that a new stage has started. */
export async function notifyStageStarted(
  projectId: string,
  clientId: string,
  stageKey: EditorialAnyStageKey,
  projectTitle: string
): Promise<void> {
  const normalizedStageKey = resolvePipelineStageKey(stageKey);
  const label = STAGE_CLIENT_LABELS[normalizedStageKey];
  const msg = STAGE_CLIENT_MESSAGES[normalizedStageKey].active;

  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "stage_started",
    title: `Nueva etapa: ${label}`,
    message: `${msg} — "${projectTitle}"`,
    stageKey,
  });
}

/** Notify client that a stage has been completed. */
export async function notifyStageCompleted(
  projectId: string,
  clientId: string,
  stageKey: EditorialAnyStageKey,
  projectTitle: string
): Promise<void> {
  const normalizedStageKey = resolvePipelineStageKey(stageKey);
  const label = STAGE_CLIENT_LABELS[normalizedStageKey];
  const msg = STAGE_CLIENT_MESSAGES[normalizedStageKey].completed;

  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "stage_completed",
    title: `Etapa completada: ${label}`,
    message: `${msg} — "${projectTitle}"`,
    stageKey,
  });
}

/** Notify client that a staff member left a comment. */
export async function notifyStaffComment(
  projectId: string,
  clientId: string,
  commentPreview: string,
  staffName: string,
  stageKey?: EditorialAnyStageKey | null
): Promise<void> {
  const preview =
    commentPreview.length > 120
      ? commentPreview.slice(0, 120) + "…"
      : commentPreview;

  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "comment_staff",
    title: `Nuevo comentario de ${staffName}`,
    message: preview,
    stageKey: stageKey ?? null,
    metadata: { staffName },
  });
}

/** Notify client that the staff made a suggestion on the manuscript. */
export async function notifySuggestion(
  projectId: string,
  clientId: string,
  suggestionPreview: string,
  staffName: string,
  stageKey?: EditorialAnyStageKey | null
): Promise<void> {
  const preview =
    suggestionPreview.length > 120
      ? suggestionPreview.slice(0, 120) + "…"
      : suggestionPreview;

  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "suggestion",
    title: `Nueva sugerencia de ${staffName}`,
    message: preview,
    stageKey: stageKey ?? null,
    metadata: { staffName },
  });
}

/** Notify client that project data was updated (title, genre, etc.). */
export async function notifyProjectUpdate(
  projectId: string,
  clientId: string,
  changeDescription: string,
  projectTitle: string
): Promise<void> {
  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "project_update",
    title: "Actualización en tu libro",
    message: `${changeDescription} — "${projectTitle}"`,
  });
}

/** Notify client that a file has been shared with them. */
export async function notifyFileShared(
  projectId: string,
  clientId: string,
  fileName: string,
  projectTitle: string
): Promise<void> {
  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "file_shared",
    title: "Nuevo archivo disponible",
    message: `Se compartió "${fileName}" en tu proyecto "${projectTitle}".`,
  });
}

/** Notify client that the full editorial process is complete. */
export async function notifyProjectCompleted(
  projectId: string,
  clientId: string,
  projectTitle: string
): Promise<void> {
  await createNotification({
    projectId,
    recipientId: clientId,
    recipientType: "client",
    type: "project_completed",
    title: "¡Tu libro está listo!",
    message: `El proceso editorial de "${projectTitle}" ha sido completado. ¡Tu libro está listo para publicar!`,
  });
}

/** Notify staff member that a client left a comment. */
export async function notifyClientComment(
  projectId: string,
  staffId: string,
  clientName: string,
  commentPreview: string,
  stageKey?: EditorialAnyStageKey | null
): Promise<void> {
  const preview =
    commentPreview.length > 120
      ? commentPreview.slice(0, 120) + "…"
      : commentPreview;

  await createNotification({
    projectId,
    recipientId: staffId,
    recipientType: "staff",
    type: "comment_client",
    title: `Comentario de ${clientName}`,
    message: preview,
    stageKey: stageKey ?? null,
    metadata: { clientName },
  });
}
