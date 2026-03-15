import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { timeAgo } from "../lib/formatters";

interface UpdateItemProps {
  title: string;
  message: string;
  date: string;
  type?: string;
  isRead?: boolean;
}

const TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  welcome: { name: "sparkles", color: "#eab308" },
  stage_started: { name: "arrow-forward-circle", color: "#3b82f6" },
  stage_completed: { name: "checkmark-circle", color: "#059669" },
  comment_staff: { name: "chatbubble", color: "#8b5cf6" },
  project_update: { name: "book", color: "#06b6d4" },
  file_shared: { name: "document-text", color: "#14b8a6" },
  project_completed: { name: "trophy", color: "#059669" },
};

export function UpdateItem({ title, message, date, type = "project_update", isRead = true }: UpdateItemProps) {
  const iconConfig = TYPE_ICONS[type] ?? TYPE_ICONS.project_update;

  return (
    <View style={[styles.container, !isRead && styles.unread]}>
      <View style={[styles.iconCircle, { backgroundColor: iconConfig.color + "15" }]}>
        <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.time}>{timeAgo(date)}</Text>
      </View>

      {!isRead && <View style={styles.unreadDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  unread: {
    backgroundColor: Colors.primaryFaded,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  titleUnread: {
    fontWeight: FontWeight.semibold,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
