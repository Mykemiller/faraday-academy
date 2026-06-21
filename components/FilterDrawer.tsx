"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { FilterState } from "@/lib/types";
import FilterControls, { type FilterHandlers } from "./FilterControls";

// Mobile slide-over (< lg). Escape closes and returns focus to the trigger (spec §11).
export default function FilterDrawer({
  open,
  onClose,
  filters,
  handlers,
  resultCount,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  handlers: FilterHandlers;
  resultCount: number;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <div
        className="absolute inset-0 bg-forest/40"
        onClick={() => {
          onClose();
          triggerRef.current?.focus();
        }}
      />
      <div
        ref={panelRef}
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-warm-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-sage-20 px-4 py-3">
          <h2 className="font-serif text-lg text-forest">Filters</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              onClose();
              triggerRef.current?.focus();
            }}
            aria-label="Close filters"
            className="rounded-md p-1.5 text-forest-90 hover:bg-sage-20"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <FilterControls
            filters={filters}
            handlers={handlers}
            includePersona
            idPrefix="drawer"
          />
        </div>
        <div className="border-t border-sage-20 p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              triggerRef.current?.focus();
            }}
            className="w-full rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-warm-white"
          >
            Show {resultCount} {resultCount === 1 ? "course" : "courses"}
          </button>
        </div>
      </div>
    </div>
  );
}
