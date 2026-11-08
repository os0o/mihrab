"use client";

import { X } from "lucide-react";
import { useToasts } from "@/store/toasts";

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-md flex-col gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-base/95 p-4 shadow-xl backdrop-blur-xl"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.run();
                  dismiss(t.id);
                }}
                className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
              >
                {t.action.label}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="إغلاق التنبيه"
            className="-m-1 rounded-full p-2 text-muted hover:text-fg"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
