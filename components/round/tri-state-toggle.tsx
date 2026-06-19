"use client";

type TriStateOption = {
  value: "yes" | "no" | "na";
  label: string;
};

const options: TriStateOption[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
];

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
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className={`grid gap-2 ${visible.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {visible.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-11 rounded-xl border text-sm font-medium transition-colors ${
                active
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
