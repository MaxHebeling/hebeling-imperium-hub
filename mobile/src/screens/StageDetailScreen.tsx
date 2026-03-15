import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import type { ClientStageVisibility } from "../lib/client-delays";

interface StageDetailScreenProps {
  stage: ClientStageVisibility;
  onBack: () => void;
}

export function StageDetailScreen({ stage, onBack }: StageDetailScreenProps) {
  const getStatusLabel = () => {
    if (stage.isCompleted) return "Completado";
    if (stage.isActive) return "En proceso";
    if (stage.isRevealed) return "Próximamente";
    return "Pendiente";
  };

  const getStatusColor = () => {
    if (stage.isCompleted) return Colors.stageCompleted;
    if (stage.isActive) return Colors.stageActive;
    return Colors.textMuted;
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (stage.isCompleted) return "checkmark-circle";
    if (stage.isActive) return "time-outline";
    return "ellipse-outline";
  };

  const statusColor = getStatusColor();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        <Text style={styles.backText}>Proceso Editorial</Text>
      </TouchableOpacity>

      {/* Stage Header */}
      <View style={styles.stageHeader}>
        <View style={[styles.stageIconCircle, { backgroundColor: statusColor + "20" }]}>
          <Ionicons name={getStatusIcon()} size={28} color={statusColor} />
        </View>
        <Text style={styles.stageTitle}>{stage.label}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "15", borderColor: statusColor + "30" }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {getStatusLabel()}
          </Text>
        </View>
        <Text style={styles.dayInfo}>Día {stage.revealDay} del proceso</Text>
      </View>

      {/* Description Card */}
      <View style={styles.descriptionCard}>
        <View style={styles.descriptionHeader}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.descriptionHeaderText}>¿Qué sucede en esta etapa?</Text>
        </View>
        <Text style={styles.descriptionText}>{stage.description}</Text>
      </View>

      {/* Status Message */}
      {stage.message ? (
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Ionicons name="chatbubble-ellipses" size={16} color={Colors.primaryLight} />
            <Text style={styles.messageHeaderText}>Estado actual</Text>
          </View>
          <Text style={styles.messageText}>{stage.message}</Text>
        </View>
      ) : null}

      {/* Progress Indicator */}
      {stage.isActive && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="sync" size={16} color={Colors.primary} />
            <Text style={styles.progressHeaderText}>Trabajo en curso</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${stage.dayProgress}%` }]} />
          </View>
          <Text style={styles.progressNote}>
            Tu equipo editorial está trabajando activamente en esta etapa.
          </Text>
        </View>
      )}

      {/* Editorial promise */}
      <View style={styles.promiseCard}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.gold} />
        <View style={styles.promiseContent}>
          <Text style={styles.promiseTitle}>Compromiso editorial</Text>
          <Text style={styles.promiseText}>
            Cada etapa de tu libro es supervisada por profesionales de la edición
            para garantizar una publicación de la más alta calidad.
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
    padding: Spacing.lg,
    paddingBottom: Spacing.massive,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  stageHeader: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  stageIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  stageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  statusBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  dayInfo: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  descriptionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  descriptionHeaderText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  descriptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  messageCard: {
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  messageHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressHeaderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  progressNote: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  promiseCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  promiseContent: {
    flex: 1,
  },
  promiseTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  promiseText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
