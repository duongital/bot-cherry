import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, itemsApi, tagsApi } from "@/lib/api";
import type { SavedItemSummary, Tag } from "@/lib/types";

const PAGE_SIZE = 50;

export function useSavedItems(
  search: string,
  activeTag: string,
  onUnauthorized: () => Promise<void>,
) {
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [items, setItems] = useState<SavedItemSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFirstPage = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      const requestId = ++requestSeq.current;
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await itemsApi.list({
          q: debouncedSearch || undefined,
          tag: activeTag || undefined,
          limit: PAGE_SIZE,
        });
        if (requestId !== requestSeq.current) return;
        setItems(result.items);
        setNextCursor(result.nextCursor);
      } catch (err) {
        if (requestId !== requestSeq.current) return;
        if (err instanceof ApiError && err.status === 401) {
          await onUnauthorized();
          return;
        }
        setError(
          err instanceof Error ? err.message : "Could not load saved items",
        );
      } finally {
        if (requestId === requestSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeTag, debouncedSearch, onUnauthorized],
  );

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const refreshTags = useCallback(async () => {
    try {
      const result = await tagsApi.list();
      setTags(result.tags);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await onUnauthorized();
        return;
      }
      // Tags are supplementary; the item list can still work without them.
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void refreshTags();
  }, [refreshTags]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return;
    const requestId = requestSeq.current;
    setLoadingMore(true);

    try {
      const result = await itemsApi.list({
        q: debouncedSearch || undefined,
        tag: activeTag || undefined,
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (requestId !== requestSeq.current) return;
      setItems((current) => {
        const existing = new Set(current.map((item) => item.id));
        return [
          ...current,
          ...result.items.filter((item) => !existing.has(item.id)),
        ];
      });
      setNextCursor(result.nextCursor);
    } catch (err) {
      if (requestId !== requestSeq.current) return;
      if (err instanceof ApiError && err.status === 401) {
        await onUnauthorized();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not load more items",
      );
    } finally {
      if (requestId === requestSeq.current) setLoadingMore(false);
    }
  }, [
    activeTag,
    debouncedSearch,
    loading,
    loadingMore,
    nextCursor,
    onUnauthorized,
  ]);

  const prependItem = useCallback((item: SavedItemSummary) => {
    setItems((current) => [
      item,
      ...current.filter((existing) => existing.id !== item.id),
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return {
    items,
    tags,
    nextCursor,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMore,
    refresh: () => loadFirstPage("refresh"),
    refreshTags,
    prependItem,
    removeItem,
    retry: () => loadFirstPage(),
  };
}
