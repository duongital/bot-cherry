import { formatSavedDate } from "../../lib/date";
import type { SavedItemSummary } from "../../lib/types";

export default function SavedItemListItem({
  item,
  active,
  onSelect,
}: {
  item: SavedItemSummary;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      className={`block w-full cursor-pointer border-l-[3px] px-4 py-3 text-left transition-colors ${
        active
          ? "border-l-primary bg-base-200"
          : "border-l-transparent hover:bg-base-200/65"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="line-clamp-2 min-w-0 text-sm font-semibold leading-snug text-base-content">
            {item.title}
          </h3>
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="max-w-28 shrink-0 truncate rounded-full bg-base-300/70 px-2 py-0.5 text-[0.68rem] text-base-content/75"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="shrink-0 text-[0.68rem] text-base-content/55">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
        <span className="shrink-0 whitespace-nowrap pt-0.5 text-[0.68rem] text-base-content/55">
          saved {formatSavedDate(item.createdAt)}
        </span>
      </div>
    </button>
  );
}
