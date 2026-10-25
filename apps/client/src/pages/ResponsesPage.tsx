import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { itemsApi } from "../lib/api";
import type { CreateItemInput, PasteDraft } from "../lib/types";
import { useSavedItems } from "../hooks/useSavedItems";
import ResponsesSidebar from "../components/responses/ResponsesSidebar";
import SavedItemDetail from "../components/responses/SavedItemDetail";
import SaveItemModal from "../components/responses/SaveItemModal";
import Toast, { type ToastMessage, type ToastType } from "../components/responses/Toast";

export default function ResponsesPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [draft, setDraft] = useState<PasteDraft | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const {
    items,
    tags,
    loading,
    loadingMore,
    error,
    nextCursor,
    loadMore,
    refreshTags,
    prependItem,
    removeItem,
    retry,
  } = useSavedItems(search, activeTag);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ id: Date.now(), type, message });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);

  const handleSave = useCallback(
    async (input: CreateItemInput) => {
      const created = await itemsApi.create(input);
      prependItem(created);
      await refreshTags();
      setDraft(null);
      navigate(`/responses/${created.id}`);
      showToast("success", "Saved to your responses.");
    },
    [navigate, prependItem, refreshTags, showToast],
  );

  const handleDeleted = useCallback(
    (id: string) => {
      removeItem(id);
      if (itemId === id) navigate("/responses", { replace: true });
    },
    [itemId, navigate, removeItem],
  );

  const handleSelect = useCallback(
    (id: string) => {
      navigate(`/responses/${id}`);
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate("/responses");
  }, [navigate]);

  return (
    <div className="dashboard-shell flex min-h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-base-200 text-base-content">
      <aside
        className={`${
          itemId ? "hidden lg:flex" : "flex"
        } h-[calc(100dvh-3.5rem)] w-full shrink-0 flex-col border-r border-base-300 bg-base-100 lg:w-80`}
      >
        <ResponsesSidebar
          items={items}
          tags={tags}
          selectedId={itemId}
          search={search}
          activeTag={activeTag}
          loading={loading}
          loadingMore={loadingMore}
          error={error}
          hasMore={Boolean(nextCursor)}
          onSearchChange={setSearch}
          onTagChange={setActiveTag}
          onSelect={handleSelect}
          onPasteReady={setDraft}
          onPasteError={(message) => showToast("error", message)}
          onLoadMore={() => void loadMore()}
          onRetry={() => void retry()}
        />
      </aside>

      <section
        className={`${
          itemId ? "flex" : "hidden lg:flex"
        } h-[calc(100dvh-3.5rem)] min-w-0 flex-1 flex-col overflow-y-auto bg-base-200`}
      >
        <SavedItemDetail
          itemId={itemId}
          onBack={handleBack}
          onDeleted={handleDeleted}
          onToast={showToast}
        />
      </section>

      {draft && (
        <SaveItemModal
          initialContent={draft.content}
          initialFormat={draft.contentFormat}
          initialTitle={draft.suggestedTitle}
          manual={draft.manual}
          suggestions={tags}
          onClose={() => setDraft(null)}
          onSave={handleSave}
        />
      )}

      {toast && <Toast toast={toast} onClose={closeToast} />}
    </div>
  );
}
