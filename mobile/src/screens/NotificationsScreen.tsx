import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { UpdateItem } from "../components/UpdateItem";
import { fetchNotifications, markNotificationsRead } from "../lib/api";
import type { EditorialNotification } from "../lib/api";

interface NotificationsScreenProps {
  onNotificationPress?: (notification: EditorialNotification) => void;
}

export function NotificationsScreen({ onNotificationPress }: NotificationsScreenProps) {
  const [notifications, setNotifications] = useState<EditorialNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchNotifications(50);
      if (result.success && result.data) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkAllRead = async () => {
    await markNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Notificaciones</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadLabel}>{unreadCount} sin leer</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Marcar todo como leído</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={32} color={Colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptySubtitle}>
            Las notificaciones de tu proceso editorial aparecerán aquí.
          </Text>
        </View>
      ) : (
        <View style={styles.notificationsList}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => onNotificationPress?.(notification)}
              activeOpacity={0.7}
            >
              <UpdateItem
                title={notification.title}
                message={notification.message}
                date={notification.created_at}
                type={notification.type}
                isRead={notification.is_read}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Push notification info */}
      <View style={styles.pushInfoCard}>
        <Ionicons name="phone-portrait-outline" size={18} color={Colors.primary} />
        <View style={styles.pushInfoContent}>
          <Text style={styles.pushInfoTitle}>Notificaciones push</Text>
          <Text style={styles.pushInfoText}>
            Activa las notificaciones para recibir avisos al instante cuando tu libro avance
            a una nueva etapa o cuando haya archivos disponibles.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.massive,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  unreadLabel: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  markAllButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  markAllText: {
    fontSize: FontSize.sm,
    color: Colors.primaryLight,
    fontWeight: FontWeight.medium,
  },
  notificationsList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.massive,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  pushInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  pushInfoContent: {
    flex: 1,
  },
  pushInfoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 4,
  },
  pushInfoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
