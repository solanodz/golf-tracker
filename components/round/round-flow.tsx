"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { checkNewPersonalBest, roundGross } from "@/lib/best-rounds";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
    if (!round || !currentHole) return null;

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

    return data;
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
      const savedScore = await upsertHoleScore(entry);
      if (!savedScore) return;

      const isLast = holeIndex === holes.length - 1;

      if (isLast) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Sesión expirada.");

        const allScores = [
          ...round.hole_scores.filter(
            (score) => score.course_hole_id !== currentHole!.id,
          ),
          savedScore,
        ];
        const gross = roundGross(allScores);

        const isNewRecord = await checkNewPersonalBest(supabase, {
          userId: user.id,
          roundId: round.id,
          courseId: round.course_id,
          gross,
        });

        const { error: completeError } = await supabase
          .from("rounds")
          .update({ status: "completed" })
          .eq("id", round.id);

        if (completeError) throw completeError;

        const resumenUrl = isNewRecord
          ? `/resumen/${round.id}?record=1`
          : `/resumen/${round.id}`;
        router.push(resumenUrl);
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
      <main className="py-6">
        <h1 className="text-2xl font-bold">Ronda en progreso</h1>
        <p className="mt-2 text-muted-foreground">
          Tenés una ronda abierta en{" "}
          <strong>{round.courses.name}</strong> ({saved}/18 hoyos).
        </p>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            onClick={handleResume}
            disabled={pending}
            className="h-12 bg-emerald-700 hover:bg-emerald-800"
          >
            {allSaved ? "Elegir hoyo a editar" : "Retomar ronda"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                className="h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {pending ? "Abandonando..." : "Abandonar y empezar nueva"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Abandonar la ronda?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borrará la ronda en progreso sin dejar rastro en el
                  historial.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleAbandon}
                >
                  Abandonar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    );
  }

  if (screen === "start") {
    return (
      <main className="py-6">
        <h1 className="text-2xl font-bold">Nueva Ronda</h1>
        <p className="mt-2 text-muted-foreground">
          Elegí la cancha y confirmá tu HCP.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Cancha</Label>
            <RadioGroup
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              className="grid w-full gap-2"
            >
              {courses.map((course) => {
                const selected = selectedCourseId === course.id;

                return (
                  <Label
                    key={course.id}
                    htmlFor={`course-${course.id}`}
                    className="flex w-full cursor-pointer"
                  >
                    <Card
                      className={cn(
                        "w-full",
                        selected && "ring-2 ring-emerald-600 ring-offset-2",
                      )}
                    >
                      <CardContent className="flex w-full items-center gap-3 py-4">
                        <RadioGroupItem
                          value={course.id}
                          id={`course-${course.id}`}
                        />
                        <div>
                          <p className="font-semibold">{course.name}</p>
                          <CardDescription>
                            Par {course.par} · {course.total_yards} yds
                          </CardDescription>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="handicap">HCP</Label>
            <Input
              id="handicap"
              type="number"
              min={0}
              step={0.1}
              value={handicap}
              onChange={(event) => setHandicap(event.target.value)}
              className="h-12"
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="button"
            onClick={handleStartRound}
            disabled={pending}
            className="h-12 bg-emerald-700 hover:bg-emerald-800"
          >
            {pending ? "Iniciando..." : "Iniciar ronda"}
          </Button>
        </div>
      </main>
    );
  }

  if (!round || !currentHole) return null;

  return (
    <main className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{round.courses.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">
              {holeIndex + 1} / {holes.length}
            </p>
            <Badge variant="secondary">En juego</Badge>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="text-destructive hover:text-destructive"
            >
              Abandonar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Abandonar la ronda?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrará la ronda en progreso sin dejar rastro en el
                historial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleAbandon}>
                Abandonar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Progress
        value={((holeIndex + 1) / holes.length) * 100}
        className="mb-4 h-2 [&_[data-slot=progress-indicator]]:bg-emerald-600"
      />

      {error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
