import type { PasteDraft, SavedItemSummary, Tag } from "../../lib/types";
import EmptyState from "./EmptyState";
import PasteButton from "./PasteButton";
import SavedItemListItem from "./SavedItemListItem";
import TagNotePanel from "./TagNotePanel";

export default function ResponsesSidebar({
  items,
  tags,
  selectedId,
  search,
  activeTag,
  loading,
  loadingMore,
  error,
  hasMore,
  onSearchChange,
  onTagChange,
  onSelect,
  onPasteReady,
  onPasteError,
  onLoadMore,
  onRetry,
}: {
  items: SavedItemSummary[];
  tags: Tag[];
  selectedId: string | undefined;
  search: string;
  activeTag: string;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSelect: (id: string) => void;
  onPasteReady: (draft: PasteDraft) => void;
  onPasteError: (message: string) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  const hasFilters = search.trim().length > 0 || activeTag.length > 0;
  const selectedItem = items.find((item) => item.id === selectedId);
  const noteTagName = selectedItem
    ? selectedItem.tags.includes(activeTag)
      ? activeTag
      : selectedItem.tags[0]
    : undefined;
  const noteTag = noteTagName
    ? tags.find((tag) => tag.name === noteTagName)
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-base-100">
      <div className="border-b border-base-300 p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold tracking-tight">
            Sessions Saved
          </h1>
          <span className="badge badge-neutral badge-sm tabular-nums">
            {items.length}
            {hasMore ? "+" : ""}
          </span>
        </div>

        <PasteButton
          onReady={onPasteReady}
          onError={onPasteError}
          className="btn btn-primary mt-4 w-full"
        >
          Paste
        </PasteButton>

        <div className="mt-3">
          <label htmlFor="responses-search" className="sr-only">
            Search saved responses
          </label>
          <input
            id="responses-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search saved responses…"
            className="input input-bordered w-full"
            autoComplete="off"
          />
        </div>

        <div className="mt-2">
          <label htmlFor="responses-tag-filter" className="sr-only">
            Filter by tag
          </label>
          <select
            id="responses-tag-filter"
            value={activeTag}
            onChange={(event) => onTagChange(event.target.value)}
            className="select select-bordered select-sm w-full"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4" aria-label="Loading saved responses">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="animate-pulse space-y-2">
                <div className="h-3.5 w-4/5 rounded bg-base-300" />
                <div className="h-2.5 w-2/5 rounded bg-base-300/70" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <div role="alert" className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-3 w-full"
              onClick={onRetry}
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={hasFilters ? "🔎" : "📋"}
            title={hasFilters ? "No matches" : "Nothing saved yet"}
            description={
              hasFilters
                ? "Try a different search or tag filter."
                : "Copy an AI answer or note, then click Paste to keep it here."
            }
            action={
              !hasFilters ? (
                <PasteButton
                  onReady={onPasteReady}
                  onError={onPasteError}
                  className="btn btn-primary btn-sm"
                >
                  Paste your first item
                </PasteButton>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-base-300/60">
            {items.map((item) => (
              <SavedItemListItem
                key={item.id}
                item={item}
                active={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
            {hasMore && (
              <div className="p-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {noteTag && (
        <TagNotePanel key={noteTag.id} tag={noteTag} />
      )}
    </div>
  );
}
