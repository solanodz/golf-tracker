"use client";

import { useEffect, useState } from "react";

import {
  BoolToggle,
  PuttsInput,
  ScoreInput,
} from "@/components/round/score-input";
import { TriStateToggle } from "@/components/round/tri-state-toggle";
import type { CourseHole } from "@/lib/database.types";
import {
  emptyHoleEntry,
  holeEntryFromScore,
  isPar3,
  type HoleEntry,
} from "@/lib/golf";

export function HoleForm({
  hole,
  initial,
  saving,
  isLastHole,
  saveLabel,
  onSave,
  onBack,
}: {
  hole: CourseHole;
  initial?: HoleEntry | null;
  saving: boolean;
  isLastHole: boolean;
  saveLabel?: string;
  onSave: (entry: HoleEntry) => Promise<void>;
  onBack?: () => void;
}) {
  const [entry, setEntry] = useState<HoleEntry>(
    initial ?? emptyHoleEntry(hole.par),
  );

  useEffect(() => {
    setEntry(initial ?? emptyHoleEntry(hole.par));
  }, [hole.id, initial, hole.par]);

  const par3 = isPar3(hole.par);

  function update<K extends keyof HoleEntry>(key: K, value: HoleEntry[K]) {
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSave(entry);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Hoyo {hole.number}
            </p>
            <p className="text-2xl font-bold text-zinc-900">Par {hole.par}</p>
          </div>
          <div className="text-right text-sm text-zinc-500">
            <p>{hole.yards} yds</p>
            <p>HCP {hole.hcp}</p>
          </div>
        </div>
      </div>

      <ScoreInput
        par={hole.par}
        value={entry.score}
        onChange={(score) => update("score", score)}
      />

      <TriStateToggle
        label="Fairway"
        value={entry.fairway}
        onChange={(fairway) => update("fairway", fairway)}
        allowNa={par3}
      />
      <TriStateToggle
        label="Penalidad desde tee"
        value={entry.penalty_from_tee}
        onChange={(penalty_from_tee) =>
          update("penalty_from_tee", penalty_from_tee)
        }
        allowNa={par3}
      />

      <BoolToggle
        label="GIR"
        value={entry.gir}
        onChange={(gir) => update("gir", gir)}
      />

      <PuttsInput
        value={entry.putts}
        onChange={(putts) => update("putts", putts)}
      />

      <div className="flex gap-3 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-12 flex-1 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700"
          >
            Atrás
          </button>
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="h-12 flex-[2] rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving
            ? "Guardando..."
            : (saveLabel ??
              (isLastHole ? "Finalizar ronda" : "Siguiente hoyo"))}
        </button>
      </div>
    </form>
  );
}