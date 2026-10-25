import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/AppButton";
import { TextField } from "@/components/ui/TextField";
import {
  detectFormat,
  suggestTitle,
  utf8ByteLength,
  MAX_CONTENT_BYTES,
  MAX_TITLE_LENGTH,
} from "@/lib/markdown";
import type { ContentFormat, CreateItemInput, PasteDraft, Tag } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";
import { TagInput, type TagInputHandle } from "./TagInput";

export function SaveItemModal({
  draft,
  suggestions,
  onClose,
  onSave,
}: {
  draft: PasteDraft;
  suggestions: Tag[];
  onClose: () => void;
  onSave: (input: CreateItemInput) => Promise<void>;
}) {
  const { colors, radius, spacing } = useTheme();
  const [content, setContent] = useState(draft.content);
  const [title, setTitle] = useState(draft.suggestedTitle);
  const [format, setFormat] = useState<ContentFormat>(draft.contentFormat);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<ComponentRef<typeof TextInput>>(null);
  const tagInputRef = useRef<TagInputHandle>(null);

  useEffect(() => {
    const timer = setTimeout(() => titleRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  async function pasteFromClipboard() {
    setError(null);
    try {
      const text = await Clipboard.getStringAsync();
      if (!text.trim()) {
        setError("Your clipboard is empty.");
        return;
      }
      if (utf8ByteLength(text) > MAX_CONTENT_BYTES) {
        setError("That clipboard content is larger than 256 KiB.");
        return;
      }
      setContent(text);
      setFormat(detectFormat(text));
      if (!title.trim()) setTitle(suggestTitle(text));
    } catch {
      setError("Could not read the clipboard. Long-press the field and paste.");
    }
  }

  async function handleSave() {
    if (saving) return;
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Add a title before saving.");
      titleRef.current?.focus();
      return;
    }
    if (!content.trim()) {
      setError("Add or paste some content before saving.");
      return;
    }
    if (utf8ByteLength(content) > MAX_CONTENT_BYTES) {
      setError("Content is larger than 256 KiB and cannot be saved.");
      return;
    }

    setSaving(true);
    try {
      const finalTags = tagInputRef.current?.commit() ?? tags;
      await onSave({
        title: cleanTitle,
        content,
        contentFormat: format,
        tags: finalTags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      onDismiss={onClose}
      onRequestClose={() => {
        if (!saving) onClose();
      }}
      presentationStyle="pageSheet"
      visible
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View
            style={[
              styles.topBar,
              {
                borderColor: colors.border,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              hitSlop={10}
              onPress={onClose}
            >
              <Text
                style={{
                  color: saving ? colors.textMuted : colors.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text style={[styles.topTitle, { color: colors.text }]}>
              Save response
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              hitSlop={10}
              onPress={() => void handleSave()}
            >
              <Text
                style={{
                  color: saving ? colors.textMuted : colors.primary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { padding: spacing.lg, gap: spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.intro, { color: colors.textMuted }]}>
              {draft.manual
                ? "Clipboard access was unavailable. Paste your content below."
                : "Review the detected content, then add a title and tags."}
            </Text>

            <View style={{ gap: 6 }}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Content
                </Text>
                {draft.manual ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void pasteFromClipboard()}
                  >
                    <Text style={{ color: colors.primary, fontSize: 13 }}>
                      Paste from clipboard
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                accessibilityLabel="Pasted content"
                editable={draft.manual && !saving}
                multiline
                onChangeText={setContent}
                placeholder={
                  draft.manual
                    ? "Tap here, then long-press and choose Paste."
                    : undefined
                }
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
                style={[
                  styles.contentInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    color: colors.text,
                    opacity: draft.manual ? 1 : 0.82,
                    padding: spacing.md,
                  },
                ]}
                textAlignVertical="top"
                value={content}
              />
              <Text style={[styles.helper, { color: colors.textMuted }]}>
                {format === "markdown" ? "Markdown" : "Plain text"} ·{" "}
                {content.length.toLocaleString()} characters
              </Text>
            </View>

            <TextField
              ref={titleRef}
              label="Title"
              value={title}
              onChangeText={setTitle}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Give this saved answer a title"
              returnKeyType="next"
            />

            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: colors.text }]}>Format</Text>
              <View style={styles.formatRow}>
                {(["markdown", "plain"] as const).map((option) => {
                  const selected = format === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setFormat(option)}
                      style={[
                        styles.formatButton,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.surface,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? colors.primaryText
                            : colors.textMuted,
                          fontSize: 14,
                          fontWeight: "600",
                        }}
                      >
                        {option === "markdown" ? "Markdown" : "Plain text"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: colors.text }]}>
                Tags{" "}
                <Text style={{ color: colors.textMuted, fontWeight: "400" }}>
                  (optional)
                </Text>
              </Text>
              <TagInput
                ref={tagInputRef}
                value={tags}
                suggestions={suggestions}
                onChange={setTags}
              />
            </View>

            {error ? (
              <View
                style={[
                  styles.error,
                  {
                    backgroundColor: colors.errorSurface,
                    borderColor: colors.error,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Text style={{ color: colors.error, fontSize: 13, lineHeight: 19 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <AppButton
              fullWidth
              loading={saving}
              onPress={() => void handleSave()}
              size="lg"
            >
              {saving ? "Saving…" : "Save to Responses"}
            </AppButton>
            <View style={{ height: spacing.xxl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 40,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  contentInput: {
    borderWidth: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 12,
    lineHeight: 18,
    maxHeight: 260,
    minHeight: 150,
  },
  helper: {
    fontSize: 12,
  },
  formatRow: {
    flexDirection: "row",
    gap: 8,
  },
  formatButton: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
