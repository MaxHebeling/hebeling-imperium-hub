import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import type { ClientStageVisibility } from "../lib/client-delays";

interface StageTimelineItemProps {
  stage: ClientStageVisibility;
  isLast: boolean;
  onPress: () => void;
}

export function StageTimelineItem({ stage, isLast, onPress }: StageTimelineItemProps) {
  const getStatusIcon = () => {
    if (stage.isCompleted) return "checkmark-circle";
    if (stage.isActive) return "ellipse";
    return "ellipse-outline";
  };

  const getStatusColor = () => {
    if (stage.isCompleted) return Colors.stageCompleted;
    if (stage.isActive) return Colors.stageActive;
    return Colors.stagePending;
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={!stage.isRevealed}>
      <View style={styles.container}>
        {/* Timeline line + dot */}
        <View style={styles.timelineColumn}>
          <View style={[styles.dot, { backgroundColor: statusColor }]}>
            <Ionicons
              name={getStatusIcon()}
              size={stage.isCompleted ? 20 : 14}
              color={stage.isCompleted || stage.isActive ? "#fff" : Colors.textMuted}
            />
          </View>
          {!isLast && (
            <View
              style={[
                styles.line,
                { backgroundColor: stage.isCompleted ? Colors.stageCompleted : Colors.borderLight },
              ]}
            />
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, !stage.isRevealed && styles.contentHidden]}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.label,
                stage.isActive && styles.labelActive,
                stage.isCompleted && styles.labelCompleted,
                !stage.isRevealed && styles.labelHidden,
              ]}
            >
              {stage.label}
            </Text>
            <Text style={styles.dayBadge}>Día {stage.revealDay}</Text>
          </View>

          {stage.message ? (
            <Text style={styles.message}>{stage.message}</Text>
          ) : !stage.isRevealed ? (
            <Text style={styles.pendingText}>Pendiente</Text>
          ) : null}

          {stage.isActive && (
            <View style={styles.activeIndicator}>
              <View style={styles.activePulse} />
              <Text style={styles.activeText}>En proceso</Text>
            </View>
          )}
        </View>

        {stage.isRevealed && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: Spacing.lg,
  },
  timelineColumn: {
    alignItems: "center",
    width: 40,
    paddingTop: 2,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 32,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.xl,
    paddingLeft: Spacing.sm,
  },
  contentHidden: {
    opacity: 0.4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  labelCompleted: {
    color: Colors.stageCompleted,
    fontWeight: FontWeight.medium,
  },
  labelHidden: {
    color: Colors.textMuted,
  },
  dayBadge: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  pendingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  activePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  activeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  chevron: {
    marginTop: 6,
  },
});
