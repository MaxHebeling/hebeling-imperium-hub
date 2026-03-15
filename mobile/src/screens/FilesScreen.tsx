import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { FileCard } from "../components/FileCard";
import { fetchProjectProgress } from "../lib/api";
import type { EditorialFile, EditorialExport } from "../lib/api";

interface FilesScreenProps {
  projectId: string;
  onBack: () => void;
}

export function FilesScreen({ projectId, onBack }: FilesScreenProps) {
  const [files, setFiles] = useState<EditorialFile[]>([]);
  const [exports, setExports] = useState<EditorialExport[]>([]);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchProjectProgress(projectId);
      if (result.success && result.data) {
        setFiles(result.data.files ?? []);
        setExports(result.data.exports ?? []);
        setBookTitle(result.data.project.title);
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

  const handleDownload = (fileId: string, label: string) => {
    Alert.alert(
      "Descargar archivo",
      `¿Deseas descargar "${label}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descargar",
          onPress: () => {
            // TODO: Implement actual file download via Expo FileSystem + Sharing
            Alert.alert("Descarga", "La descarga iniciará en breve. Revisa tu carpeta de descargas.");
          },
        },
      ]
    );
  };

  const totalFiles = files.length + exports.length;

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

      <Text style={styles.screenTitle}>Mis Archivos</Text>
      <Text style={styles.screenSubtitle}>
        Documentos y entregables de tu libro ({totalFiles})
      </Text>

      {totalFiles === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="folder-open-outline" size={32} color={Colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>Sin archivos disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Los documentos de tu libro aparecerán aquí conforme el equipo editorial avance en el proceso.
          </Text>
        </View>
      ) : (
        <>
          {/* Project Files */}
          {files.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documentos del proyecto</Text>
              <View style={styles.filesList}>
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={() => handleDownload(file.id, file.file_type)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Export Files */}
          {exports.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entregables finales</Text>
              <View style={styles.filesList}>
                {exports.map((exp) => (
                  <FileCard
                    key={exp.id}
                    exportFile={exp}
                    onDownload={() => handleDownload(exp.id, exp.export_type)}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.primaryLight} />
        <Text style={styles.infoText}>
          Todos tus archivos están protegidos y almacenados de forma segura en nuestra plataforma editorial.
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.massive,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
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
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  filesList: {
    gap: Spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.primaryFaded,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
