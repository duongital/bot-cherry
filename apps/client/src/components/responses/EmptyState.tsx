import type { ReactNode } from "react";

export default function EmptyState({
  icon = "🍒",
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-base-content/60">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
