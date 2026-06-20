"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { HolePicker } from "@/components/round/hole-picker";
import { ScoreLabelBadge } from "@/components/round/score-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CourseHole, TriState } from "@/lib/database.types";
import { scoreTone, scoreToneCardClass } from "@/lib/golf";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type RoundHoleScore = {
  course_hole_id: string;
  score: number;
  fairway: TriState;
  penalty_from_tee: TriState;
  gir: boolean;
  putts: number;
};

function triStateLabel(value: TriState) {
  if (value === "yes") return "Sí";
  if (value === "no") return "No";
  return "N/A";
}

export function RoundHoleExplorer({
  roundId,
  holes,
  holeScores,
}: {
  roundId: string;
  holes: CourseHole[];
  holeScores: RoundHoleScore[];
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  const savedScores = useMemo(() => {
    const map = new Map<string, { score: number; par: number }>();
    holeScores.forEach((entry) => {
      const hole = holes.find((h) => h.id === entry.course_hole_id);
      if (hole) {
        map.set(entry.course_hole_id, { score: entry.score, par: hole.par });
      }
    });
    return map;
  }, [holeScores, holes]);

  const scoresByHoleId = useMemo(() => {
    return new Map(holeScores.map((entry) => [entry.course_hole_id, entry]));
  }, [holeScores]);

  const selectedHole = selectedIndex !== null ? holes[selectedIndex] : null;
  const selectedScore = selectedHole
    ? scoresByHoleId.get(selectedHole.id)
    : null;
  const selectedTone =
    selectedHole && selectedScore
      ? scoreTone(selectedScore.score, selectedHole.par)
      : null;

  async function editSelectedHole() {
    if (selectedIndex === null) return;

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("rounds")
      .update({ status: "in_progress" })
      .eq("id", roundId);

    if (error) {
      setPending(false);
      return;
    }

    router.push(`/nueva-ronda/editar/${roundId}?hole=${selectedIndex}`);
    router.refresh();
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Tarjeta de ronda
        </h2>
        <Separator className="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hoyos</CardTitle>
          <CardDescription>
            Tocá un hoyo para ver el detalle o editarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <HolePicker
            holes={holes}
            savedScores={savedScores}
            selectedIndex={selectedIndex}
            onSelect={(index) => setSelectedIndex(index)}
          />

          {selectedHole && selectedScore && selectedTone ? (
            <Card className={cn("border-2", scoreToneCardClass(selectedTone))}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription className="font-medium text-emerald-700">
                      Hoyo {selectedHole.number}
                    </CardDescription>
                    <CardTitle className="text-xl">
                      Score {selectedScore.score}
                    </CardTitle>
                    <CardDescription>
                      Par {selectedHole.par} · {selectedHole.yards} yds · HCP{" "}
                      {selectedHole.hcp}
                    </CardDescription>
                  </div>
                  <ScoreLabelBadge
                    score={selectedScore.score}
                    par={selectedHole.par}
                  />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <StatItem label="Fairway" value={triStateLabel(selectedScore.fairway)} />
                <StatItem
                  label="Penalidad tee"
                  value={triStateLabel(selectedScore.penalty_from_tee)}
                />
                <StatItem label="GIR" value={selectedScore.gir ? "Sí" : "No"} />
                <StatItem label="Putts" value={String(selectedScore.putts)} />
              </CardContent>
              <CardContent className="pt-0">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={editSelectedHole}
                >
                  <Pencil />
                  Editar hoyo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Elegí un hoyo para ver sus stats.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
