"use client";
import type { ReactNode } from "react";

// Shared segmented control used by Price and Duration filters.
export default function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { key: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-xs uppercase tracking-wider text-forest-70">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={legend}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.key)}
              className={[
                "rounded-md px-3 py-1.5 text-sm border transition-colors",
                active
                  ? "bg-forest text-warm-white border-forest"
                  : "bg-warm-white-card text-forest-90 border-sage-40 hover:border-sage",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
