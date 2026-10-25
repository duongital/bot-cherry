import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
  },
});
