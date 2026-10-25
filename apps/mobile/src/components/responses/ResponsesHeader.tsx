import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { PasteDraft, Tag } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";
import { PasteButton } from "./PasteButton";
import { TagFilterBar } from "./TagFilterBar";

export function ResponsesHeader({
  itemCount,
  hasMore,
  search,
  activeTag,
  tags,
  loading,
  onSearchChange,
  onTagChange,
  onOpenAccount,
  onPasteReady,
  onPasteError,
}: {
  itemCount: number;
  hasMore: boolean;
  search: string;
  activeTag: string;
  tags: Tag[];
  loading: boolean;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onOpenAccount: () => void;
  onPasteReady: (draft: PasteDraft) => void;
  onPasteError: (message: string) => void;
}) {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
          gap: spacing.md,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brand}>
          <Text style={styles.cherry} aria-hidden>
            🍒
          </Text>
          <Text style={[styles.brandName, { color: colors.text }]}>
            bot-cherry
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Open account menu"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onOpenAccount}
          style={({ pressed }) => [
            styles.accountButton,
            {
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text style={{ color: colors.textMuted, fontSize: 16 }}>☰</Text>
        </Pressable>
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          Responses Saved
        </Text>
        <View
          style={[
            styles.count,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            {itemCount}
            {hasMore ? "+" : ""}
          </Text>
        </View>
        {loading && itemCount > 0 ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : null}
      </View>

      <PasteButton
        fullWidth
        onDraft={onPasteReady}
        onError={onPasteError}
      />

      <View
        style={[
          styles.search,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        <Text style={{ color: colors.textMuted, fontSize: 15 }}>⌕</Text>
        <TextInput
          accessibilityLabel="Search saved responses"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={onSearchChange}
          placeholder="Search saved responses…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          selectionColor={colors.primary}
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
        />
        {search.length > 0 ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => onSearchChange("")}
          >
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <TagFilterBar
        tags={tags}
        activeTag={activeTag}
        onChange={onTagChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  cherry: {
    fontSize: 20,
  },
  brandName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  accountButton: {
    alignItems: "center",
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 44,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  count: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  search: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingVertical: 0,
  },
});
