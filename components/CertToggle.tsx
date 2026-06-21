"use client";
import { Award } from "lucide-react";

// Certifications-only switch (spec §3). Text + icon, not color alone (§11).
export default function CertToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
        value
          ? "bg-forest text-warm-white border-forest"
          : "bg-warm-white-card text-forest-90 border-sage-40 hover:border-sage",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <Award className="h-4 w-4" aria-hidden />
        Certifications only
      </span>
      <span
        aria-hidden
        className={[
          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          value ? "bg-gold" : "bg-sage-40",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-warm-white transition-transform",
            value ? "translate-x-4" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
