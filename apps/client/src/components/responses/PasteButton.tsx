import { useState, type ReactNode } from "react";
import { contentByteLength, detectFormat, MAX_CONTENT_BYTES, suggestTitle } from "../../lib/markdown";
import type { PasteDraft } from "../../lib/types";

export default function PasteButton({
  onReady,
  onError,
  className = "btn btn-primary",
  children,
}: {
  onReady: (draft: PasteDraft) => void;
  onError: (message: string) => void;
  className?: string;
  children?: ReactNode;
}) {
  const [reading, setReading] = useState(false);

  function openManual() {
    onReady({
      content: "",
      contentFormat: "plain",
      suggestedTitle: "",
      manual: true,
    });
  }

  async function handleClick() {
    setReading(true);
    try {
      if (!navigator.clipboard?.readText) {
        openManual();
        return;
      }

      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        onError("Your clipboard is empty — copy something first.");
        return;
      }
      if (contentByteLength(text) > MAX_CONTENT_BYTES) {
        onError("That clipboard content is larger than 256 KiB.");
        return;
      }

      onReady({
        content: text,
        contentFormat: detectFormat(text),
        suggestedTitle: suggestTitle(text),
        manual: false,
      });
    } catch {
      openManual();
    } finally {
      setReading(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={reading}
    >
      {reading ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <rect x="6" y="3.5" width="8" height="3" rx="1" />
          <path d="M14 5h1.5A1.5 1.5 0 0 1 17 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-9A1.5 1.5 0 0 1 4.5 5H6" />
        </svg>
      )}
      {children ?? "Paste"}
    </button>
  );
}
