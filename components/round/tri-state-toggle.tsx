"use client";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type TriStateOption = {
  value: "yes" | "no" | "na";
  label: string;
};

const options: TriStateOption[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
];

const activeToggleItemClass =
  "h-11 flex-1 data-[state=on]:z-10 data-[state=on]:!border data-[state=on]:!border-emerald-600 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-800";

export function TriStateToggle({
  label,
  value,
  onChange,
  allowNa = true,
}: {
  label: string;
  value: "yes" | "no" | "na";
  onChange: (value: "yes" | "no" | "na") => void;
  allowNa?: boolean;
}) {
  const visible = allowNa ? options : options.filter((o) => o.value !== "na");

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as "yes" | "no" | "na");
        }}
        variant="outline"
        spacing={0}
        className="w-full"
      >
        {visible.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={activeToggleItemClass}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
