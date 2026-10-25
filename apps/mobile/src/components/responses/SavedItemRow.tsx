import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatSavedDate } from "@/lib/date";
import type { SavedItemSummary } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

function SavedItemRowInner({
  item,
  active,
  onPress,
}: {
  item: SavedItemSummary;
  active: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      accessibilityLabel={`${item.title}, saved ${formatSavedDate(item.createdAt)}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: active
            ? colors.primaryMuted
            : pressed
              ? colors.surfaceMuted
              : "transparent",
          borderLeftColor: active ? colors.primary : "transparent",
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <Text
        numberOfLines={2}
        style={[styles.title, { color: colors.text }]}
      >
        {item.title}
      </Text>
      <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
        {item.tags.length > 0 ? (
          <Text
            numberOfLines={1}
            style={[styles.meta, { color: colors.primary }]}
          >
            {item.tags.map((tag) => `#${tag}`).join(" ")}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {item.tags.length > 0 ? " · " : ""}
          saved {formatSavedDate(item.createdAt)} ·{" "}
          {item.contentFormat === "markdown" ? "Markdown" : "Plain text"}
        </Text>
      </View>
    </Pressable>
  );
}

export const SavedItemRow = memo(SavedItemRowInner);

const styles = StyleSheet.create({
  row: {
    borderLeftWidth: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  meta: {
    fontSize: 11,
    lineHeight: 16,
  },
});
