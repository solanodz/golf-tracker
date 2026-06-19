import { redirect } from "next/navigation";

import { RoundList, type RoundListItem } from "@/components/historial/round-list";
import { createClient } from "@/lib/supabase/server";

type RawRound = {
  id: string;
  played_on: string;
  handicap_used: number;
  courses: { name: string } | { name: string }[];
  hole_scores: { score: number }[];
};

function courseName(courses: RawRound["courses"]): string {
  return Array.isArray(courses) ? courses[0].name : courses.name;
}

export default async function HistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, played_on, handicap_used, courses(name), hole_scores(score)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("played_on", { ascending: false });

  const roundList: RoundListItem[] = ((rounds as RawRound[] | null) ?? []).map(
    (round) => ({
      id: round.id,
      played_on: round.played_on,
      handicap_used: round.handicap_used,
      courses: { name: courseName(round.courses) },
      hole_scores: round.hole_scores.map((h) => ({ score: h.score })),
    }),
  );

  return (
    <main className="px-4 py-6">
      <h1 className="text-2xl font-bold text-zinc-900">Historial</h1>
      <p className="mt-1 text-zinc-600">
        {roundList.length} {roundList.length === 1 ? "ronda" : "rondas"}
      </p>

      <RoundList rounds={roundList} />
    </main>
  );
}
