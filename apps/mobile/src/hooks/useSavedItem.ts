import { useEffect, useState } from "react";
import { ApiError, itemsApi } from "@/lib/api";
import type { SavedItem } from "@/lib/types";

export function useSavedItem(
  itemId: string | undefined,
  onUnauthorized: () => Promise<void>,
) {
  const [item, setItem] = useState<SavedItem | null>(null);
  const [loading, setLoading] = useState(Boolean(itemId));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setLoading(false);
      setNotFound(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setItem(null);
    setLoading(true);
    setNotFound(false);
    setError(null);

    itemsApi
      .get(itemId)
      .then((result) => {
        if (!cancelled) setItem(result);
      })
      .catch(async (err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          await onUnauthorized();
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Could not load this item",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, onUnauthorized, reloadKey]);

  return {
    item,
    loading,
    notFound,
    error,
    retry: () => setReloadKey((value) => value + 1),
  };
}
