"use client";

import { scoreLabel } from "@/lib/golf";
import type { CourseHole } from "@/lib/database.types";

export function HolePicker({
  holes,
  savedScores,
  onSelect,
}: {
  holes: CourseHole[];
  savedScores: Map<string, { score: number; par: number }>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {holes.map((hole, index) => {
        const saved = savedScores.get(hole.id);
        const hasScore = Boolean(saved);

        return (
          <button
            key={hole.id}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-colors ${
              hasScore
                ? "border-emerald-200 bg-emerald-50 hover:border-emerald-400"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <span className="text-xs font-medium text-zinc-500">
              Hoyo {hole.number}
            </span>
            <span className="mt-1 text-lg font-bold text-zinc-900">
              {saved?.score ?? "—"}
            </span>
            {saved ? (
              <span className="text-[10px] text-zinc-500">
                {scoreLabel(saved.score, hole.par)}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400">Par {hole.par}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
