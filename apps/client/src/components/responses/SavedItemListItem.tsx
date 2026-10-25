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
          ? "border-primary bg-base-200"
          : "border-transparent hover:bg-base-200/65"
      }`}
    >
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-base-content">
        {item.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-content/55">
        {item.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="max-w-28 truncate rounded-full bg-base-300/70 px-2 py-0.5 text-[0.68rem] text-base-content/75"
          >
            #{tag}
          </span>
        ))}
        {item.tags.length > 3 && (
          <span className="text-[0.68rem]">+{item.tags.length - 3}</span>
        )}
        <span className="ml-auto whitespace-nowrap text-[0.68rem]">
          saved {formatSavedDate(item.createdAt)}
        </span>
      </div>
    </button>
  );
}
