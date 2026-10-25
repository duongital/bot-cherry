import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <Text style={styles.icon} aria-hidden>
        {icon}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
  action,
}: {
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <Text style={styles.icon} aria-hidden>
        ⚠️
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>
      <View
        style={[
          styles.errorBox,
          {
            backgroundColor: colors.errorSurface,
            borderColor: colors.error,
            borderRadius: radius.md,
            marginTop: spacing.lg,
          },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.error }]}>
          {message}
        </Text>
      </View>
      {onRetry ? (
        <Text
          accessibilityRole="button"
          onPress={onRetry}
          style={[styles.retry, { color: colors.primary }]}
        >
          Try again
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  action: {
    marginTop: 18,
    alignSelf: "stretch",
    maxWidth: 320,
  },
  errorBox: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
    maxWidth: 360,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retry: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "600",
  },
});
