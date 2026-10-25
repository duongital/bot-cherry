import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  detectFormat,
  suggestTitle,
  utf8ByteLength,
  MAX_CONTENT_BYTES,
} from "@/lib/markdown";
import type { PasteDraft } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface ShareCaptureContextValue {
  pendingDraft: PasteDraft | null;
  consumeDraft: () => void;
}

const ShareCaptureContext = createContext<ShareCaptureContextValue | null>(
  null,
);

/**
 * Converts Android/iOS share-sheet text into a paste draft. The draft stays in
 * memory until the responses screen opens the save modal, so users can sign in
 * first if needed.
 */
export function ShareCaptureProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    hasShareIntent,
    shareIntent,
    resetShareIntent,
    error,
  } = useShareIntentContext();
  const [pendingDraft, setPendingDraft] = useState<PasteDraft | null>(null);
  const lastHandledKey = useRef<string | null>(null);

  useEffect(() => {
    if (!hasShareIntent) {
      // A new share event can carry the same text again; clear the de-dupe key
      // once the native intent has been consumed.
      lastHandledKey.current = null;
      return;
    }

    const sharedText = shareIntent.text?.trim() || "";
    const sharedUrl = shareIntent.webUrl?.trim() || "";
    const content =
      sharedText && sharedUrl && !sharedText.includes(sharedUrl)
        ? `${sharedText}\n\n${sharedUrl}`
        : sharedText || sharedUrl;

    if (!content) {
      if (shareIntent.files?.length) {
        showToast(
          "error",
          "Only shared text and links can be saved right now.",
        );
      } else {
        showToast("error", "The shared content was empty.");
      }
      resetShareIntent();
      return;
    }

    const key = `${shareIntent.type ?? "text"}:${content}`;
    if (lastHandledKey.current === key && pendingDraft) return;
    lastHandledKey.current = key;

    if (utf8ByteLength(content) > MAX_CONTENT_BYTES) {
      showToast("error", "Shared content is larger than 256 KiB.");
      resetShareIntent();
      return;
    }

    const sharedTitle = shareIntent.meta?.title?.trim();
    setPendingDraft({
      content,
      contentFormat: detectFormat(content),
      suggestedTitle: sharedTitle || suggestTitle(content),
      manual: false,
    });
    resetShareIntent();
    router.replace("/responses");
  }, [
    hasShareIntent,
    pendingDraft,
    resetShareIntent,
    router,
    shareIntent,
    showToast,
  ]);

  useEffect(() => {
    if (!error) return;
    showToast("error", "Could not read the shared content.");
  }, [error, showToast]);

  const consumeDraft = useCallback(() => {
    setPendingDraft(null);
  }, []);

  const value = useMemo(
    () => ({ pendingDraft, consumeDraft }),
    [consumeDraft, pendingDraft],
  );

  return (
    <ShareCaptureContext.Provider value={value}>
      {children}
    </ShareCaptureContext.Provider>
  );
}

export function useShareCapture() {
  const context = useContext(ShareCaptureContext);
  if (!context) {
    throw new Error("useShareCapture must be used inside ShareCaptureProvider");
  }
  return context;
}
