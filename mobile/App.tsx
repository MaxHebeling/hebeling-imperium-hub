import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { setupAndroidChannel, registerForPushNotifications } from "./src/lib/notifications";

/**
 * Reino Editorial — App Móvil Oficial
 *
 * Aplicación para autores de Reino Editorial.
 * Permite seguir el progreso editorial de su libro,
 * descargar documentos, ver actualizaciones y recibir notificaciones.
 *
 * Arquitectura:
 * - Expo / React Native (iOS + Android)
 * - Supabase Auth + Database (compartido con portal web)
 * - React Navigation (stack + tabs)
 * - Push notifications via Expo Notifications
 *
 * Idioma: Español (todo el UI visible)
 * Diseño: Premium editorial (inspirado en Apple, Stripe, Notion)
 */

export default function App() {
  useEffect(() => {
    // Setup push notifications
    setupAndroidChannel();
    registerForPushNotifications().then((token) => {
      if (token) {
        // TODO: Send token to backend for push notifications
        console.log("Push token registered:", token);
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
