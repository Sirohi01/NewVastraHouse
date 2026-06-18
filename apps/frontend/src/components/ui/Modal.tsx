"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  children,
  onClose,
  open,
  size = "md",
  title,
}: Readonly<{
  children: React.ReactNode;
  onClose: () => void;
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  title: string;
}>) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const firstField = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    firstField?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) {
    return null;
  }

  const sizeClass = {
    lg: "max-w-2xl",
    md: "max-w-lg",
    sm: "max-w-sm",
    xl: "max-w-4xl",
  }[size];

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div
        className={cn(
          "flex max-h-[calc(100vh-32px)] w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lifted",
          sizeClass,
        )}
        ref={panelRef}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            aria-label="Close"
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
