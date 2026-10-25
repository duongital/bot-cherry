import {
  forwardRef,
  useId,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
} from "react";
import type { Tag } from "../../lib/types";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 32;

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface TagInputHandle {
  /** Add any text still sitting in the input and return the resulting tags. */
  commit: () => string[];
}

interface TagInputProps {
  value: string[];
  suggestions: Tag[];
  onChange: (tags: string[]) => void;
}

const TagInput = forwardRef<TagInputHandle, TagInputProps>(function TagInput(
  { value, suggestions, onChange },
  ref,
) {
  const [input, setInput] = useState("");
  const listId = useId();

  function addTag(raw: string): string[] {
    const name = normalize(raw).slice(0, MAX_TAG_LENGTH);
    if (!name) {
      setInput("");
      return value;
    }
    if (value.length >= MAX_TAGS || value.includes(name)) {
      setInput("");
      return value;
    }
    const next = [...value, name];
    onChange(next);
    setInput("");
    return next;
  }

  useImperativeHandle(
    ref,
    () => ({
      commit: () => addTag(input),
    }),
    [input, value, onChange],
  );

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input);
      return;
    }
    if (event.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const availableSuggestions = suggestions
    .filter((tag) => !value.includes(tag.name))
    .filter((tag) => input.trim() && tag.name.includes(normalize(input)))
    .slice(0, 5);

  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-field border border-base-300 bg-base-100 px-2 py-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="badge badge-outline gap-1 border-base-300 py-2.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="cursor-pointer text-base-content/50 transition-colors hover:text-error"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={listId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="tag-input min-w-28 flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none focus:outline-none"
          placeholder={value.length === 0 ? "Add tags…" : ""}
          maxLength={MAX_TAG_LENGTH}
          disabled={value.length >= MAX_TAGS}
          aria-label="Add a tag"
          autoComplete="off"
        />
      </div>
      <p className="mt-1.5 text-xs text-base-content/50">
        Press Enter or comma to add. {value.length}/{MAX_TAGS} tags.
      </p>

      {availableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {availableSuggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="btn btn-ghost btn-xs border border-base-300"
              onClick={() => addTag(tag.name)}
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default TagInput;
