import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTagNote } from "@/hooks/useTagNote";
import type { Tag } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { TagNoteModal } from "./TagNoteModal";

export function TagNoteCard({ tag }: { tag: Tag }) {
  const { handleUnauthorized } = useAuth();
  const { colors, radius, spacing } = useTheme();
  const { note, error, saveNote } = useTagNote(tag.id, handleUnauthorized);
  const [editing, setEditing] = useState(false);

  if (error || !note?.content.trim()) return null;

  return (
    <>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.md,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            Note for <Text style={{ color: colors.primary }}>#{tag.name}</Text>
          </Text>
          <Pressable
            accessibilityLabel={`Edit note for ${tag.name}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setEditing(true)}
            style={[
              styles.edit,
              {
                borderColor: colors.border,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
              Edit
            </Text>
          </Pressable>
        </View>
        <Text
          style={[
            styles.note,
            { color: colors.text, marginTop: spacing.sm },
          ]}
        >
          {note.content}
        </Text>
      </View>

      {editing ? (
        <TagNoteModal
          tag={tag}
          initialContent={note.content}
          onClose={() => setEditing(false)}
          onSave={async (content) => {
            await saveNote(content);
            setEditing(false);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  edit: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
  },
});
