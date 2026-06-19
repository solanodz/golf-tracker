"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { HoleForm } from "@/components/round/hole-form";
import { HolePicker } from "@/components/round/hole-picker";
import {
  holeEntryFromScore,
  sortHoles,
  type CourseWithHoles,
  type HoleEntry,
  type RoundWithDetails,
} from "@/lib/golf";
import { createClient } from "@/lib/supabase/client";

type Screen = "picker" | "hole";

export function EditRoundFlow({ round }: { round: RoundWithDetails }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("picker");
  const [holeIndex, setHoleIndex] = useState(0);
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

  async function finishEditing() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: completeError } = await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", roundState.id);

    setPending(false);

    if (completeError) {
      setError(completeError.message);
      return;
    }

    router.push(`/resumen/${roundState.id}`);
    router.refresh();
  }

  async function cancelEditing() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: cancelError } = await supabase
      .from("rounds")
      .update({ status: "completed" })
      .eq("id", roundState.id);

    setPending(false);

    if (cancelError) {
      setError(cancelError.message);
      return;
    }

    router.push(`/resumen/${roundState.id}`);
    router.refresh();
  }

  if (screen === "picker") {
    return (
      <main className="px-4 py-6">
        <p className="text-sm text-zinc-500">{roundState.courses.name}</p>
        <h1 className="text-2xl font-bold text-zinc-900">Editar ronda</h1>
        <p className="mt-2 text-sm text-zinc-600">
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

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={finishEditing}
            disabled={pending}
            className="h-12 rounded-xl bg-emerald-700 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando..." : "Guardar y volver al resumen"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={pending}
            className="h-12 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700"
          >
            Cancelar edición
          </button>
        </div>
      </main>
    );
  }

  if (!currentHole) return null;

  return (
    <main className="px-4 py-6">
      <button
        type="button"
        onClick={() => setScreen("picker")}
        className="mb-4 text-sm font-medium text-emerald-700"
      >
        ← Volver a hoyos
      </button>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

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
