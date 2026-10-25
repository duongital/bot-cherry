import { useCallback, useEffect, useRef, useState } from "react";
import { itemsApi, tagsApi } from "../lib/api";
import type { SavedItemSummary, Tag } from "../lib/types";

const PAGE_SIZE = 50;

export function useSavedItems(search: string, activeTag: string) {
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [items, setItems] = useState<SavedItemSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestSeq.current;
    setLoading(true);
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
      setError(err instanceof Error ? err.message : "Could not load saved items");
    } finally {
      if (requestId === requestSeq.current) setLoading(false);
    }
  }, [debouncedSearch, activeTag]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const refreshTags = useCallback(async () => {
    try {
      const result = await tagsApi.list();
      setTags(result.tags);
    } catch {
      // Tags are supplementary; a list request will still work without them.
    }
  }, []);

  useEffect(() => {
    void refreshTags();
  }, [refreshTags]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
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
      setItems((current) => [...current, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      if (requestId === requestSeq.current) {
        setError(
          err instanceof Error ? err.message : "Could not load more items",
        );
      }
    } finally {
      if (requestId === requestSeq.current) setLoadingMore(false);
    }
  }, [activeTag, debouncedSearch, loadingMore, nextCursor]);

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
    loadingMore,
    error,
    loadMore,
    refreshTags,
    prependItem,
    removeItem,
    retry: loadFirstPage,
  };
}
