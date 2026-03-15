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
import { StageTimelineItem } from "../components/StageTimelineItem";
import { ProgressBar } from "../components/ProgressBar";
import { fetchProjectProgress } from "../lib/api";
import {
  getClientVisibleStages,
  getClientVisibleProgress,
  getCurrentDay,
} from "../lib/client-delays";
import type { EditorialStageKey, ClientStageVisibility } from "../lib/client-delays";

interface ProgressScreenProps {
  projectId: string;
  onBack: () => void;
  onStagePress: (stage: ClientStageVisibility) => void;
}

export function ProgressScreen({ projectId, onBack, onStagePress }: ProgressScreenProps) {
  const [stages, setStages] = useState<ClientStageVisibility[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchProjectProgress(projectId);
      if (result.success && result.data) {
        const project = result.data.project;
        const stageKey = project.current_stage as EditorialStageKey;
        setStages(getClientVisibleStages(project.created_at, stageKey));
        setProgress(getClientVisibleProgress(project.created_at, stageKey));
        setCurrentDay(getCurrentDay(project.created_at));
        setBookTitle(project.title);
      }
    } catch {
      // silently handle
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
        <Text style={styles.backText}>{bookTitle || "Volver"}</Text>
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Proceso Editorial</Text>
      <Text style={styles.screenSubtitle}>
        Seguimiento del proceso editorial de tu libro
      </Text>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{currentDay}</Text>
            <Text style={styles.summaryLabel}>Día actual</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>Días totales</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{stages.filter((s) => s.isCompleted).length}</Text>
            <Text style={styles.summaryLabel}>Completadas</Text>
          </View>
        </View>
        <View style={styles.progressBarWrapper}>
          <ProgressBar progress={progress} height={6} />
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timelineTitle}>Etapas del proceso</Text>
        <View style={styles.timelineList}>
          {stages.map((stage, index) => (
            <StageTimelineItem
              key={stage.stageKey}
              stage={stage}
              isLast={index === stages.length - 1}
              onPress={() => onStagePress(stage)}
            />
          ))}
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color={Colors.primaryLight} />
        <Text style={styles.infoText}>
          Tu equipo editorial trabaja en cada etapa para asegurar la más alta calidad en tu libro.
          Las etapas se van revelando conforme avanza el proceso.
        </Text>
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
    padding: Spacing.lg,
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
    marginBottom: Spacing.lg,
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
  },
  screenSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderLight,
  },
  progressBarWrapper: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timelineContainer: {
    marginBottom: Spacing.xxl,
  },
  timelineTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  timelineList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
