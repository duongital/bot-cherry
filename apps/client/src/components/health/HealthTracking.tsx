import { useCallback, useEffect, useMemo, useState } from "react";
import { healthApi } from "../../lib/api";
import { formatLogDate, formatSavedDate } from "../../lib/date";
import type { SymptomLog, SymptomStat } from "../../lib/types";

function groupByDate(logs: SymptomLog[]): Array<[string, SymptomLog[]]> {
  const groups = new Map<string, SymptomLog[]>();
  for (const log of logs) {
    const list = groups.get(log.logDate) ?? [];
    list.push(log);
    groups.set(log.logDate, list);
  }
  return Array.from(groups.entries());
}

export default function HealthTracking({
  version,
  onGoToChat,
}: {
  version: number;
  onGoToChat: () => void;
}) {
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [stats, setStats] = useState<SymptomStat[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logResult, statResult] = await Promise.all([
        healthApi.listLogs({ limit: 30 }),
        healthApi.stats(30),
      ]);
      setLogs(logResult.logs);
      setNextCursor(logResult.nextCursor);
      setStats(statResult.stats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your tracking.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await healthApi.listLogs({ cursor: nextCursor, limit: 30 });
      setLogs((current) => [...current, ...result.logs]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load more logs.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  const groups = useMemo(() => groupByDate(logs), [logs]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-base-100">
      <div className="border-b border-base-300 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-base-content">Tracking</h2>
        <p className="text-[11px] text-base-content/50">
          Saved symptom logs, grouped by day
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-sm" />
            Loading tracking…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <div role="alert" className="alert alert-error alert-sm">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="btn btn-ghost btn-xs"
                >
                  Retry
                </button>
              </div>
            )}

            <section className="rounded-box border border-base-300 bg-base-200/50 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                  Last 30 days
                </h3>
                <span className="text-[11px] text-base-content/45">
                  {logs.length === 0
                    ? "No logs yet"
                    : `${logs.length} recent log${logs.length === 1 ? "" : "s"}`}
                </span>
              </div>
              {stats.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stats.slice(0, 10).map((stat) => (
                    <span
                      key={stat.symptom}
                      className="badge badge-outline badge-sm px-2.5 capitalize"
                    >
                      {stat.symptom}
                      <span className="ml-1 font-semibold">×{stat.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-base-content/55">
                  Symptom counts will appear here after you save a log with
                  symptoms marked as present.
                </p>
              )}
            </section>

            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 px-6 py-12 text-center">
                <div className="text-4xl" aria-hidden="true">
                  📝
                </div>
                <h3 className="text-base font-semibold text-base-content">
                  No symptom logs yet
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-base-content/60">
                  Describe how you feel in the Chat tab, confirm the symptom
                  checklist, and your logs will show up here.
                </p>
                <button
                  type="button"
                  onClick={onGoToChat}
                  className="btn btn-primary btn-sm"
                >
                  Go to Chat
                </button>
              </div>
            ) : (
              groups.map(([date, dateLogs]) => (
                <section key={date} className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                    {formatLogDate(date)}
                  </h3>
                  {dateLogs.map((log) => {
                    const present = log.entries.filter((entry) => entry.present);
                    const absent = log.entries.filter((entry) => !entry.present);
                    return (
                      <article
                        key={log.id}
                        className="rounded-box border border-base-300 bg-base-100 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="line-clamp-2 text-sm text-base-content/75"
                            title={log.rawInput}
                          >
                            “{log.rawInput}”
                          </p>
                          <time className="shrink-0 text-[11px] text-base-content/45">
                            {formatSavedDate(log.createdAt)}
                          </time>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {present.length === 0 && (
                            <span className="badge badge-ghost badge-sm px-2.5">
                              No symptoms present
                            </span>
                          )}
                          {present.map((entry) => (
                            <span
                              key={entry.id}
                              title={entry.note ?? undefined}
                              className="badge badge-primary badge-sm px-2.5 capitalize"
                            >
                              {entry.symptom}
                              {entry.severity ? (
                                <span className="ml-1 opacity-75">
                                  · {entry.severity}/5
                                </span>
                              ) : null}
                            </span>
                          ))}
                        </div>

                        {present.some((entry) => entry.note) && (
                          <ul className="mt-2 space-y-1">
                            {present
                              .filter((entry) => entry.note)
                              .map((entry) => (
                                <li
                                  key={`${entry.id}-note`}
                                  className="text-xs text-base-content/60"
                                >
                                  <span className="font-medium capitalize">
                                    {entry.symptom}:
                                  </span>{" "}
                                  {entry.note}
                                </li>
                              ))}
                          </ul>
                        )}

                        {absent.length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-[11px] font-medium text-base-content/50">
                              {absent.length} symptom
                              {absent.length === 1 ? "" : "s"} not present
                            </summary>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {absent.map((entry) => (
                                <span
                                  key={entry.id}
                                  className="badge badge-ghost badge-sm px-2.5 capitalize line-through opacity-70"
                                >
                                  {entry.symptom}
                                </span>
                              ))}
                            </div>
                          </details>
                        )}
                      </article>
                    );
                  })}
                </section>
              ))
            )}

            {nextCursor && (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="btn btn-ghost btn-sm border-base-300"
              >
                {loadingMore ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    Loading…
                  </>
                ) : (
                  "Load more logs"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
