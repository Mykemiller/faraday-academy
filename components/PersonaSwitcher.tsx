"use client";
import type { Persona } from "@/lib/types";
import { PERSONAS, personaPhrase } from "@/lib/constants";

// "I'm a…" discovery lens. It reorders the grid and never hides a course.
export default function PersonaSwitcher({
  value,
  onChange,
}: {
  value: Persona | null;
  onChange: (p: Persona | null) => void;
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
            {val === null ? label : personaPhrase(label)}
          </button>
        );
      })}
    </div>
  );
}
