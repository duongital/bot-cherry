import type {
  CreateItemInput,
  ItemListResponse,
  SavedItem,
  SavedItemSummary,
  Tag,
  TagNote,
} from "./types";

const API_BASE = (
  import.meta.env.VITE_API_URL ??
  import.meta.env.VITE_BETTER_AUTH_URL ??
  "http://localhost:8787"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string } } | undefined)
      ?.error;
    throw new ApiError(
      error?.message ?? `Request failed with status ${res.status}`,
      res.status,
      error?.code,
    );
  }

  if (res.status === 204) return undefined as T;
  return data as T;
}

export interface ListItemsParams {
  q?: string;
  tag?: string;
  limit?: number;
  cursor?: string;
}

export const itemsApi = {
  list(params: ListItemsParams = {}): Promise<ItemListResponse> {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.tag) query.set("tag", params.tag);
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    const suffix = query.size ? `?${query.toString()}` : "";
    return apiFetch<ItemListResponse>(`/api/items${suffix}`);
  },

  get(id: string): Promise<SavedItem> {
    return apiFetch<SavedItem>(`/api/items/${encodeURIComponent(id)}`);
  },

  create(input: CreateItemInput): Promise<SavedItemSummary> {
    return apiFetch<SavedItemSummary>("/api/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: CreateItemInput): Promise<SavedItem> {
    return apiFetch<SavedItem>(`/api/items/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/items/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};

export const tagsApi = {
  list(): Promise<{ tags: Tag[] }> {
    return apiFetch<{ tags: Tag[] }>("/api/tags");
  },

  getNote(tagId: string): Promise<{ note: TagNote }> {
    return apiFetch<{ note: TagNote }>(
      `/api/tags/${encodeURIComponent(tagId)}/note`,
    );
  },

  saveNote(tagId: string, content: string): Promise<{ note: TagNote }> {
    return apiFetch<{ note: TagNote }>(
      `/api/tags/${encodeURIComponent(tagId)}/note`,
      {
        method: "PUT",
        body: JSON.stringify({ content }),
      },
    );
  },
};
