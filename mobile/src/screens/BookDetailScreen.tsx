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
import { PremiumCard } from "../components/PremiumCard";
import { ProgressBar } from "../components/ProgressBar";
import { fetchProjectProgress } from "../lib/api";
import type { ProjectProgressData, EditorialProject } from "../lib/api";
import {
  getClientVisibleProgress,
  getCurrentDay,
  STAGE_CLIENT_LABELS,
} from "../lib/client-delays";
import type { EditorialStageKey } from "../lib/client-delays";
import { formatDate } from "../lib/formatters";

interface BookDetailScreenProps {
  projectId: string;
  onBack: () => void;
  onNavigateToProgress: (projectId: string) => void;
  onNavigateToFiles: (projectId: string) => void;
  onNavigateToUpdates: (projectId: string) => void;
}

export function BookDetailScreen({
  projectId,
  onBack,
  onNavigateToProgress,
  onNavigateToFiles,
  onNavigateToUpdates,
}: BookDetailScreenProps) {
  const [data, setData] = useState<ProjectProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchProjectProgress(projectId);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error ?? "Error al cargar el proyecto");
      }
    } catch {
      setError("Error de conexión. Verifica tu red.");
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
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={40} color={Colors.error} />
        <Text style={styles.errorText}>{error ?? "Proyecto no encontrado"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { project, files, exports: projectExports } = data;
  const stageKey = project.current_stage as EditorialStageKey;
  const stageLabel = STAGE_CLIENT_LABELS[stageKey] ?? project.current_stage;
  const progress = getClientVisibleProgress(project.created_at, stageKey);
  const currentDay = getCurrentDay(project.created_at);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        <Text style={styles.backText}>Mis libros</Text>
      </TouchableOpacity>

      {/* Book Header */}
      <View style={styles.headerCard}>
        <View style={styles.bookIconLarge}>
          <Ionicons name="book" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.bookTitle}>{project.title}</Text>
        {project.subtitle && (
          <Text style={styles.bookSubtitle}>{project.subtitle}</Text>
        )}
        {project.author_name && (
          <Text style={styles.bookAuthor}>por {project.author_name}</Text>
        )}
      </View>

      {/* Status Card */}
      <PremiumCard style={styles.statusCard} elevated>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Estado actual</Text>
            <View style={styles.stageBadge}>
              <Text style={styles.stageBadgeText}>{stageLabel}</Text>
            </View>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Día del proceso</Text>
            <Text style={styles.dayText}>
              <Text style={styles.dayNumber}>{currentDay}</Text> de 12
            </Text>
          </View>
        </View>
      </PremiumCard>

      {/* Progress Card */}
      <PremiumCard style={styles.progressCard}>
        <ProgressBar progress={progress} />
        {project.due_date && (
          <View style={styles.deliveryRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.deliveryText}>
              Entrega estimada: <Text style={styles.deliveryDate}>{formatDate(project.due_date)}</Text>
            </Text>
          </View>
        )}
      </PremiumCard>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToProgress(projectId)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: Colors.primaryFaded }]}>
            <Ionicons name="git-branch-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Proceso Editorial</Text>
          <Text style={styles.actionSubtitle}>Ver cada etapa del proceso</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.actionChevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToFiles(projectId)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#f0fdf4" }]}>
            <Ionicons name="folder-outline" size={22} color={Colors.success} />
          </View>
          <Text style={styles.actionTitle}>Mis Archivos</Text>
          <Text style={styles.actionSubtitle}>
            {files.length + projectExports.length} documentos
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.actionChevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToUpdates(projectId)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: "#eff6ff" }]}>
            <Ionicons name="notifications-outline" size={22} color={Colors.info} />
          </View>
          <Text style={styles.actionTitle}>Actualizaciones</Text>
          <Text style={styles.actionSubtitle}>Avances de tu libro</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.actionChevron} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Reino Editorial
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retryText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  headerCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  bookIconLarge: {
    width: 56,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  bookTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  bookSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  bookAuthor: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  statusCard: {
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  stageBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stageBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  dayText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  dayNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  progressCard: {
    marginBottom: Spacing.xl,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deliveryText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  deliveryDate: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    position: "absolute",
    left: 76,
    bottom: 14,
  },
  actionChevron: {
    marginLeft: "auto",
  },
  footer: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xxxl,
  },
});
