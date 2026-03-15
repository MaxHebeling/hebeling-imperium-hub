import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Configuración de notificaciones push para Reino Editorial.
 * Se conecta al mismo backend de notificaciones del portal web.
 */

// Configurar comportamiento de notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos y obtiene el token de push.
 * El token se envía al backend para poder enviar notificaciones.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Get push token
  try {
    const projectId = Constants.expiConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Configura el canal de notificaciones para Android.
 */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("editorial-updates", {
      name: "Actualizaciones editoriales",
      description: "Notificaciones sobre el progreso de tu libro",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1a3a6b",
    });
  }
}

/**
 * Escucha notificaciones recibidas (en primer plano).
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Escucha cuando el usuario toca una notificación.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Tipos de notificaciones que la app puede recibir.
 */
export const NOTIFICATION_TYPES = {
  STAGE_ADVANCE: "stage_advance",
  FILE_READY: "file_ready",
  REVIEW_READY: "review_ready",
  COVER_READY: "cover_ready",
  PROJECT_COMPLETE: "project_complete",
  COMMENT_REPLY: "comment_reply",
} as const;

/**
 * Mensajes humanizados para cada tipo de notificación.
 */
export const NOTIFICATION_MESSAGES: Record<string, { title: string; body: string }> = {
  [NOTIFICATION_TYPES.STAGE_ADVANCE]: {
    title: "Tu libro avanzó a una nueva etapa",
    body: "El proceso editorial de tu libro sigue avanzando.",
  },
  [NOTIFICATION_TYPES.FILE_READY]: {
    title: "Nuevo archivo disponible",
    body: "Hay un nuevo documento listo para que lo revises.",
  },
  [NOTIFICATION_TYPES.REVIEW_READY]: {
    title: "Tu revisión está lista",
    body: "La revisión de tu libro está disponible para descarga.",
  },
  [NOTIFICATION_TYPES.COVER_READY]: {
    title: "Tu portada está disponible",
    body: "¡Las opciones de portada de tu libro están listas!",
  },
  [NOTIFICATION_TYPES.PROJECT_COMPLETE]: {
    title: "¡Tu libro está listo!",
    body: "¡Felicidades! Tu libro ha completado el proceso editorial.",
  },
  [NOTIFICATION_TYPES.COMMENT_REPLY]: {
    title: "Nuevo mensaje de tu editor",
    body: "Tu editor ha respondido a tu mensaje.",
  },
};
