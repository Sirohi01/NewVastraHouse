"use client";

import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "vastra-pre-order-announcement-dismissed";

export function PreOrderAnnouncementModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(window.localStorage.getItem(storageKey) !== "true");
  }, []);

  function dismiss() {
    window.localStorage.setItem(storageKey, "true");
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2e0c12]/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-sm border border-[#caa14e]/70 bg-[#fffaf1] p-6 shadow-[0_28px_80px_-34px_rgba(46,12,18,0.9)]">
        <button
          aria-label="Close pre-order announcement"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-[#e1d6c4] text-[#6e1423] transition-colors hover:bg-[#6e1423] hover:text-white"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
        <div className="pr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b6d35]">
            Pre-orders are open
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-[#3d1620]">
            We are bringing limited pre-order drops first.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#6f6256]">
            Browse the full catalog, choose eligible pieces, and book them through pre-order with
            clear dispatch and delivery dates.
          </p>
        </div>
        <a
          className="mt-6 inline-flex h-11 items-center gap-2 bg-[#6e1423] px-5 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#84182c]"
          href="/pre-order"
          onClick={dismiss}
        >
          View Pre-Orders <ArrowRight aria-hidden="true" size={15} />
        </a>
      </div>
    </div>
  );
}
