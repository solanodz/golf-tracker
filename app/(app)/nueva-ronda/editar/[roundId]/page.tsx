import { redirect } from "next/navigation";

import { EditRoundFlow } from "@/components/round/edit-round-flow";
import type { RoundWithDetails } from "@/lib/golf";
import { createClient } from "@/lib/supabase/server";

export default async function EditarRondaPage({
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
    .select("*, courses(*, course_holes(*)), hole_scores(*)")
    .eq("id", roundId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single();

  if (!round) {
    redirect("/historial");
  }

  const sortedRound: RoundWithDetails = {
    ...(round as RoundWithDetails),
    courses: {
      ...round.courses,
      course_holes: [...round.courses.course_holes].sort(
        (a, b) => a.number - b.number,
      ),
    },
  };

  return <EditRoundFlow round={sortedRound} />;
}
