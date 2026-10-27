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

export type SymptomSeverity = 1 | 2 | 3 | 4 | 5;

export interface SymptomFormItem {
  symptom: string;
  present: boolean;
  suggested: boolean;
  severity?: SymptomSeverity;
}

export interface SymptomForm {
  message: string;
  items: SymptomFormItem[];
}

export interface HealthMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  form: SymptomForm | null;
  logId: string | null;
  createdAt: string;
}

export interface HealthConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomLogEntry {
  id: string;
  logId?: string;
  symptom: string;
  present: boolean;
  severity: number | null;
  note: string | null;
}

export interface SymptomLog {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  logDate: string;
  rawInput: string;
  createdAt: string;
  entries: SymptomLogEntry[];
}

export interface SymptomStat {
  symptom: string;
  count: number;
}

export interface AnalyzeHealthResponse {
  conversationId: string;
  userMessage: HealthMessage;
  assistantMessage: HealthMessage;
}

export interface CreateSymptomLogInput {
  conversationId: string;
  messageId: string;
  logDate: string;
  entries: Array<{
    symptom: string;
    present: boolean;
    severity?: SymptomSeverity;
    note?: string;
  }>;
}
