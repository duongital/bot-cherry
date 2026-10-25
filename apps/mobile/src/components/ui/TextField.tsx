import { forwardRef, useState, type ComponentRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(
  function TextField(
    { label, hint, error, containerStyle, style, onFocus, onBlur, ...props },
    ref,
  ) {
    const { colors, radius, spacing } = useTheme();
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          {...props}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: error
                ? colors.error
                : focused
                  ? colors.primary
                  : colors.border,
              borderRadius: radius.md,
              color: colors.text,
              paddingHorizontal: spacing.md,
              paddingVertical: props.multiline ? spacing.md : 11,
            },
            props.multiline ? styles.multiline : null,
            style,
          ]}
        />
        {error ? (
          <Text style={[styles.message, { color: colors.error }]}>
            {error}
          </Text>
        ) : hint ? (
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  message: {
    fontSize: 12,
    lineHeight: 17,
  },
});
