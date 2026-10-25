import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type Ref,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
} from "@/lib/markdown";
import type { Tag } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

export interface TagInputHandle {
  commit: () => string[];
}

interface TagInputProps {
  value: string[];
  suggestions: Tag[];
  onChange: (tags: string[]) => void;
}

function normalizeTag(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function TagInputInner(
  { value, suggestions, onChange }: TagInputProps,
  ref: Ref<TagInputHandle>,
) {
  const { colors, radius, spacing } = useTheme();
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = normalizeTag(raw);
    setDraft("");
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (value.includes(tag) || value.length >= MAX_TAGS) return;
    onChange([...value, tag]);
  }

  function commit(): string[] {
    const tag = normalizeTag(draft);
    if (!tag) return value;
    if (
      tag.length > MAX_TAG_LENGTH ||
      value.includes(tag) ||
      value.length >= MAX_TAGS
    ) {
      setDraft("");
      return value;
    }
    const next = [...value, tag];
    setDraft("");
    onChange(next);
    return next;
  }

  useImperativeHandle(ref, () => ({ commit }), [draft, value, onChange]);

  const availableSuggestions = useMemo(
    () =>
      suggestions.filter(
        (tag) => !value.includes(tag.name) && tag.name.length <= MAX_TAG_LENGTH,
      ),
    [suggestions, value],
  );

  return (
    <View style={{ gap: spacing.sm }}>
      {value.length > 0 ? (
        <View style={styles.chips}>
          {value.map((tag) => (
            <View
              key={tag}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.primaryMuted,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>
                #{tag}
              </Text>
              <Pressable
                accessibilityLabel={`Remove tag ${tag}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onChange(value.filter((item) => item !== tag))}
              >
                <Text style={[styles.remove, { color: colors.primary }]}>
                  ×
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <TextInput
        accessibilityLabel="Add a tag"
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        onSubmitEditing={() => addTag(draft)}
        onChangeText={(text) => {
          if (text.includes(",")) {
            const [first, ...rest] = text.split(",");
            addTag(first ?? "");
            setDraft(rest.join(","));
          } else {
            setDraft(text);
          }
        }}
        onBlur={() => {
          if (draft.trim()) addTag(draft);
        }}
        onKeyPress={(event) => {
          if (
            event.nativeEvent.key === "Backspace" &&
            draft.length === 0 &&
            value.length > 0
          ) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={
          value.length >= MAX_TAGS
            ? `Maximum ${MAX_TAGS} tags`
            : "Type a tag, then press Enter"
        }
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        selectionColor={colors.primary}
        editable={value.length < MAX_TAGS}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            color: colors.text,
            paddingHorizontal: spacing.md,
          },
        ]}
        value={draft}
      />

      {availableSuggestions.length > 0 ? (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {availableSuggestions.map((tag) => (
            <Pressable
              key={tag.id}
              accessibilityLabel={`Add tag ${tag.name}`}
              accessibilityRole="button"
              onPress={() => addTag(tag.name)}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.textMuted }]}>
                #{tag.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

export const TagInput = forwardRef<TagInputHandle, TagInputProps>(TagInputInner);

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  remove: {
    fontSize: 16,
    lineHeight: 17,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
    minHeight: 44,
  },
});
