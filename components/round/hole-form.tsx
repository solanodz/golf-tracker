"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BoolToggle,
  PuttsInput,
  ScoreInput,
} from "@/components/round/score-input";
import { TriStateToggle } from "@/components/round/tri-state-toggle";
import type { CourseHole } from "@/lib/database.types";
import {
  applyScoreToHoleEntry,
  emptyHoleEntry,
  holeEntryFromScore,
  isHoleInOne,
  isPar3,
  normalizeHoleEntry,
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
    normalizeHoleEntry(initial ?? emptyHoleEntry(hole.par)),
  );

  useEffect(() => {
    setEntry(normalizeHoleEntry(initial ?? emptyHoleEntry(hole.par)));
  }, [hole.id, initial, hole.par]);

  const holeInOne = isHoleInOne(entry.score);

  const par3 = isPar3(hole.par);

  function update<K extends keyof HoleEntry>(key: K, value: HoleEntry[K]) {
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSave(normalizeHoleEntry(entry));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardDescription className="font-medium text-emerald-700">
                Hoyo {hole.number}
              </CardDescription>
              <CardTitle className="text-2xl">Par {hole.par}</CardTitle>
            </div>
            <CardDescription className="text-right">
              <p>{hole.yards} yds</p>
              <p>HCP {hole.hcp}</p>
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <ScoreInput
        par={hole.par}
        value={entry.score}
        onChange={(score) =>
          setEntry((prev) => applyScoreToHoleEntry(prev, score))
        }
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
        disabled={holeInOne}
      />

      <div className="flex gap-3 pt-2">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={saving}
            className="h-12 flex-1"
          >
            Atrás
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={saving}
          className="h-12 flex-[2] bg-emerald-700 hover:bg-emerald-800"
        >
          {saving
            ? "Guardando..."
            : (saveLabel ??
              (isLastHole ? "Finalizar ronda" : "Siguiente hoyo"))}
        </Button>
      </div>
    </form>
  );
}
