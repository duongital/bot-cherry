import { useState } from "react";
import { useTagNote } from "../../hooks/useTagNote";
import type { Tag } from "../../lib/types";
import TagNoteModal from "./TagNoteModal";

/**
 * Mobile-only read-only preview of a tag note inside the response reader.
 * Editing stays in the sidebar note panel on larger screens.
 */
export default function TagNoteCard({ tag }: { tag: Tag }) {
  const { note, loading, error, saveNote } = useTagNote(tag.id);
  const [editing, setEditing] = useState(false);

  if (loading || error || !note?.content.trim()) return null;

  return (
    <>
      <section
        className="mt-5 rounded-box border border-base-300 bg-base-100 p-4 lg:hidden"
        aria-labelledby={`mobile-tag-note-${tag.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={`mobile-tag-note-${tag.id}`}
            className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-base-content/45"
          >
            Note for <span className="text-primary">#{tag.name}</span>
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-xs border border-base-300"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-base-content">
          {note.content}
        </p>
      </section>

      {editing && (
        <TagNoteModal
          tag={tag}
          initialContent={note.content}
          onClose={() => setEditing(false)}
          onSave={async (content) => {
            await saveNote(content);
            setEditing(false);
          }}
        />
      )}
    </>
  );
}
