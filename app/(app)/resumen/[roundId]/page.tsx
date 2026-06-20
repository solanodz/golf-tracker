import { redirect } from "next/navigation";

import { PersonalBestAlert } from "@/components/resumen/personal-best-alert";
import { RoundActions } from "@/components/resumen/round-actions";
import {
  RoundHoleExplorer,
  type RoundHoleScore,
} from "@/components/resumen/round-hole-explorer";
import { RoundSummary } from "@/components/resumen/round-summary";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CourseHole } from "@/lib/database.types";
import { getPreviousBestGross } from "@/lib/best-rounds";
import { sortHoles } from "@/lib/golf";
import {
  calculateRoundStats,
  formatRoundDate,
  type HoleScoreWithPar,
} from "@/lib/round-stats";
import { createClient } from "@/lib/supabase/server";

export default async function ResumenPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ record?: string }>;
}) {
  const { roundId } = await params;
  const { record } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: round } = await supabase
    .from("rounds")
    .select(
      "*, courses(name, course_holes(id, number, par, yards, hcp, course_id, created_at)), hole_scores(score, fairway, penalty_from_tee, gir, putts, course_hole_id)",
    )
    .eq("id", roundId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (!round) {
    redirect("/nueva-ronda");
  }

  const holes = sortHoles(round.courses.course_holes as CourseHole[]);
  const holeScores = round.hole_scores as RoundHoleScore[];

  const holeScoresWithPar: HoleScoreWithPar[] = holeScores.map((entry) => {
    const hole = holes.find((h) => h.id === entry.course_hole_id);
    return {
      ...entry,
      id: entry.course_hole_id,
      round_id: roundId,
      created_at: "",
      updated_at: "",
      course_holes: {
        par: hole?.par ?? 0,
        number: hole?.number ?? 0,
      },
    };
  });

  const stats = calculateRoundStats(
    holeScoresWithPar,
    Number(round.handicap_used),
  );

  const previousBest = await getPreviousBestGross(supabase, {
    userId: user.id,
    roundId,
    courseId: round.course_id,
  });
  const showPersonalBestAlert =
    record === "1" &&
    (previousBest === null || stats.gross < previousBest);

  return (
    <main className="py-6">
      {showPersonalBestAlert ? (
        <PersonalBestAlert
          courseName={round.courses.name}
          gross={stats.gross}
          previousBest={previousBest}
        />
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <Badge className="w-fit bg-emerald-700 hover:bg-emerald-700">
            Ronda finalizada
          </Badge>
          <CardTitle className="text-2xl">Resumen</CardTitle>
          <CardDescription className="font-medium text-foreground">
            {round.courses.name}
          </CardDescription>
          <CardDescription className="capitalize">
            {formatRoundDate(round.played_on)}
          </CardDescription>
          <CardDescription>HCP usado: {round.handicap_used}</CardDescription>
        </CardHeader>
      </Card>

      <RoundSummary stats={stats} />
      <RoundHoleExplorer
        roundId={roundId}
        holes={holes}
        holeScores={holeScores}
      />
      <Separator className="my-6" />
      <RoundActions roundId={roundId} playedOn={round.played_on} />
    </main>
  );
}
