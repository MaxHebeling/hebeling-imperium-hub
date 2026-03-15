import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: number;
}

export function ProgressBar({ progress, showLabel = true, height = 8 }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>Progreso general</Text>
          <Text style={styles.value}>{clampedProgress}%</Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  track: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});
