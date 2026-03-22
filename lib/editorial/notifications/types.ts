import type { EditorialAnyStageKey } from "../types/editorial";

/** All notification event types. */
export type NotificationType =
  | "welcome"
  | "stage_started"
  | "stage_completed"
  | "comment_staff"
  | "comment_client"
  | "suggestion"
  | "project_update"
  | "file_shared"
  | "project_completed"
  | "birthday";

/** A single notification record. */
export interface EditorialNotification {
  id: string;
  project_id: string;
  recipient_id: string;
  recipient_type: "client" | "staff";
  type: NotificationType;
  title: string;
  message: string;
  stage_key: EditorialAnyStageKey | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

/** Payload for creating a notification. */
export interface CreateNotificationPayload {
  projectId: string;
  recipientId: string;
  recipientType: "client" | "staff";
  type: NotificationType;
  title: string;
  message: string;
  stageKey?: EditorialAnyStageKey | null;
  metadata?: Record<string, unknown> | null;
}
