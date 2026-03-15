import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { formatDateShort, formatBytes, fileTypeLabel } from "../lib/formatters";
import type { EditorialFile, EditorialExport } from "../lib/api";

interface FileCardProps {
  file?: EditorialFile;
  exportFile?: EditorialExport;
  onDownload?: () => void;
}

export function FileCard({ file, exportFile, onDownload }: FileCardProps) {
  const isExport = !!exportFile;
  const label = isExport
    ? exportFile!.export_type.toUpperCase()
    : fileTypeLabel(file!.file_type);
  const date = isExport ? exportFile!.created_at : file!.created_at;
  const version = isExport ? exportFile!.version : file!.version;
  const size = !isExport && file?.size_bytes ? formatBytes(file.size_bytes) : null;

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isExport) return "document-text";
    const ft = file?.file_type ?? "";
    if (ft.includes("cover") || ft.includes("portada")) return "image";
    if (ft.includes("epub") || ft.includes("mobi")) return "tablet-portrait";
    if (ft.includes("pdf")) return "document";
    return "document-text";
  };

  return (
    <TouchableOpacity onPress={onDownload} activeOpacity={0.7} disabled={!onDownload}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIcon()} size={22} color={Colors.primary} />
        </View>

        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <Text style={styles.meta}>
            v{version} {size ? `· ${size} ` : ""}· {formatDateShort(date)}
          </Text>
        </View>

        {onDownload ? (
          <View style={styles.downloadButton}>
            <Ionicons name="download-outline" size={18} color={Colors.primary} />
          </View>
        ) : isExport ? (
          <View style={styles.readyBadge}>
            <Text style={styles.readyText}>Listo</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryFaded,
    alignItems: "center",
    justifyContent: "center",
  },
  readyBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  readyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.success,
  },
});
