import "react-native-gesture-handler";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ShareIntentProvider } from "expo-share-intent";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { APP_SCHEME } from "@/lib/env";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ShareCaptureProvider } from "@/providers/ShareCaptureProvider";
import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

// Share intents need the custom native module and therefore a development or
// production build. Keep Expo Go usable by disabling the module there.
const isExpoGo = Constants.appOwnership === "expo";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden during fast refresh.
});

function RootNavigator() {
  const { isPending } = useAuth();
  const { colors, resolvedMode } = useTheme();

  useEffect(() => {
    if (!isPending) {
      void SplashScreen.hideAsync().catch(() => {
        // Ignore double-hide during fast refresh.
      });
    }
  }, [isPending]);

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ShareIntentProvider
        options={{
          scheme: APP_SCHEME,
          debug: __DEV__,
          resetOnBackground: false,
          disabled: isExpoGo,
        }}
      >
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <ShareCaptureProvider>
                <AuthProvider>
                  <RootNavigator />
                </AuthProvider>
              </ShareCaptureProvider>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
