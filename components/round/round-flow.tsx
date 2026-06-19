"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { HoleForm } from "@/components/round/hole-form";
import type { Profile } from "@/lib/database.types";
import {
  formatPlayedOn,
  holeEntryFromScore,
  nextIncompleteHoleIndex,
  sortHoles,
  type CourseWithHoles,
  type HoleEntry,
  type RoundWithDetails,
} from "@/lib/golf";
import { createClient } from "@/lib/supabase/client";

type Screen = "resume" | "start" | "playing";

export function RoundFlow({
  profile,
  courses,
  activeRound,
}: {
  profile: Profile;
  courses: CourseWithHoles[];
  activeRound: RoundWithDetails | null;
}) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(
    activeRound ? "resume" : "start",
  );
  const [round, setRound] = useState<RoundWithDetails | null>(activeRound);
  const [holeIndex, setHoleIndex] = useState(() =>
    activeRound
      ? nextIncompleteHoleIndex(
          sortHoles(activeRound.courses.course_holes),
          activeRound.hole_scores,
        )
      : 0,
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    courses[0]?.id ?? "",
  );
  const [handicap, setHandicap] = useState(String(profile.handicap ?? 0));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holes = useMemo(
    () => (round ? sortHoles(round.courses.course_holes) : []),
    [round],
  );

  const currentHole = holes[holeIndex];
  const savedScoresMap = useMemo(() => {
    const map = new Map<string, HoleEntry>();
    round?.hole_scores.forEach((score) => {
      map.set(score.course_hole_id, holeEntryFromScore(score));
    });
    return map;
  }, [round?.hole_scores]);

  async function upsertHoleScore(entry: HoleEntry) {
    if (!round || !currentHole) return;

    const supabase = createClient();
    const { data, error: upsertError } = await supabase
      .from("hole_scores")
      .upsert(
        {
          round_id: round.id,
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

    setRound((prev) => {
      if (!prev) return prev;
      const others = prev.hole_scores.filter(
        (s) => s.course_hole_id !== currentHole.id,
      );
      return { ...prev, hole_scores: [...others, data] };
    });
  }

  async function handleStartRound() {
    setPending(true);
    setError(null);

    const handicapUsed = Number(handicap);
    if (Number.isNaN(handicapUsed) || handicapUsed < 0) {
      setError("Ingresá un HCP válido.");
      setPending(false);
      return;
    }

    const course = courses.find((c) => c.id === selectedCourseId);
    if (!course) {
      setError("Elegí una cancha.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada.");
      setPending(false);
      return;
    }

    if (handicapUsed !== profile.handicap) {
      await supabase
        .from("profiles")
        .update({ handicap: handicapUsed })
        .eq("id", user.id);
    }

    const { data: newRound, error: roundError } = await supabase
      .from("rounds")
      .insert({
        user_id: user.id,
        course_id: course.id,
        played_on: formatPlayedOn(),
        status: "in_progress",
        handicap_used: handicapUsed,
      })
      .select("*, courses(*, course_holes(*)), hole_scores(*)")
      .single();

    setPending(false);

    if (roundError) {
      setError(roundError.message);
      return;
    }

    setRound(newRound as RoundWithDetails);
    setHoleIndex(0);
    setScreen("playing");
  }

  async function handleAbandon() {
    if (!round) return;
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("rounds")
      .delete()
      .eq("id", round.id);

    setPending(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRound(null);
    setHoleIndex(0);
    setScreen("start");
  }

  async function handleResume() {
    if (round && round.hole_scores.length >= 18) {
      router.push(`/nueva-ronda/editar/${round.id}`);
      return;
    }
    setScreen("playing");
  }

  async function handleSaveHole(entry: HoleEntry) {
    if (!round || !currentHole) return;

    setPending(true);
    setError(null);

    try {
      await upsertHoleScore(entry);

      const isLast = holeIndex === holes.length - 1;

      if (isLast) {
        const supabase = createClient();
        const { error: completeError } = await supabase
          .from("rounds")
          .update({ status: "completed" })
          .eq("id", round.id);

        if (completeError) throw completeError;

        router.push(`/resumen/${round.id}`);
        router.refresh();
        return;
      }

      setHoleIndex((index) => index + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setPending(false);
    }
  }

  function handleBack() {
    setHoleIndex((index) => Math.max(0, index - 1));
  }

  if (screen === "resume" && round) {
    const saved = round.hole_scores.length;
    const allSaved = saved >= 18;

    return (
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900">Ronda en progreso</h1>
        <p className="mt-2 text-zinc-600">
          Tenés una ronda abierta en{" "}
          <strong>{round.courses.name}</strong> ({saved}/18 hoyos).
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResume}
            disabled={pending}
            className="h-12 rounded-xl bg-emerald-700 font-semibold text-white"
          >
            {allSaved ? "Elegir hoyo a editar" : "Retomar ronda"}
          </button>
          <button
            type="button"
            onClick={handleAbandon}
            disabled={pending}
            className="h-12 rounded-xl border border-red-200 text-sm font-medium text-red-700"
          >
            {pending ? "Abandonando..." : "Abandonar y empezar nueva"}
          </button>
        </div>
      </main>
    );
  }

  if (screen === "start") {
    return (
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900">Nueva Ronda</h1>
        <p className="mt-2 text-zinc-600">Elegí la cancha y confirmá tu HCP.</p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700">Cancha</span>
            <div className="grid grid-cols-1 gap-2">
              {courses.map((course) => {
                const selected = selectedCourseId === course.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-zinc-900">{course.name}</p>
                    <p className="text-sm text-zinc-500">
                      Par {course.par} · {course.total_yards} yds
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700">HCP</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={handicap}
              onChange={(event) => setHandicap(event.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={handleStartRound}
            disabled={pending}
            className="h-12 rounded-xl bg-emerald-700 font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Iniciando..." : "Iniciar ronda"}
          </button>
        </div>
      </main>
    );
  }

  if (!round || !currentHole) return null;

  return (
    <main className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{round.courses.name}</p>
          <p className="text-lg font-semibold text-zinc-900">
            {holeIndex + 1} / {holes.length}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAbandon}
          disabled={pending}
          className="text-sm font-medium text-red-600"
        >
          Abandonar
        </button>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${((holeIndex + 1) / holes.length) * 100}%` }}
        />
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <HoleForm
        key={currentHole.id}
        hole={currentHole}
        initial={savedScoresMap.get(currentHole.id) ?? null}
        saving={pending}
        isLastHole={holeIndex === holes.length - 1}
        onSave={handleSaveHole}
        onBack={holeIndex > 0 ? handleBack : undefined}
      />
    </main>
  );
}
