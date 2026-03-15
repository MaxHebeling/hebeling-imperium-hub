import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from "../theme";
import { BookCard } from "../components/BookCard";
import { useAuth } from "../hooks/useAuth";
import { fetchProjects } from "../lib/api";
import type { EditorialProject } from "../lib/api";

interface WelcomeScreenProps {
  onProjectPress: (projectId: string) => void;
}

export function WelcomeScreen({ onProjectPress }: WelcomeScreenProps) {
  const { displayName } = useAuth();
  const [projects, setProjects] = useState<EditorialProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchProjects();
      if (result.success && result.data) {
        setProjects(result.data.projects);
      } else {
        setError(result.error ?? "Error al cargar tus proyectos");
      }
    } catch {
      setError("Error de conexión. Verifica tu red e intenta de nuevo.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadProjects().finally(() => setLoading(false));
  }, [loadProjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="sparkles" size={24} color={Colors.gold} />
        </View>
        <Text style={styles.greeting}>Bienvenido, {displayName}</Text>
        <Text style={styles.welcomeMessage}>
          Aquí puedes seguir el progreso editorial de tu libro.
        </Text>
      </View>

      {/* Projects Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Libros</Text>
        <Text style={styles.sectionSubtitle}>
          Proyectos editoriales asociados a tu cuenta
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={32} color={Colors.primaryLight} />
            </View>
            <Text style={styles.emptyTitle}>Sin proyectos aún</Text>
            <Text style={styles.emptySubtitle}>
              Tu equipo editorial aún no ha vinculado ningún libro a tu cuenta.
            </Text>
          </View>
        ) : (
          <View style={styles.projectsList}>
            {projects.map((project) => (
              <BookCard
                key={project.id}
                project={project}
                onPress={() => onProjectPress(project.id)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Contact footer */}
      <Text style={styles.footer}>
        ¿No ves tu libro? Contáctanos en info@editorialreino.com
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.massive,
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: Spacing.xxl,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  welcomeMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  projectsList: {
    gap: Spacing.md,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.massive,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
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
  },
  footer: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xl,
  },
});
