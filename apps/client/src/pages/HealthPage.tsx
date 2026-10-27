import { useCallback, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import HealthChat from "../components/health/HealthChat";
import HealthTracking from "../components/health/HealthTracking";

type HealthTab = "chat" | "tracking";

export default function HealthPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const tab: HealthTab =
    searchParams.get("tab") === "tracking" ? "tracking" : "chat";

  const setTab = useCallback(
    (next: HealthTab) => {
      const params = new URLSearchParams(searchParams);
      if (next === "chat") {
        params.delete("tab");
      } else {
        params.set("tab", next);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleLogSaved = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full flex-col overflow-hidden bg-base-200 text-base-content">
      <div className="flex justify-center border-b border-base-300 bg-base-100 px-3 py-2 md:hidden">
        <div role="tablist" aria-label="Health sections" className="tabs tabs-box">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "chat"}
            onClick={() => setTab("chat")}
            className={`tab ${tab === "chat" ? "tab-active" : ""}`}
          >
            Chat
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "tracking"}
            onClick={() => setTab("tracking")}
            className={`tab ${tab === "tracking" ? "tab-active" : ""}`}
          >
            Tracking
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Health chat"
          className={`${
            tab === "chat" ? "flex" : "hidden"
          } min-h-0 w-full flex-1 flex-col md:flex`}
        >
          <HealthChat
            initialConversationId={conversationId ?? null}
            onLogSaved={handleLogSaved}
            onViewTracking={() => setTab("tracking")}
          />
        </section>

        <section
          aria-label="Symptom tracking"
          className={`${
            tab === "tracking" ? "flex" : "hidden"
          } min-h-0 w-full flex-col border-base-300 md:flex md:w-[420px] md:shrink-0 md:border-l lg:w-[480px]`}
        >
          <HealthTracking
            version={version}
            onGoToChat={() => setTab("chat")}
          />
        </section>
      </div>
    </div>
  );
}
