import type {
  AnalyzeHealthResponse,
  CreateItemInput,
  CreateSymptomLogInput,
  HealthConversation,
  HealthMessage,
  ItemListResponse,
  SavedItem,
  SavedItemSummary,
  SymptomLog,
  SymptomStat,
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

export const healthApi = {
  analyze(input: {
    conversationId?: string;
    message: string;
  }): Promise<AnalyzeHealthResponse> {
    return apiFetch<AnalyzeHealthResponse>("/api/health/analyze", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  listConversations(cursor?: string): Promise<{
    conversations: HealthConversation[];
    nextCursor: string | null;
  }> {
    const query = cursor
      ? `?cursor=${encodeURIComponent(cursor)}`
      : "";
    return apiFetch(`/api/health/conversations${query}`);
  },

  createConversation(): Promise<HealthConversation> {
    return apiFetch<HealthConversation>("/api/health/conversations", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getMessages(conversationId: string): Promise<{
    conversation: HealthConversation;
    messages: HealthMessage[];
  }> {
    return apiFetch(
      `/api/health/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
  },

  deleteConversation(conversationId: string): Promise<void> {
    return apiFetch<void>(
      `/api/health/conversations/${encodeURIComponent(conversationId)}`,
      { method: "DELETE" },
    );
  },

  createLog(input: CreateSymptomLogInput): Promise<{ log: SymptomLog }> {
    return apiFetch<{ log: SymptomLog }>("/api/health/logs", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  listLogs(params: {
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  } = {}): Promise<{
    logs: SymptomLog[];
    nextCursor: string | null;
  }> {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.size ? `?${query.toString()}` : "";
    return apiFetch(`/api/health/logs${suffix}`);
  },

  deleteLog(logId: string): Promise<void> {
    return apiFetch<void>(
      `/api/health/logs/${encodeURIComponent(logId)}`,
      { method: "DELETE" },
    );
  },

  stats(days = 30): Promise<{ days: number; stats: SymptomStat[] }> {
    return apiFetch(`/api/health/symptoms/stats?days=${days}`);
  },
};
