import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { STAGE_CLIENT_LABELS, getClientVisibleProgress, getCurrentDay } from "../lib/client-delays";
import type { EditorialStageKey } from "../lib/client-delays";
import type { EditorialProject } from "../lib/api";

interface BookCardProps {
  project: EditorialProject;
  onPress: () => void;
}

export function BookCard({ project, onPress }: BookCardProps) {
  const stageKey = project.current_stage as EditorialStageKey;
  const stageLabel = STAGE_CLIENT_LABELS[stageKey] ?? project.current_stage;
  const progress = getClientVisibleProgress(project.created_at, stageKey);
  const currentDay = getCurrentDay(project.created_at);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.card}>
        {/* Book icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="book-outline" size={24} color={Colors.primary} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <Text style={styles.title} numberOfLines={2}>{project.title}</Text>
              {project.author_name && (
                <Text style={styles.author}>{project.author_name}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>

          {/* Stage badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stageLabel}</Text>
            </View>
            <Text style={styles.dayLabel}>Día {currentDay} de 12</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  author: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
  dayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    width: 32,
    textAlign: "right",
  },
});
