import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MarkdownContent } from "@/components/responses/MarkdownContent";
import { TagNoteCard } from "@/components/responses/TagNoteCard";
import { AppButton } from "@/components/ui/AppButton";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { formatFullDate, formatSavedDate } from "@/lib/date";
import { itemsApi } from "@/lib/api";
import { useSavedItem } from "@/hooks/useSavedItem";
import { useAuth } from "@/providers/AuthProvider";
import { useResponses } from "@/providers/ResponsesProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";

export default function ResponseDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId: string }>();
  const itemId = params.itemId;
  const { handleUnauthorized } = useAuth();
  const { tags, removeItem } = useResponses();
  const { colors, spacing, radius } = useTheme();
  const { showToast } = useToast();
  const { item, loading, notFound, error, retry } = useSavedItem(
    itemId,
    handleUnauthorized,
  );
  const [deleting, setDeleting] = useState(false);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/responses");
  }, [router]);

  const handleCopy = useCallback(async () => {
    if (!item) return;
    try {
      await Clipboard.setStringAsync(item.content);
      showToast("success", "Raw content copied to clipboard.");
    } catch {
      showToast("error", "Could not copy the content.");
    }
  }, [item, showToast]);

  const performDelete = useCallback(async () => {
    if (!item || deleting) return;
    setDeleting(true);
    try {
      await itemsApi.remove(item.id);
      removeItem(item.id);
      showToast("success", "Saved item deleted.");
      handleBack();
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Could not delete this item.",
      );
    } finally {
      setDeleting(false);
    }
  }, [deleting, handleBack, item, removeItem, showToast]);

  const confirmDelete = useCallback(() => {
    if (!item) return;
    Alert.alert(
      "Delete this saved item?",
      "This removes the saved response and its tag links. Tags you created remain available for reuse.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void performDelete(),
        },
      ],
    );
  }, [item, performDelete]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Back to saved responses"
          accessibilityRole="button"
          hitSlop={10}
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed ? colors.surfaceMuted : "transparent",
              borderRadius: radius.sm,
            },
          ]}
        >
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>
            ← Back
          </Text>
        </Pressable>
        <Text
          numberOfLines={1}
          style={[styles.topBarTitle, { color: colors.textMuted }]}
        >
          Response
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : notFound ? (
        <EmptyState
          icon="🫥"
          title="This saved item is gone"
          description="It may have been deleted in another tab or on another device."
          action={<AppButton onPress={handleBack}>Back to saved items</AppButton>}
        />
      ) : error || !item ? (
        <ErrorState
          message={error ?? "Could not load this item."}
          onRetry={() => void retry()}
          action={<AppButton onPress={handleBack}>Back to saved items</AppButton>}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
            gap: spacing.lg,
          }}
        >
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              {item.title}
            </Text>
            <View style={[styles.metaRow, { marginTop: spacing.md }]}>
              {item.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.pill,
                    },
                  ]}
                >
                  <Text style={{ color: colors.primary, fontSize: 11 }}>
                    #{tag}
                  </Text>
                </View>
              ))}
              <Text
                accessibilityLabel={`Saved ${formatFullDate(item.createdAt)}`}
                style={[styles.meta, { color: colors.textMuted }]}
              >
                saved {formatSavedDate(item.createdAt)} ·{" "}
                {item.contentFormat === "markdown" ? "Markdown" : "Plain text"}
              </Text>
            </View>
          </View>

          <View style={[styles.actions, { gap: spacing.sm }]}>
            <AppButton
              onPress={() => void handleCopy()}
              size="sm"
              variant="secondary"
            >
              Copy raw content
            </AppButton>
            <AppButton
              disabled={deleting}
              loading={deleting}
              onPress={confirmDelete}
              size="sm"
              variant="danger"
            >
              Delete
            </AppButton>
          </View>

          {item.tags.map((tagName) => {
            const tag = tags.find((candidate) => candidate.name === tagName);
            return tag ? <TagNoteCard key={tag.id} tag={tag} /> : null;
          })}

          <Card>
            <Text
              style={[
                styles.contentLabel,
                { color: colors.textMuted },
              ]}
            >
              PASTED CONTENT
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <MarkdownContent
                content={item.content}
                format={item.contentFormat}
              />
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  topBarSpacer: {
    width: 62,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  meta: {
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  contentLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
});
