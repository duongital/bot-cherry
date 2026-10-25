import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, tagsApi } from "@/lib/api";
import type { TagNote } from "@/lib/types";

export function useTagNote(
  tagId: string | undefined,
  onUnauthorized: () => Promise<void>,
) {
  const [note, setNote] = useState<TagNote | null>(null);
  const [loading, setLoading] = useState(Boolean(tagId));
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    if (!tagId) {
      setNote(null);
      setLoading(false);
      setError(null);
      return;
    }

    const requestId = ++requestSeq.current;
    setLoading(true);
    setError(null);

    try {
      const result = await tagsApi.getNote(tagId);
      if (requestId !== requestSeq.current) return;
      setNote(result.note);
    } catch (err) {
      if (requestId !== requestSeq.current) return;
      if (err instanceof ApiError && err.status === 401) {
        await onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load this note");
    } finally {
      if (requestId === requestSeq.current) setLoading(false);
    }
  }, [onUnauthorized, tagId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      requestSeq.current += 1;
    },
    [],
  );

  const saveNote = useCallback(
    async (content: string) => {
      if (!tagId) throw new Error("No tag selected");
      try {
        const result = await tagsApi.saveNote(tagId, content);
        setNote(result.note);
        return result.note;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await onUnauthorized();
        }
        throw err;
      }
    },
    [onUnauthorized, tagId],
  );

  return { note, loading, error, reload: load, saveNote };
}
