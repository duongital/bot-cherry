import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export default function Toast({
  toast,
  onClose,
}: {
  toast: ToastMessage;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast.id, onClose]);

  const alertClass =
    toast.type === "success"
      ? "alert-success"
      : toast.type === "error"
        ? "alert-error"
        : "alert-info";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 sm:justify-end">
      <div
        role={toast.type === "error" ? "alert" : "status"}
        className={`alert ${alertClass} pointer-events-auto max-w-md shadow-xl`}
      >
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost btn-xs"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
