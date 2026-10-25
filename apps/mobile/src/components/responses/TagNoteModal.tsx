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
import { MAX_TAG_NOTE_LENGTH } from "@/lib/markdown";
import type { Tag } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

export function TagNoteModal({
  tag,
  initialContent,
  onClose,
  onSave,
}: {
  tag: Tag;
  initialContent: string;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}) {
  const { colors, radius, spacing } = useTheme();
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  async function handleSave() {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
      await onSave(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note");
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
              Note for #{tag.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={saving || content === initialContent}
              hitSlop={10}
              onPress={() => void handleSave()}
            >
              <Text
                style={{
                  color:
                    saving || content === initialContent
                      ? colors.textMuted
                      : colors.primary,
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
              { padding: spacing.lg, gap: spacing.md },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              This note is attached only to this tag. Changes are saved when you
              tap Save.
            </Text>
            <TextInput
              ref={inputRef}
              accessibilityLabel={`Note for ${tag.name}`}
              multiline
              maxLength={MAX_TAG_NOTE_LENGTH}
              onChangeText={setContent}
              placeholder={`Write a note for #${tag.name}…`}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  color: colors.text,
                  padding: spacing.md,
                },
              ]}
              textAlignVertical="top"
              value={content}
            />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                textAlign: "right",
                fontVariant: ["tabular-nums"],
              }}
            >
              {content.length.toLocaleString()}/
              {MAX_TAG_NOTE_LENGTH.toLocaleString()}
            </Text>

            {error ? (
              <View
                style={{
                  backgroundColor: colors.errorSurface,
                  borderColor: colors.error,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  padding: 10,
                }}
              >
                <Text style={{ color: colors.error, fontSize: 13 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <AppButton
              fullWidth
              loading={saving}
              disabled={content === initialContent}
              onPress={() => void handleSave()}
            >
              {saving ? "Saving…" : "Save note"}
            </AppButton>
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
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 12,
    textAlign: "center",
  },
  content: {
    paddingBottom: 40,
  },
  input: {
    borderWidth: 1,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 12,
    lineHeight: 18,
    minHeight: 260,
  },
});
