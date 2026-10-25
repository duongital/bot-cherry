import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ContentFormat, CreateItemInput, Tag } from "../../lib/types";
import { contentByteLength, MAX_CONTENT_BYTES } from "../../lib/markdown";
import TagInput, { type TagInputHandle } from "./TagInput";

export interface SaveItemModalProps {
  initialContent: string;
  initialFormat: ContentFormat;
  initialTitle: string;
  initialTags?: string[];
  manual: boolean;
  mode?: "create" | "edit";
  suggestions: Tag[];
  onClose: () => void;
  onSave: (input: CreateItemInput) => Promise<void>;
}

export default function SaveItemModal({
  initialContent,
  initialFormat,
  initialTitle,
  initialTags = [],
  manual,
  mode = "create",
  suggestions,
  onClose,
  onSave,
}: SaveItemModalProps) {
  const isEdit = mode === "edit";
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [format, setFormat] = useState<ContentFormat>(initialFormat);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<TagInputHandle>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, saving]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Add a title before saving.");
      titleRef.current?.focus();
      return;
    }
    if (!content.trim()) {
      setError("Add or paste some content before saving.");
      return;
    }
    if (contentByteLength(content) > MAX_CONTENT_BYTES) {
      setError("Content is larger than 256 KiB and cannot be saved.");
      return;
    }

    setSaving(true);
    try {
      // Include a tag that was typed but not yet confirmed with Enter/comma.
      const finalTags = tagInputRef.current?.commit() ?? tags;
      await onSave({
        title: cleanTitle,
        content,
        contentFormat: format,
        tags: finalTags,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Could not update this item"
            : "Could not save this item",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-item-title"
        className="my-auto w-full max-w-2xl rounded-box border border-base-300 bg-base-100 shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="save-item-title" className="text-xl font-semibold">
                {isEdit ? "Edit saved response" : "Save to Responses"}
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                {isEdit
                  ? "Update the title, content, format, or tags for this saved response."
                  : manual
                    ? "Clipboard access was unavailable. Paste your content below."
                    : "Review the detected content, then add a title and tags."}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={onClose}
              disabled={saving}
              aria-label={isEdit ? "Close edit dialog" : "Close save dialog"}
            >
              ✕
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="save-item-content"
                className="mb-1.5 block text-sm font-medium"
              >
                Content
              </label>
              <textarea
                id="save-item-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                readOnly={!manual && !isEdit}
                rows={manual || isEdit ? 10 : 6}
                placeholder={
                  manual
                    ? "Click here, then press Cmd/Ctrl+V to paste your copied text."
                    : undefined
                }
                className={`textarea textarea-bordered w-full resize-y font-mono text-xs leading-relaxed ${
                  manual || isEdit ? "" : "bg-base-200/60"
                }`}
              />
              <p className="mt-1 text-xs text-base-content/50">
                {format === "markdown" ? "Markdown" : "Plain text"} ·{" "}
                {content.length.toLocaleString()} characters
              </p>
            </div>

            <div>
              <label
                htmlFor="save-item-title-input"
                className="mb-1.5 block text-sm font-medium"
              >
                Title <span className="text-error">*</span>
              </label>
              <input
                ref={titleRef}
                id="save-item-title-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Give this saved answer a title"
                className="input input-bordered w-full"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium">Format</span>
              <div
                role="radiogroup"
                aria-label="Content format"
                className="join"
              >
                {(["markdown", "plain"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={format === option}
                    onClick={() => setFormat(option)}
                    className={`btn btn-sm join-item ${
                      format === option ? "btn-primary" : "btn-ghost border border-base-300"
                    }`}
                  >
                    {option === "markdown" ? "Markdown" : "Plain text"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium">
                Tags <span className="font-normal text-base-content/50">(optional)</span>
              </span>
              <TagInput
                ref={tagInputRef}
                value={tags}
                suggestions={suggestions}
                onChange={setTags}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="alert alert-error mt-4 text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
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
              disabled={saving || !title.trim() || !content.trim()}
            >
              {saving && <span className="loading loading-spinner loading-xs" />}
              {saving
                ? isEdit
                  ? "Updating…"
                  : "Saving…"
                : isEdit
                  ? "Update"
                  : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
