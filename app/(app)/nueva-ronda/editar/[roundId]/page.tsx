import { redirect } from "next/navigation";

import { EditRoundFlow } from "@/components/round/edit-round-flow";
import type { RoundWithDetails } from "@/lib/golf";
import { createClient } from "@/lib/supabase/server";

export default async function EditarRondaPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ hole?: string }>;
}) {
  const { roundId } = await params;
  const { hole } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: round } = await supabase
    .from("rounds")
    .select("*, courses(*, course_holes(*)), hole_scores(*)")
    .eq("id", roundId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single();

  if (!round) {
    redirect("/historial");
  }

  const sortedHoles = [...round.courses.course_holes].sort(
    (a, b) => a.number - b.number,
  );

  const sortedRound: RoundWithDetails = {
    ...(round as RoundWithDetails),
    courses: {
      ...round.courses,
      course_holes: sortedHoles,
    },
  };

  const parsedHole = hole ? Number.parseInt(hole, 10) : Number.NaN;
  const hasInitialHole =
    Number.isInteger(parsedHole) &&
    parsedHole >= 0 &&
    parsedHole < sortedHoles.length;

  return (
    <EditRoundFlow
      round={sortedRound}
      initialHoleIndex={hasInitialHole ? parsedHole : 0}
      initialScreen={hasInitialHole ? "hole" : "picker"}
    />
  );
}
