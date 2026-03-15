import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, FontWeight } from "../theme";
import { useAuth } from "../hooks/useAuth";

// Screens
import { LoginScreen } from "../screens/LoginScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { BookDetailScreen } from "../screens/BookDetailScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { StageDetailScreen } from "../screens/StageDetailScreen";
import { FilesScreen } from "../screens/FilesScreen";
import { UpdatesScreen } from "../screens/UpdatesScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import type { ClientStageVisibility } from "../lib/client-delays";
import type { EditorialNotification } from "../lib/api";

// ─── Type Definitions ────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  BookDetail: { projectId: string };
  Progress: { projectId: string };
  StageDetail: { stage: ClientStageVisibility };
  Files: { projectId: string };
  Updates: { projectId: string };
};

export type TabParamList = {
  Home: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Tab Navigator ───────────────────────────────────────────────────

function HomeTabContent({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  return (
    <WelcomeScreen
      onProjectPress={(projectId) =>
        navigation.navigate("BookDetail", { projectId })
      }
    />
  );
}

function NotificationsTabContent() {
  return (
    <NotificationsScreen
      onNotificationPress={(notification: EditorialNotification) => {
        // Deep link to project if project_id is present
        // Navigation handled at tab level
        void notification;
      }}
    />
  );
}

function ProfileTabContent() {
  const { displayName, signOut, profile } = useAuth();

  return (
    <React.Fragment>
      {/* Inline profile screen */}
      <ProfileScreen
        displayName={displayName}
        email={profile?.email ?? ""}
        onSignOut={signOut}
      />
    </React.Fragment>
  );
}

function MainTabs({ navigation }: { navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void } }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: "Mis Libros",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      >
        {() => <HomeTabContent navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen
        name="Notifications"
        component={NotificationsTabContent}
        options={{
          tabBarLabel: "Notificaciones",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabContent}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Inline Profile Screen ───────────────────────────────────────────

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Spacing, BorderRadius } from "../theme";

function ProfileScreen({
  displayName,
  email,
  onSignOut,
}: {
  displayName: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <ScrollView style={profileStyles.container} contentContainerStyle={profileStyles.content}>
      <View style={profileStyles.avatarCircle}>
        <Text style={profileStyles.avatarText}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={profileStyles.name}>{displayName}</Text>
      <Text style={profileStyles.email}>{email}</Text>

      <View style={profileStyles.section}>
        <Text style={profileStyles.sectionTitle}>Mi cuenta</Text>

        <View style={profileStyles.menuCard}>
          <TouchableOpacity style={profileStyles.menuItem}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <Text style={profileStyles.menuLabel}>Datos personales</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={profileStyles.menuDivider} />

          <TouchableOpacity style={profileStyles.menuItem}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
            <Text style={profileStyles.menuLabel}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={profileStyles.menuDivider} />

          <TouchableOpacity style={profileStyles.menuItem}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
            <Text style={profileStyles.menuLabel}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={profileStyles.section}>
        <Text style={profileStyles.sectionTitle}>Soporte</Text>

        <View style={profileStyles.menuCard}>
          <TouchableOpacity style={profileStyles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={profileStyles.menuLabel}>Centro de ayuda</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={profileStyles.menuDivider} />

          <TouchableOpacity style={profileStyles.menuItem}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
            <Text style={profileStyles.menuLabel}>Contactar editorial</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={profileStyles.signOutButton} onPress={onSignOut}>
        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
        <Text style={profileStyles.signOutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={profileStyles.version}>
        Reino Editorial v1.0.0{"\n"}© {new Date().getFullYear()} Todos los derechos reservados
      </Text>
    </ScrollView>
  );
}

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.massive,
    alignItems: "center",
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryFaded,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 4,
    marginBottom: Spacing.xxl,
  },
  section: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.huge,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorLight,
    marginTop: Spacing.md,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.error,
  },
  version: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xxl,
    lineHeight: 18,
  },
});

// ─── Root Navigator ──────────────────────────────────────────────────

export function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedStage, setSelectedStage] = useState<ClientStageVisibility | null>(null);

  if (loading) {
    return null; // Splash screen handles this
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="BookDetail">
              {({ route, navigation }) => (
                <BookDetailScreen
                  projectId={(route.params as { projectId: string }).projectId}
                  onBack={() => navigation.goBack()}
                  onNavigateToProgress={(pid) => navigation.navigate("Progress", { projectId: pid })}
                  onNavigateToFiles={(pid) => navigation.navigate("Files", { projectId: pid })}
                  onNavigateToUpdates={(pid) => navigation.navigate("Updates", { projectId: pid })}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Progress">
              {({ route, navigation }) => (
                <ProgressScreen
                  projectId={(route.params as { projectId: string }).projectId}
                  onBack={() => navigation.goBack()}
                  onStagePress={(stage) => {
                    setSelectedStage(stage);
                    navigation.navigate("StageDetail", { stage });
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="StageDetail">
              {({ navigation }) => (
                <StageDetailScreen
                  stage={selectedStage!}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Files">
              {({ route, navigation }) => (
                <FilesScreen
                  projectId={(route.params as { projectId: string }).projectId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Updates">
              {({ route, navigation }) => (
                <UpdatesScreen
                  projectId={(route.params as { projectId: string }).projectId}
                  onBack={() => navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
