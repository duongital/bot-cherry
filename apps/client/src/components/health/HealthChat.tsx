import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { healthApi } from "../../lib/api";
import { formatSavedDate } from "../../lib/date";
import type {
  HealthConversation,
  HealthMessage,
  SymptomForm,
  SymptomLog,
} from "../../lib/types";
import SymptomFormCard from "./SymptomFormCard";

function messageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HealthChat({
  initialConversationId,
  onLogSaved,
  onViewTracking,
}: {
  initialConversationId: string | null;
  onLogSaved: (log: SymptomLog) => void;
  onViewTracking: () => void;
}) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<HealthConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [activeTitle, setActiveTitle] = useState("New chat");
  const [messages, setMessages] = useState<HealthMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations: rows } = await healthApi.listConversations();
      setConversations(rows);
    } catch {
      // History is non-critical; the chat still works without it.
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, sending, loadingConversation]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [draft]);

  function startNewChat() {
    if (initialConversationId) navigate("/health");
    setActiveConversationId(null);
    setActiveTitle("New chat");
    setMessages([]);
    setDraft("");
    setError(null);
    setHistoryOpen(false);
    textareaRef.current?.focus();
  }

  async function loadConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setLoadingConversation(true);
    setError(null);
    try {
      const result = await healthApi.getMessages(conversationId);
      setMessages(result.messages);
      setActiveTitle(result.conversation.title);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the conversation.",
      );
    } finally {
      setLoadingConversation(false);
    }
  }

  useEffect(() => {
    if (!initialConversationId) {
      if (activeConversationId) {
        setActiveConversationId(null);
        setActiveTitle("New chat");
        setMessages([]);
        setError(null);
      }
      return;
    }

    if (initialConversationId === activeConversationId) return;
    void loadConversation(initialConversationId);
    // loadConversation intentionally reads the latest route id only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, activeConversationId]);

  function openConversation(conversation: HealthConversation) {
    setHistoryOpen(false);
    setActiveTitle(conversation.title);
    navigate(`/health/${encodeURIComponent(conversation.id)}`);
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setDraft("");
    try {
      const result = await healthApi.analyze({
        ...(activeConversationId
          ? { conversationId: activeConversationId }
          : {}),
        message: text,
      });
      setActiveConversationId(result.conversationId);
      navigate(`/health/${encodeURIComponent(result.conversationId)}`, {
        replace: true,
      });
      setMessages((current) => [
        ...current,
        result.userMessage,
        result.assistantMessage,
      ]);
      setActiveTitle(
        activeConversationId
          ? activeTitle
          : text.replace(/\s+/g, " ").slice(0, 60).trim() || "Health chat",
      );
      void refreshConversations();
    } catch (err) {
      setDraft(text);
      setError(
        err instanceof Error
          ? err.message
          : "The health assistant could not respond. Try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleLogSaved(
    messageId: string,
    log: SymptomLog,
    form: SymptomForm,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, logId: log.id, form }
          : message,
      ),
    );
    onLogSaved(log);
    void refreshConversations();
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-300 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-base-content">
            {activeTitle}
          </h1>
          <p className="text-[11px] text-base-content/50">
            Symptom logging, not diagnosis
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen((value) => !value)}
          aria-expanded={historyOpen}
          className="btn btn-ghost btn-sm border-base-300"
        >
          History
        </button>
        <button
          type="button"
          onClick={startNewChat}
          className="btn btn-primary btn-sm"
        >
          New chat
        </button>
      </div>

      {historyOpen && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close history"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 z-10 cursor-default bg-base-content/10"
          />
          <div className="absolute right-3 top-16 z-20 w-80 max-w-[calc(100%-1.5rem)] rounded-box border border-base-300 bg-base-100 p-2 shadow-2xl">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Past conversations
              </span>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history"
                className="btn btn-ghost btn-xs"
              >
                ✕
              </button>
            </div>

            <ul className="max-h-80 overflow-y-auto">
              {loadingHistory && (
                <li className="flex justify-center p-4">
                  <span className="loading loading-spinner loading-sm" />
                </li>
              )}
              {!loadingHistory && conversations.length === 0 && (
                <li className="p-3 text-sm text-base-content/60">
                  No past conversations yet.
                </li>
              )}
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => void openConversation(conversation)}
                    className={`w-full rounded-field px-3 py-2 text-left transition-colors hover:bg-base-200 ${
                      activeConversationId === conversation.id
                        ? "bg-base-200"
                        : ""
                    }`}
                  >
                    <span className="block truncate text-sm font-medium text-base-content">
                      {conversation.title}
                    </span>
                    <span className="text-xs text-base-content/50">
                      {formatSavedDate(conversation.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {loadingConversation ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-base-content/60">
            <span className="loading loading-spinner loading-sm" />
            Loading conversation…
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
            <div className="text-4xl" aria-hidden="true">
              🌿
            </div>
            <h2 className="text-lg font-semibold text-base-content">
              How are you feeling?
            </h2>
            <p className="text-sm leading-relaxed text-base-content/60">
              Describe your symptoms in your own words. You will get a yes/no
              checklist to confirm before anything is saved.
            </p>
            <div className="mt-2 flex flex-col gap-2 text-left">
              {[
                "Woke up with a headache, a bit dizzy after lunch, slept badly, no fever but my throat is scratchy.",
                "My stomach hurts and I felt nauseous this morning.",
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setDraft(example);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-field border border-base-300 bg-base-200/60 px-3 py-2 text-left text-xs leading-relaxed text-base-content/70 transition-colors hover:bg-base-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat ${
                  message.role === "user" ? "chat-end" : "chat-start"
                }`}
              >
                <div className="chat-header text-[11px] text-base-content/50">
                  {message.role === "user" ? "You" : "Health assistant"}
                  <time className="ml-1.5">{messageTime(message.createdAt)}</time>
                </div>
                <div
                  className={`chat-bubble max-w-[92%] whitespace-pre-wrap text-sm sm:max-w-lg ${
                    message.role === "user"
                      ? "chat-bubble-primary"
                      : "chat-bubble-neutral"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "assistant" && message.form && (
                  <div className="chat-footer block w-full max-w-[92%] sm:max-w-xl">
                    <SymptomFormCard
                      message={message}
                      onSaved={(log, form) =>
                        handleLogSaved(message.id, log, form)
                      }
                      onViewTracking={onViewTracking}
                    />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="chat chat-start">
                <div className="chat-header text-[11px] text-base-content/50">
                  Health assistant
                </div>
                <div className="chat-bubble chat-bubble-neutral flex items-center gap-2 text-sm">
                  <span className="loading loading-dots loading-sm" />
                  Analyzing your symptoms…
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-base-300 bg-base-100 p-3 sm:p-4">
        {error && (
          <p role="alert" className="mb-2 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            rows={1}
            maxLength={4000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Describe how you feel…"
            aria-label="Message the health assistant"
            className="textarea textarea-bordered max-h-40 min-h-11 w-full resize-none text-sm"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={sending || draft.trim().length === 0}
            className="btn btn-primary h-11 min-h-11 px-4"
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Send"
            )}
          </button>
        </div>
        <p className="mx-auto mt-1.5 max-w-3xl text-[11px] text-base-content/45">
          This tool helps you log symptoms. It does not provide a diagnosis. For
          severe or urgent symptoms, contact a professional.
        </p>
      </div>
    </div>
  );
}
