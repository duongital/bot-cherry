import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import {
  normalizeSymptomForm,
  symptomFormSchema,
  type SymptomForm,
} from "../lib/health";

const DEFAULT_MODEL = "deepseek-v4-flash";

const SYSTEM_PROMPT = `You are a symptom-logging assistant, not a doctor. Extract the symptoms a person reports from their message.

Rules:
- Never diagnose, explain causes, or recommend medication. Only extract and acknowledge symptoms.
- Mark symptoms the person explicitly mentioned (or strongly implied) as suggested: false and present: true when they clearly have it.
- Add 2-4 closely related common symptoms the person might want to confirm. Mark those suggested: true and present: false unless they were mentioned.
- Use short, lowercase symptom names (for example "headache", "dizziness", "sore throat").
- Include severity (1-5) only when it is clearly implied; otherwise omit it.
- The acknowledgement message must be at most two sentences and at most 300 characters.
- If the person mentions red-flag symptoms such as chest pain, difficulty breathing, severe bleeding, fainting, or sudden weakness, add a short urgent-care disclaimer recommending a professional.
- Return only the structured object requested by the schema.`;

export class HealthAnalysisError extends Error {
  readonly code = "LLM_INVALID_RESPONSE";

  constructor(message = "The health assistant returned an invalid response") {
    super(message);
    this.name = "HealthAnalysisError";
  }
}

export interface AnalyzeOptions {
  apiKey: string;
  model?: string;
}

export async function analyzeSymptoms(
  text: string,
  options: AnalyzeOptions,
): Promise<SymptomForm> {
  const deepseek = createDeepSeek({ apiKey: options.apiKey });
  const model = deepseek(options.model?.trim() || DEFAULT_MODEL);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { object } = await generateObject({
        model,
        schema: symptomFormSchema,
        system: SYSTEM_PROMPT,
        prompt: text,
        temperature: 0.1,
        maxRetries: 0,
      });
      return normalizeSymptomForm(object);
    } catch (error) {
      lastError = error;
    }
  }

  throw new HealthAnalysisError(
    lastError instanceof Error ? lastError.message : undefined,
  );
}
