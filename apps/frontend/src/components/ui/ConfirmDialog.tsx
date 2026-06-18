"use client";

import { Modal } from "@/components/ui/Modal";

export function ConfirmDialog({
  confirmLabel = "Confirm",
  danger = true,
  message,
  onCancel,
  onConfirm,
  open,
  title,
}: Readonly<{
  confirmLabel?: string;
  danger?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}>) {
  return (
    <Modal onClose={onCancel} open={open} size="sm" title={title}>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          className="h-9 rounded-md border border-border px-3 text-sm font-semibold"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={`h-9 rounded-md px-3 text-sm font-semibold text-white ${
            danger ? "bg-destructive" : "bg-primary"
          }`}
          onClick={onConfirm}
          type="button"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
