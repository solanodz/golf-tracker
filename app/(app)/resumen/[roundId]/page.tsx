import { redirect } from "next/navigation";

import { RoundActions } from "@/components/resumen/round-actions";
import { RoundSummary } from "@/components/resumen/round-summary";
import {
  calculateRoundStats,
  formatRoundDate,
  type HoleScoreWithPar,
} from "@/lib/round-stats";
import { createClient } from "@/lib/supabase/server";

export default async function ResumenPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
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
      "*, courses(name), hole_scores(*, course_holes(par, number))",
    )
    .eq("id", roundId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (!round) {
    redirect("/nueva-ronda");
  }

  const holeScores = round.hole_scores as HoleScoreWithPar[];
  const stats = calculateRoundStats(
    holeScores,
    Number(round.handicap_used),
  );

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <p className="text-sm font-medium text-emerald-700">Ronda finalizada</p>
      <h1 className="mt-1 text-2xl font-bold text-zinc-900">Resumen</h1>
      <p className="mt-1 font-medium text-zinc-800">{round.courses.name}</p>
      <p className="text-sm capitalize text-zinc-500">
        {formatRoundDate(round.played_on)}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        HCP usado: {round.handicap_used}
      </p>

      <RoundSummary stats={stats} />
      <RoundActions roundId={roundId} playedOn={round.played_on} />
    </main>
  );
}
