"use client";
import { X } from "lucide-react";
import type { Chip } from "@/lib/types";

// Removable active-filter chips + Clear all (spec §4).
export default function ActiveChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: Chip[];
  onRemove: (chip: Chip) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-sage-40 bg-warm-white-card py-1 pl-3 pr-2 text-sm text-forest-90 transition-colors hover:border-sage"
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 text-forest-70 group-hover:text-forest" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-sm font-medium text-forest-70 underline underline-offset-2 hover:text-forest"
      >
        Clear all
      </button>
    </div>
  );
}
