import { authClient } from "./auth-client";
import { API_URL, APP_ORIGIN } from "./env";
import type {
  CreateItemInput,
  ItemListResponse,
  SavedItem,
  SavedItemSummary,
  Tag,
  TagNote,
} from "./types";

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

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = await authClient.getCookie();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("expo-origin", APP_ORIGIN);
  if (init.body) headers.set("Content-Type", "application/json");
  if (cookie) headers.set("Cookie", cookie);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: "omit",
    });

    const text = await res.text();
    const data = text ? safeJsonParse(text) : undefined;

    if (!res.ok) {
      const error = (
        data as { error?: { code?: string; message?: string } } | undefined
      )?.error;
      throw new ApiError(
        error?.message ?? `Request failed with status ${res.status}`,
        res.status,
        error?.code,
      );
    }

    if (res.status === 204) return undefined as T;
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error | undefined)?.name === "AbortError") {
      throw new ApiError("The request timed out. Try again.", 0, "TIMEOUT");
    }
    throw new ApiError(
      "Could not reach the server. Check your connection.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeout);
  }
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
