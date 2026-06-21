"use client";
import type { Persona } from "@/lib/types";
import { PERSONAS } from "@/lib/constants";

// "I'm a…" discovery lens (spec §3). A lens, never a gate (§13.5).
export default function PersonaSwitcher({
  value,
  onChange,
  idPrefix = "persona",
}: {
  value: Persona | null;
  onChange: (p: Persona | null) => void;
  idPrefix?: string;
}) {
  const options: { label: string; val: Persona | null }[] = [
    { label: "Everyone", val: null },
    ...PERSONAS.map((p) => ({ label: p, val: p })),
  ];
  return (
    <div
      role="group"
      aria-label="I'm a…"
      className="flex flex-wrap gap-1.5"
    >
      {options.map(({ label, val }) => {
        const active = value === val;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(val)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              active
                ? "bg-forest text-warm-white border-forest"
                : "bg-transparent text-forest-90 border-sage-40 hover:border-sage",
            ].join(" ")}
          >
            {val === null ? label : `I'm a ${label}`}
          </button>
        );
      })}
    </div>
  );
}
