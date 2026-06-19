"use client";

import { scoreLabel } from "@/lib/golf";

export function ScoreInput({
  par,
  value,
  onChange,
}: {
  par: number;
  value: number;
  onChange: (value: number) => void;
}) {
  function decrement() {
    onChange(Math.max(1, value - 1));
  }

  function increment() {
    onChange(Math.min(15, value + 1));
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-zinc-700">Score</span>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xl font-medium text-zinc-700"
        >
          −
        </button>

        <div className="flex flex-1 flex-col items-center rounded-xl border border-zinc-200 bg-white px-4 py-2">
          <input
            type="number"
            min={1}
            max={15}
            value={value}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isNaN(next) && next >= 1 && next <= 15) {
                onChange(next);
              }
            }}
            className="w-full bg-transparent text-center text-2xl font-bold text-zinc-900 outline-none"
          />
          <span className="text-xs text-zinc-500">{scoreLabel(value, par)}</span>
        </div>

        <button
          type="button"
          onClick={increment}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xl font-medium text-zinc-700"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PuttsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700">Putts</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xl font-medium"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={10}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (!Number.isNaN(next) && next >= 0 && next <= 10) {
              onChange(next);
            }
          }}
          className="h-12 flex-1 rounded-xl border border-zinc-200 bg-white text-center text-xl font-bold outline-none ring-emerald-500 focus:ring-2"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(10, value + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-xl font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function BoolToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {[
          { val: true, text: "Sí" },
          { val: false, text: "No" },
        ].map((option) => (
          <button
            key={option.text}
            type="button"
            onClick={() => onChange(option.val)}
            className={`h-11 rounded-xl border text-sm font-medium ${
              value === option.val
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
}
