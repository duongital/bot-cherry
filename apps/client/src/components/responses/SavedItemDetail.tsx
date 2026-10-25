import { useState } from "react";
import { itemsApi } from "../../lib/api";
import { formatFullDate, formatSavedDate } from "../../lib/date";
import { useSavedItem } from "../../hooks/useSavedItem";
import type { CreateItemInput, SavedItemSummary, Tag } from "../../lib/types";
import type { ToastType } from "./Toast";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MarkdownContent from "./MarkdownContent";
import SaveItemModal from "./SaveItemModal";
import TagNoteCard from "./TagNoteCard";

export default function SavedItemDetail({
  itemId,
  onBack,
  onDeleted,
  onUpdated,
  onToast,
  tags,
}: {
  itemId: string | undefined;
  onBack: () => void;
  onDeleted: (id: string) => void;
  onUpdated: (item: SavedItemSummary) => void;
  onToast: (type: ToastType, message: string) => void;
  tags: Tag[];
}) {
  const { item, loading, notFound, error, setItem } = useSavedItem(itemId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!itemId) {
    return (
      <EmptyState
        icon="🍒"
        title="Select a saved response"
        description="Pick an item from the sidebar to read it, or paste something new to save your first response."
      />
    );
  }

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-3xl animate-pulse p-6 sm:p-8"
        aria-label="Loading saved response"
      >
        <div className="h-7 w-2/3 rounded bg-base-300" />
        <div className="mt-3 h-3 w-1/3 rounded bg-base-300/70" />
        <div className="mt-8 space-y-3 rounded-box border border-base-300 bg-base-100 p-6">
          <div className="h-3 w-full rounded bg-base-300/80" />
          <div className="h-3 w-11/12 rounded bg-base-300/80" />
          <div className="h-3 w-4/5 rounded bg-base-300/80" />
          <div className="h-3 w-full rounded bg-base-300/80" />
        </div>
      </div>
    );
  }

  if (notFound || error || !item) {
    return (
      <EmptyState
        icon={notFound ? "🫥" : "⚠️"}
        title={notFound ? "This saved item is gone" : "Could not load this item"}
        description={
          notFound
            ? "It may have been deleted in another tab or on another device."
            : (error ?? "Please try again in a moment.")
        }
        action={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onBack}
          >
            Back to saved items
          </button>
        }
      />
    );
  }

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard is not available");
      }
      await navigator.clipboard.writeText(item!.content);
      onToast("success", "Raw content copied to clipboard.");
    } catch {
      onToast("error", "Could not copy. Your browser blocked clipboard access.");
    }
  }

  async function handleUpdate(input: CreateItemInput) {
    const updated = await itemsApi.update(item!.id, input);
    setItem(updated);
    onUpdated(updated);
    setEditing(false);
    onToast("success", "Saved item updated.");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await itemsApi.remove(item!.id);
      setConfirmingDelete(false);
      onDeleted(item!.id);
      onToast("success", "Saved item deleted.");
    } catch (err) {
      onToast(
        "error",
        err instanceof Error ? err.message : "Could not delete this item.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm lg:hidden"
          onClick={onBack}
          aria-label="Back to saved responses"
        >
          ← Back
        </button>
      </div>

      <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-base-content sm:text-3xl">
            {item.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-base-content/60">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-base-300 bg-base-100 px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
            <span title={formatFullDate(item.createdAt)}>
              saved {formatSavedDate(item.createdAt)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {item.contentFormat === "markdown" ? "Markdown" : "Plain text"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost btn-sm border border-base-300"
            onClick={handleCopy}
          >
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
              <rect x="7" y="7" width="9" height="9" rx="1.5" />
              <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-7A1.5 1.5 0 0 0 3 5.5v7A1.5 1.5 0 0 0 4.5 14H7" />
            </svg>
            Copy
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            onClick={() => setConfirmingDelete(true)}
          >
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
              <path d="M4 6h12" />
              <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
              <path d="m5.5 6 .7 9.1a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4L14.5 6" />
              <path d="M8.5 9v4.5M11.5 9v4.5" />
            </svg>
            Delete
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm border border-base-300"
            onClick={() => setEditing(true)}
          >
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
              <path d="M13.5 3.5a2.12 2.12 0 0 1 3 3L7 16l-4 1 1-4Z" />
              <path d="m12 5 3 3" />
            </svg>
            Edit
          </button>
        </div>
      </header>

      {item.tags.map((tagName) => {
        const tag = tags.find((candidate) => candidate.name === tagName);
        return tag ? <TagNoteCard key={tag.id} tag={tag} /> : null;
      })}

      <article className="mt-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-sm sm:p-8">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-base-content/45">
          Pasted content
        </p>
        <div className="mt-4">
          <MarkdownContent content={item.content} format={item.contentFormat} />
        </div>
      </article>

      {editing && (
        <SaveItemModal
          mode="edit"
          initialContent={item.content}
          initialFormat={item.contentFormat}
          initialTitle={item.title}
          initialTags={item.tags}
          manual={false}
          suggestions={tags}
          onClose={() => setEditing(false)}
          onSave={handleUpdate}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this saved item?"
          message="This removes the saved response and its tag links. Tags you created remain available for reuse."
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
