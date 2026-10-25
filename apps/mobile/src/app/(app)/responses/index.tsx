import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountMenu } from "@/components/responses/AccountMenu";
import { PasteButton } from "@/components/responses/PasteButton";
import { ResponsesHeader } from "@/components/responses/ResponsesHeader";
import { SaveItemModal } from "@/components/responses/SaveItemModal";
import { SavedItemRow } from "@/components/responses/SavedItemRow";
import { AppButton } from "@/components/ui/AppButton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { itemsApi } from "@/lib/api";
import type {
  CreateItemInput,
  PasteDraft,
  SavedItemSummary,
} from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useResponses } from "@/providers/ResponsesProvider";
import { useShareCapture } from "@/providers/ShareCaptureProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useToast } from "@/providers/ToastProvider";

export default function ResponsesListRoute() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const {
    items,
    tags,
    search,
    activeTag,
    loading,
    refreshing,
    loadingMore,
    error,
    nextCursor,
    setSearch,
    setActiveTag,
    refresh,
    retry,
    loadMore,
    refreshTags,
    prependItem,
  } = useResponses();
  const { colors, spacing } = useTheme();
  const { pendingDraft, consumeDraft } = useShareCapture();

  const [draft, setDraft] = useState<PasteDraft | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const hasFilters = search.trim().length > 0 || activeTag.length > 0;
  const hasMore = Boolean(nextCursor);

  useEffect(() => {
    if (!pendingDraft) return;
    setDraft(pendingDraft);
    consumeDraft();
  }, [consumeDraft, pendingDraft]);

  const handleSelect = useCallback(
    (id: string) => {
      router.push({
        pathname: "/responses/[itemId]",
        params: { itemId: id },
      });
    },
    [router],
  );

  const handleSave = useCallback(
    async (input: CreateItemInput) => {
      const created = await itemsApi.create(input);
      prependItem(created);
      await refreshTags();
      setDraft(null);
      router.push({
        pathname: "/responses/[itemId]",
        params: { itemId: created.id },
      });
      showToast("success", "Saved to your responses.");
    },
    [prependItem, refreshTags, router, showToast],
  );

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Sign out?",
      "You can sign in again at any time. Saved responses stay on the server.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            setSigningOut(true);
            void signOut()
              .then(() => {
                setAccountOpen(false);
                router.replace("/login");
              })
              .catch((err: unknown) => {
                showToast(
                  "error",
                  err instanceof Error ? err.message : "Could not sign out.",
                );
              })
              .finally(() => setSigningOut(false));
          },
        },
      ],
    );
  }, [router, showToast, signOut]);

  const renderItem = useCallback(
    ({ item }: { item: SavedItemSummary }) => (
      <SavedItemRow
        item={item}
        active={false}
        onPress={() => handleSelect(item.id)}
      />
    ),
    [handleSelect],
  );

  function clearFilters() {
    setSearch("");
    setActiveTag("");
  }

  const listFooter = loadingMore ? (
    <View style={{ padding: spacing.lg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  ) : undefined;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
    >
      <ResponsesHeader
        activeTag={activeTag}
        hasMore={hasMore}
        itemCount={items.length}
        loading={loading}
        onOpenAccount={() => setAccountOpen(true)}
        onPasteError={(message) => showToast("error", message)}
        onPasteReady={setDraft}
        onSearchChange={setSearch}
        onTagChange={setActiveTag}
        search={search}
        tags={tags}
      />

      <View style={[styles.body, { backgroundColor: colors.background }]}>
        {error && items.length > 0 ? (
          <View
            style={[
              styles.inlineError,
              {
                backgroundColor: colors.errorSurface,
                borderColor: colors.error,
                marginHorizontal: spacing.lg,
                marginTop: spacing.md,
                padding: spacing.md,
              },
            ]}
          >
            <Text style={{ color: colors.error, flex: 1, fontSize: 13 }}>
              {error}
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => void retry()}
              style={{ color: colors.error, fontSize: 13, fontWeight: "700" }}
            >
              Retry
            </Text>
          </View>
        ) : null}

        {loading && items.length === 0 ? (
          <LoadingSkeleton rows={5} />
        ) : error && items.length === 0 ? (
          <ErrorState message={error} onRetry={() => void retry()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={hasFilters ? "🔎" : "📋"}
            title={hasFilters ? "No matches" : "Nothing saved yet"}
            description={
              hasFilters
                ? "Try a different search or tag filter."
                : "Copy an AI answer or note, then tap Paste to keep it here."
            }
            action={
              hasFilters ? (
                <AppButton onPress={clearFilters} variant="secondary">
                  Clear filters
                </AppButton>
              ) : (
                <PasteButton
                  fullWidth
                  onDraft={setDraft}
                  onError={(message) => showToast("error", message)}
                  label="Paste your first item"
                  size="sm"
                />
              )
            }
          />
        ) : (
          <FlatList
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: spacing.xxl,
            }}
            data={items}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.id}
            ListFooterComponent={listFooter}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                onRefresh={() => void refresh()}
                refreshing={refreshing}
                tintColor={colors.primary}
              />
            }
            renderItem={renderItem}
          />
        )}
      </View>

      {draft ? (
        <SaveItemModal
          draft={draft}
          suggestions={tags}
          onClose={() => setDraft(null)}
          onSave={handleSave}
        />
      ) : null}

      <AccountMenu
        onClose={() => setAccountOpen(false)}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        userEmail={user?.email ?? ""}
        userName={user?.name ?? "Account"}
        visible={accountOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  inlineError: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    gap: 12,
  },
});
