export type ContentFormat = "markdown" | "plain";

export interface SavedItemSummary {
  id: string;
  title: string;
  contentFormat: ContentFormat;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedItem extends SavedItemSummary {
  content: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface TagNote {
  tagId: string;
  content: string;
  updatedAt: string | null;
}

export interface ItemListResponse {
  items: SavedItemSummary[];
  nextCursor: string | null;
}

export interface CreateItemInput {
  title: string;
  content: string;
  contentFormat: ContentFormat;
  tags: string[];
}

export interface PasteDraft {
  content: string;
  contentFormat: ContentFormat;
  suggestedTitle: string;
  manual: boolean;
}
