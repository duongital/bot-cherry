import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary";
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            tone === "primary" ? colors.primaryMuted : colors.surfaceMuted,
          borderRadius: radius.pill,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: tone === "primary" ? colors.primary : colors.textMuted },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
