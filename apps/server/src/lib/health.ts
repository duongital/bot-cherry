import { z } from "zod";

export const MAX_SYMPTOM_LENGTH = 64;
export const MAX_FORM_ITEMS = 20;
export const MAX_LOG_ENTRIES = 30;
export const MAX_NOTE_LENGTH = 500;
export const MAX_MESSAGE_LENGTH = 4_000;

export const severitySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const symptomFormItemSchema = z.object({
  symptom: z.string().trim().min(1).max(MAX_SYMPTOM_LENGTH),
  present: z.boolean(),
  suggested: z.boolean(),
  severity: severitySchema.optional(),
});

export const symptomFormSchema = z.object({
  message: z.string().trim().min(1).max(300),
  items: z.array(symptomFormItemSchema).min(1).max(MAX_FORM_ITEMS),
});

export type SymptomFormItem = z.infer<typeof symptomFormItemSchema>;
export type SymptomForm = z.infer<typeof symptomFormSchema>;

export function normalizeSymptomName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .slice(0, MAX_SYMPTOM_LENGTH);
}

export function normalizeSymptomForm(form: SymptomForm): SymptomForm {
  const seen = new Set<string>();
  const items: SymptomFormItem[] = [];

  for (const item of form.items) {
    const symptom = normalizeSymptomName(item.symptom);
    if (!symptom || seen.has(symptom)) continue;
    seen.add(symptom);
    items.push({
      symptom,
      present: item.present,
      suggested: item.suggested,
      ...(item.present && item.severity ? { severity: item.severity } : {}),
    });
  }

  return {
    message: form.message.trim().slice(0, 300),
    items: items.slice(0, MAX_FORM_ITEMS),
  };
}

export const analyzeRequestSchema = z.object({
  conversationId: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});

export const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const createLogEntrySchema = z.object({
  symptom: z.string().trim().min(1).max(MAX_SYMPTOM_LENGTH),
  present: z.boolean(),
  severity: severitySchema.optional(),
  note: z.string().trim().max(MAX_NOTE_LENGTH).optional(),
});

export const createLogSchema = z.object({
  conversationId: z.string().trim().min(1),
  messageId: z.string().trim().min(1),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  entries: z.array(createLogEntrySchema).min(1).max(MAX_LOG_ENTRIES),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;

export function toHealthConversation(row: {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toHealthMessage(row: {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  form: unknown;
  logId: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as "user" | "assistant",
    content: row.content,
    form: (row.form as SymptomForm | null) ?? null,
    logId: row.logId,
    createdAt: row.createdAt.toISOString(),
  };
}
