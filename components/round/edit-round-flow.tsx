"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HoleForm } from "@/components/round/hole-form";
import { HolePicker } from "@/components/round/hole-picker";
import {
  holeEntryFromScore,
  sortHoles,
  type HoleEntry,
  type RoundWithDetails,
} from "@/lib/golf";
import { checkNewPersonalBest, roundGross } from "@/lib/best-rounds";
import { createClient } from "@/lib/supabase/client";

type Screen = "picker" | "hole";

export function EditRoundFlow({
  round,
  initialHoleIndex = 0,
  initialScreen = "picker",
}: {
  round: RoundWithDetails;
  initialHoleIndex?: number;
  initialScreen?: Screen;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [holeIndex, setHoleIndex] = useState(initialHoleIndex);
  const [roundState, setRoundState] = useState(round);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holes = useMemo(
    () => sortHoles(roundState.courses.course_holes),
    [roundState.courses.course_holes],
  );

  const currentHole = holes[holeIndex];

  const savedScoresMap = useMemo(() => {
    const entries = new Map<string, HoleEntry>();
    const summaries = new Map<string, { score: number; par: number }>();

    roundState.hole_scores.forEach((score) => {
      entries.set(score.course_hole_id, holeEntryFromScore(score));
      const hole = holes.find((h) => h.id === score.course_hole_id);
      if (hole) {
        summaries.set(score.course_hole_id, {
          score: score.score,
          par: hole.par,
        });
      }
    });

    return { entries, summaries };
  }, [roundState.hole_scores, holes]);

  async function upsertHoleScore(entry: HoleEntry) {
    if (!currentHole) return;

    const supabase = createClient();
    const { data, error: upsertError } = await supabase
      .from("hole_scores")
      .upsert(
        {
          round_id: roundState.id,
          course_hole_id: currentHole.id,
          score: entry.score,
          fairway: entry.fairway,
          penalty_from_tee: entry.penalty_from_tee,
          gir: entry.gir,
          putts: entry.putts,
        },
        { onConflict: "round_id,course_hole_id" },
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    setRoundState((prev) => {
      const others = prev.hole_scores.filter(
        (s) => s.course_hole_id !== currentHole.id,
      );
      return { ...prev, hole_scores: [...others, data] };
    });
  }

  async function handleSaveHole(entry: HoleEntry) {
    setPending(true);
    setError(null);

    try {
      await upsertHoleScore(entry);
      setScreen("picker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setPending(false);
    }
  }

  async function completeRound() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPending(false);
      setError("Sesión expirada.");
      return;
    }

    const gross = roundGross(roundState.hole_scores);
    let isNewRecord = false;

    try {
      isNewRecord = await checkNewPersonalBest(supabase, {
        userId: user.id,
        roundId: roundState.id,
        courseId: roundState.course_id,
        gross,
      });
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Error al verificar récord.");
      return;
    }

    const { error: completeError } = await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", roundState.id);

    setPending(false);

    if (completeError) {
      setError(completeError.message);
      return;
    }

    const resumenUrl = isNewRecord
      ? `/resumen/${roundState.id}?record=1`
      : `/resumen/${roundState.id}`;
    router.push(resumenUrl);
    router.refresh();
  }

  async function finishEditing() {
    await completeRound();
  }

  async function cancelEditing() {
    await completeRound();
  }

  if (screen === "picker") {
    return (
      <main className="py-6">
        <p className="text-sm text-muted-foreground">
          {roundState.courses.name}
        </p>
        <h1 className="text-2xl font-bold">Editar ronda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elegí el hoyo que querés modificar.
        </p>

        <div className="mt-6">
          <HolePicker
            holes={holes}
            savedScores={savedScoresMap.summaries}
            onSelect={(index) => {
              setHoleIndex(index);
              setScreen("hole");
            }}
          />
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            onClick={finishEditing}
            disabled={pending}
            className="h-12 bg-emerald-700 hover:bg-emerald-800"
          >
            {pending ? "Guardando..." : "Guardar y volver al resumen"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={cancelEditing}
            disabled={pending}
            className="h-12"
          >
            Cancelar edición
          </Button>
        </div>
      </main>
    );
  }

  if (!currentHole) return null;

  return (
    <main className="py-6">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setScreen("picker")}
        className="mb-4 px-0 text-emerald-700 hover:bg-transparent hover:text-emerald-800"
      >
        ← Volver a hoyos
      </Button>

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <HoleForm
        key={currentHole.id}
        hole={currentHole}
        initial={savedScoresMap.entries.get(currentHole.id) ?? null}
        saving={pending}
        isLastHole={false}
        saveLabel="Guardar hoyo"
        onSave={handleSaveHole}
      />
    </main>
  );
}
