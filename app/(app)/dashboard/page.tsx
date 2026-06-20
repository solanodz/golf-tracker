import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard/dashboard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="py-6">
      <Card className="mb-2 border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="px-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Tu juego
          </p>
          <CardTitle className="text-2xl tracking-tight">Dashboard</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            Evolución de tu juego
            <Badge variant="outline" className="border-emerald-200 text-emerald-800">
              {dashboardRounds.length}{" "}
              {dashboardRounds.length === 1 ? "ronda" : "rondas"}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <Dashboard rounds={dashboardRounds} />
    </main>
  );
}
