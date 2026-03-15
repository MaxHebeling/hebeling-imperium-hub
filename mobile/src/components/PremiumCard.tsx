import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius, Spacing } from "../theme";

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function PremiumCard({ children, style, elevated }: PremiumCardProps) {
  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  elevated: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
