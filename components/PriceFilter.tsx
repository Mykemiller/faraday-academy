"use client";
import type { PriceFilterValue } from "@/lib/types";
import { PRICE_OPTIONS } from "@/lib/constants";
import Segmented from "./Segmented";

export default function PriceFilter({
  value,
  onChange,
}: {
  value: PriceFilterValue;
  onChange: (v: PriceFilterValue) => void;
}) {
  return (
    <Segmented
      legend="Price"
      value={value}
      onChange={onChange}
      options={PRICE_OPTIONS.map((o) => ({ key: o.key, label: o.label }))}
    />
  );
}
