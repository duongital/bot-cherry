import { useEffect, useState } from "react";
import { healthApi } from "../../lib/api";
import { localDateString } from "../../lib/date";
import type {
  HealthMessage,
  SymptomForm,
  SymptomLog,
  SymptomSeverity,
} from "../../lib/types";

interface EditableItem {
  key: string;
  symptom: string;
  present: boolean;
  suggested: boolean;
  severity: SymptomSeverity | undefined;
  note: string;
}

const SEVERITIES: SymptomSeverity[] = [1, 2, 3, 4, 5];

function toEditableItems(form: SymptomForm): EditableItem[] {
  return form.items.map((item) => ({
    key: crypto.randomUUID(),
    symptom: item.symptom,
    present: item.present,
    suggested: item.suggested,
    severity: item.severity,
    note: "",
  }));
}

export default function SymptomFormCard({
  message,
  onSaved,
  onViewTracking,
}: {
  message: HealthMessage;
  onSaved: (log: SymptomLog, form: SymptomForm) => void;
  onViewTracking: () => void;
}) {
  const form = message.form;
  const [items, setItems] = useState<EditableItem[]>(() =>
    form ? toEditableItems(form) : [],
  );
  const [customSymptom, setCustomSymptom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = Boolean(message.logId);

  useEffect(() => {
    if (form) setItems(toEditableItems(form));
  }, [message.id, message.logId, form]);

  if (!form) return null;

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function addSymptom() {
    const symptom = customSymptom.trim().slice(0, 64);
    if (!symptom) return;
    if (items.some((item) => item.symptom.toLowerCase() === symptom.toLowerCase())) {
      setCustomSymptom("");
      return;
    }
    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        symptom,
        present: true,
        suggested: false,
        severity: undefined,
        note: "",
      },
    ]);
    setCustomSymptom("");
  }

  async function handleDone() {
    if (!form || saving) return;
    const entries = items
      .map((item) => ({
        symptom: item.symptom.trim(),
        present: item.present,
        ...(item.present && item.severity
          ? { severity: item.severity }
          : {}),
        ...(item.note.trim() ? { note: item.note.trim() } : {}),
      }))
      .filter((entry) => entry.symptom.length > 0);

    if (entries.length === 0) {
      setError("Add at least one symptom before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { log } = await healthApi.createLog({
        conversationId: message.conversationId,
        messageId: message.id,
        logDate: localDateString(),
        entries,
      });
      onSaved(log, {
        message: form.message,
        items: entries.map((entry) => ({
          symptom: entry.symptom,
          present: entry.present,
          suggested: false,
          ...(entry.severity ? { severity: entry.severity } : {}),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the log.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    const present = form.items.filter((item) => item.present);
    const absent = form.items.filter((item) => !item.present);
    return (
      <div className="mt-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-success badge-sm px-2.5">Saved</span>
            <span className="text-xs text-base-content/60">
              Symptom log for today
            </span>
          </div>
          <button
            type="button"
            onClick={onViewTracking}
            className="btn btn-ghost btn-xs"
          >
            View in Tracking
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {present.length === 0 && (
            <span className="text-sm text-base-content/60">
              No symptoms marked as present.
            </span>
          )}
          {present.map((item) => (
            <span key={item.symptom} className="badge badge-primary badge-sm px-2.5 gap-1">
              {item.symptom}
              {item.severity ? (
                <span className="opacity-75">· {item.severity}/5</span>
              ) : null}
            </span>
          ))}
        </div>

        {absent.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-base-content/60">
              {absent.length} symptom{absent.length === 1 ? "" : "s"} marked no
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {absent.map((item) => (
                <span
                  key={item.symptom}
                  className="badge badge-ghost badge-sm px-2.5 line-through opacity-70"
                >
                  {item.symptom}
                </span>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
        Confirm your symptoms
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-field border border-base-300/70 bg-base-200/40 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium capitalize text-base-content">
                  {item.symptom}
                </p>
                {item.suggested && (
                  <span className="text-[11px] text-base-content/50">
                    Suggested
                  </span>
                )}
              </div>

              <div className="join">
                <button
                  type="button"
                  aria-pressed={item.present}
                  onClick={() => updateItem(item.key, { present: true })}
                  className={`btn join-item btn-xs ${
                    item.present ? "btn-success" : "btn-ghost border-base-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  aria-pressed={!item.present}
                  onClick={() =>
                    updateItem(item.key, { present: false, severity: undefined })
                  }
                  className={`btn join-item btn-xs ${
                    !item.present ? "btn-error" : "btn-ghost border-base-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {item.present && (
                <label className="flex items-center gap-2 text-xs text-base-content/60">
                  Severity
                  <select
                    value={item.severity ?? ""}
                    onChange={(event) =>
                      updateItem(item.key, {
                        severity: event.target.value
                          ? (Number(event.target.value) as SymptomSeverity)
                          : undefined,
                      })
                    }
                    className="select select-bordered select-xs w-24"
                  >
                    <option value="">Not set</option>
                    {SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}/5
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <input
                type="text"
                value={item.note}
                maxLength={500}
                onChange={(event) =>
                  updateItem(item.key, { note: event.target.value })
                }
                placeholder="Note (optional)"
                className="input input-bordered input-xs min-w-0 flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={customSymptom}
          maxLength={64}
          onChange={(event) => setCustomSymptom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSymptom();
            }
          }}
          placeholder="Add symptom"
          className="input input-bordered input-sm min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={addSymptom}
          className="btn btn-ghost btn-sm border-base-300"
        >
          + Add symptom
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleDone()}
          disabled={saving || items.length === 0}
          className="btn btn-primary btn-sm"
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              Saving…
            </>
          ) : (
            "Done"
          )}
        </button>
      </div>
    </div>
  );
}
