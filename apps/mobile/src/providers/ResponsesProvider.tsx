import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSavedItems } from "@/hooks/useSavedItems";
import type { SavedItemSummary, Tag } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface ResponsesContextValue {
  items: SavedItemSummary[];
  tags: Tag[];
  search: string;
  activeTag: string;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  nextCursor: string | null;
  setSearch: (value: string) => void;
  setActiveTag: (value: string) => void;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshTags: () => Promise<void>;
  prependItem: (item: SavedItemSummary) => void;
  removeItem: (id: string) => void;
}

const ResponsesContext = createContext<ResponsesContextValue | null>(null);

export function ResponsesProvider({ children }: { children: ReactNode }) {
  const { handleUnauthorized } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const savedItems = useSavedItems(search, activeTag, handleUnauthorized);

  const value = useMemo<ResponsesContextValue>(
    () => ({
      ...savedItems,
      search,
      activeTag,
      setSearch,
      setActiveTag,
    }),
    [activeTag, savedItems, search],
  );

  return (
    <ResponsesContext.Provider value={value}>
      {children}
    </ResponsesContext.Provider>
  );
}

export function useResponses() {
  const context = useContext(ResponsesContext);
  if (!context) {
    throw new Error("useResponses must be used inside ResponsesProvider");
  }
  return context;
}
