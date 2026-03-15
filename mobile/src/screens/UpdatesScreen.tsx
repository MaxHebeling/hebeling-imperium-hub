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
import { fetchNotifications } from "../lib/api";
import type { EditorialNotification } from "../lib/api";

interface UpdatesScreenProps {
  projectId: string;
  onBack: () => void;
}

export function UpdatesScreen({ projectId, onBack }: UpdatesScreenProps) {
  const [updates, setUpdates] = useState<EditorialNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchNotifications(50);
      if (result.success && result.data) {
        // Filter notifications for this project
        const projectUpdates = result.data.notifications.filter(
          (n) => n.project_id === projectId || !n.project_id
        );
        setUpdates(projectUpdates);
      }
    } catch {
      // silent
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Actualizaciones de tu libro</Text>
      <Text style={styles.screenSubtitle}>
        Mensajes y avances de tu proceso editorial
      </Text>

      {updates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={32} color={Colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Sin actualizaciones aún</Text>
          <Text style={styles.emptySubtitle}>
            Las novedades de tu libro aparecerán aquí conforme avance el proceso editorial.
          </Text>
        </View>
      ) : (
        <View style={styles.updatesList}>
          {updates.map((update) => (
            <UpdateItem
              key={update.id}
              title={update.title}
              message={update.message}
              date={update.created_at}
              type={update.type}
              isRead={update.is_read}
            />
          ))}
        </View>
      )}
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.lg,
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  updatesList: {
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
});
