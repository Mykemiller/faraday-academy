"use client";
import type { DurationFilterValue } from "@/lib/types";
import { DURATION_BUCKETS } from "@/lib/constants";
import Segmented from "./Segmented";

export default function DurationFilter({
  value,
  onChange,
}: {
  value: DurationFilterValue;
  onChange: (v: DurationFilterValue) => void;
}) {
  return (
    <Segmented
      legend="Duration"
      value={value}
      onChange={onChange}
      options={DURATION_BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
    />
  );
}
