import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { Tag } from "../../lib/types";

const MAX_NOTE_LENGTH = 20_000;

export default function TagNoteModal({
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
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
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

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`tag-note-modal-title-${tag.id}`}
        className="my-auto w-full max-w-lg rounded-box border border-base-300 bg-base-100 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={`tag-note-modal-title-${tag.id}`}
                className="text-lg font-semibold"
              >
                Note for <span className="text-primary">#{tag.name}</span>
              </h2>
              <p className="mt-1 text-xs text-base-content/55">
                This note is attached only to this tag.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
              disabled={saving}
              aria-label="Close note editor"
            >
              ✕
            </button>
          </div>

          <label htmlFor={`tag-note-mobile-${tag.id}`} className="sr-only">
            Note for #{tag.name}
          </label>
          <textarea
            ref={textareaRef}
            id={`tag-note-mobile-${tag.id}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_NOTE_LENGTH}
            rows={10}
            placeholder={`Write a note for #${tag.name}…`}
            className="textarea textarea-bordered mt-4 w-full resize-y rounded-none bg-base-100 font-mono text-xs leading-relaxed"
          />

          <div className="mt-1 flex items-center justify-between gap-3 text-[0.68rem] text-base-content/50">
            <span>Changes are saved when you tap Save.</span>
            <span className="tabular-nums">
              {content.length.toLocaleString()}/{MAX_NOTE_LENGTH.toLocaleString()}
            </span>
          </div>

          {error && (
            <div role="alert" className="alert alert-error mt-3 text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || content === initialContent}
            >
              {saving && <span className="loading loading-spinner loading-xs" />}
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
