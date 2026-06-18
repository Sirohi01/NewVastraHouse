"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "error" | "info" | "success";
type ToastEntry = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  error: (message: string) => void;
  info: (message: string) => void;
  success: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const kindStyles: Record<ToastKind, { icon: typeof Info; className: string }> = {
  error: {
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
  info: { className: "border-border bg-card text-foreground", icon: Info },
  success: { className: "border-success/40 bg-success/10 text-success", icon: CheckCircle2 },
};

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++counter.current;
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      error: (message) => push("error", message),
      info: (message) => push("info", message),
      success: (message) => push("success", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-3 top-3 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const style = kindStyles[toast.kind];
          const Icon = style.icon;

          return (
            <div
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-lifted ${style.className}`}
              key={toast.id}
              role="status"
            >
              <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
              <p className="flex-1 leading-5">{toast.message}</p>
              <button
                aria-label="Dismiss"
                className="shrink-0 opacity-60 hover:opacity-100"
                onClick={() => dismiss(toast.id)}
                type="button"
              >
                <X aria-hidden="true" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  return error instanceof Error ? error.message : fallback;
}
