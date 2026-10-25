import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface AppButtonProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function AppButton({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const { colors, radius } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.surfaceMuted
        : variant === "danger"
          ? colors.errorSurface
          : "transparent";
  const foreground =
    variant === "primary"
      ? colors.primaryText
      : variant === "danger"
        ? colors.error
        : colors.text;
  const borderColor =
    variant === "secondary" || variant === "ghost"
      ? colors.border
      : "transparent";

  const padding =
    size === "sm"
      ? { paddingVertical: 8, paddingHorizontal: 12 }
      : size === "lg"
        ? { paddingVertical: 15, paddingHorizontal: 20 }
        : { paddingVertical: 12, paddingHorizontal: 16 };
  const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        padding,
        {
          backgroundColor: background,
          borderColor,
          borderRadius: radius.md,
          opacity: isDisabled ? 0.55 : pressed ? 0.8 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            { color: foreground, fontSize },
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  label: {
    fontWeight: "600",
    textAlign: "center",
  },
});
