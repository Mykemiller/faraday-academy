import type { Cluster } from "@/lib/types";

// Bespoke, minimal SVG per cluster (review #3) — sharpens scannability alongside
// the cluster-tinted School badge. Decorative: aria-hidden, currentColor stroke.
export function ClusterIcon({
  cluster,
  className = "h-4 w-4",
}: {
  cluster: Cluster;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (cluster) {
    case "Physical Stack": // stacked layers
      return (
        <svg {...common}>
          <path d="M12 3 3 7l9 4 9-4-9-4Z" />
          <path d="M3 12l9 4 9-4" />
          <path d="M3 17l9 4 9-4" />
        </svg>
      );
    case "Commercial & Capital": // rising bars
      return (
        <svg {...common}>
          <path d="M5 20V11" />
          <path d="M12 20V5" />
          <path d="M19 20v-6" />
          <path d="M3 20h18" />
        </svg>
      );
    case "Market & Policy": // grid lines
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
          <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" />
        </svg>
      );
    case "Operations & Resilience": // pulse / signal
      return (
        <svg {...common}>
          <path d="M3 12h4l2.5-7 4.5 14 2.5-7H21" />
        </svg>
      );
    case "Cross-Stack": // node graph
      return (
        <svg {...common}>
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="9" r="2" />
          <circle cx="9" cy="18" r="2" />
          <path d="M6.7 7.4 17 8.6M7.4 16.3 17.3 10.4M6.2 7.8 8.4 16" />
        </svg>
      );
  }
}
