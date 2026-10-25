import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThemeMode } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AccountMenu({
  visible,
  userName,
  userEmail,
  signingOut,
  onClose,
  onSignOut,
}: {
  visible: boolean;
  userName: string;
  userEmail: string;
  signingOut: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { colors, mode, setMode, radius, spacing } = useTheme();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close account menu"
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <SafeAreaView
          edges={["bottom"]}
          style={[styles.safeArea, { backgroundColor: colors.surface }]}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.name, { color: colors.text }]}>
              {userName || "Account"}
            </Text>
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {userEmail}
            </Text>

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textMuted, marginTop: spacing.xl },
              ]}
            >
              APPEARANCE
            </Text>
            <View style={[styles.themeRow, { marginTop: spacing.sm }]}>
              {THEME_OPTIONS.map((option) => {
                const selected = mode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setMode(option.value)}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: selected
                          ? colors.primaryMuted
                          : colors.surfaceMuted,
                        borderColor: selected ? colors.primary : colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? colors.primary : colors.text,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={signingOut}
              onPress={onSignOut}
              style={({ pressed }) => [
                styles.signOut,
                {
                  backgroundColor: pressed
                    ? colors.errorSurface
                    : "transparent",
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  marginTop: spacing.xl,
                  opacity: signingOut ? 0.5 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.error, fontSize: 15, fontWeight: "600" }}>
                {signingOut ? "Signing out…" : "Sign out"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.cancel, { marginTop: spacing.sm }]}
            >
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  safeArea: {
    width: "100%",
  },
  sheet: {
    borderTopWidth: 1,
  },
  handle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  signOut: {
    alignItems: "center",
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  cancel: {
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center",
  },
});
