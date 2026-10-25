import { useEffect, useState } from "react";
import { formatSavedDate } from "../../lib/date";
import { useTagNote } from "../../hooks/useTagNote";
import type { Tag } from "../../lib/types";

export default function TagNotePanel({ tag }: { tag: Tag }) {
  const { note, loading, error, reload, saveNote } = useTagNote(tag.id);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    setDraft(note.content);
    setSaveError(null);
  }, [note]);

  const savedContent = note?.content ?? "";
  const dirty = draft !== savedContent;

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveNote(draft);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="hidden h-1/2 min-h-56 shrink-0 flex-col border-t border-base-300 bg-base-100 lg:flex">
      <div className="border-b border-base-300/70 px-4 py-3">
        <h2 className="truncate text-sm font-semibold">
          Note for <span className="text-primary">#{tag.name}</span>
        </h2>
        <p className="mt-0.5 text-[0.68rem] text-base-content/50">
          Attached to this tag.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        {loading ? (
          <div className="animate-pulse space-y-2" aria-label="Loading tag note">
            <div className="h-3 w-full rounded bg-base-300/80" />
            <div className="h-3 w-5/6 rounded bg-base-300/80" />
            <div className="h-3 w-2/3 rounded bg-base-300/80" />
          </div>
        ) : error ? (
          <div role="alert" className="alert alert-error alert-sm text-xs">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => void reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <label htmlFor={`tag-note-${tag.id}`} className="sr-only">
              Note for #{tag.name}
            </label>
            <textarea
              id={`tag-note-${tag.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={`Write a note for #${tag.name}…`}
              className="textarea textarea-bordered min-h-0 flex-1 resize-none rounded-none bg-base-100 font-mono text-xs leading-relaxed focus:rounded-none"
            />

            {saveError && (
              <p role="alert" className="mt-2 text-xs text-error">
                {saveError}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[0.68rem] text-base-content/50">
                {saving
                  ? "Saving…"
                  : dirty
                    ? "Unsaved changes"
                    : note?.updatedAt
                      ? `Saved ${formatSavedDate(note.updatedAt)}`
                      : "No note yet"}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => void handleSave()}
                disabled={saving || !dirty}
              >
                {saving && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Save note
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
