import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { Tag } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

export function TagFilterBar({
  tags,
  activeTag,
  onChange,
}: {
  tags: Tag[];
  activeTag: string;
  onChange: (value: string) => void;
}) {
  const { colors, radius, spacing } = useTheme();

  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { gap: spacing.sm }]}
    >
      {[{ id: "__all", name: "" }, ...tags].map((tag) => {
        const selected = activeTag === tag.name;
        return (
          <Pressable
            key={tag.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(tag.name)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected
                  ? colors.primary
                  : pressed
                    ? colors.surfaceMuted
                    : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? colors.primaryText : colors.textMuted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {tag.name ? `#${tag.name}` : "All tags"}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
  },
});
