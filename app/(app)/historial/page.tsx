import { redirect } from "next/navigation";

import { HistorialView } from "@/components/historial/historial-view";
import { type RoundListItem } from "@/components/historial/round-list";
import { getBestRoundIdsByCourse } from "@/lib/best-rounds";
import { createClient } from "@/lib/supabase/server";

type RawRound = {
  id: string;
  course_id: string;
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
    .select(
      "id, course_id, played_on, handicap_used, courses(name), hole_scores(score)",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("played_on", { ascending: false });

  const rawRounds = (rounds as RawRound[] | null) ?? [];

  const bestRoundIds = new Set(
    getBestRoundIdsByCourse(
      rawRounds.map((round) => ({
        id: round.id,
        course_id: round.course_id,
        hole_scores: round.hole_scores,
      })),
    ),
  );

  const roundList: RoundListItem[] = rawRounds.map((round) => ({
    id: round.id,
    played_on: round.played_on,
    handicap_used: round.handicap_used,
    courses: { name: courseName(round.courses) },
    hole_scores: round.hole_scores.map((h) => ({ score: h.score })),
    isBestOnCourse: bestRoundIds.has(round.id),
  }));

  return (
    <main className="py-6">
      <HistorialView rounds={roundList} />
    </main>
  );
}
