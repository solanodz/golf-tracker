import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import type { DashboardRound } from "@/lib/dashboard-stats";
import { createClient } from "@/lib/supabase/server";

type RawRound = {
  id: string;
  played_on: string;
  handicap_used: number;
  courses: { name: string } | { name: string }[];
  hole_scores: {
    score: number;
    fairway: "yes" | "no" | "na";
    penalty_from_tee: "yes" | "no" | "na";
    gir: boolean;
    putts: number;
  }[];
};

function courseName(courses: RawRound["courses"]): string {
  return Array.isArray(courses) ? courses[0].name : courses.name;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select(
      "id, played_on, handicap_used, courses(name), hole_scores(score, fairway, penalty_from_tee, gir, putts)",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("played_on", { ascending: true });

  const dashboardRounds: DashboardRound[] = ((rounds as RawRound[] | null) ?? []).map(
    (round) => ({
      id: round.id,
      played_on: round.played_on,
      handicap_used: round.handicap_used,
      courseName: courseName(round.courses),
      hole_scores: round.hole_scores,
    }),
  );

  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-1 text-zinc-600">Evolución de tu juego</p>

      <Dashboard rounds={dashboardRounds} />
    </main>
  );
}
