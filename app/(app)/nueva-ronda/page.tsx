import { redirect } from "next/navigation";

import { RoundFlow } from "@/components/round/round-flow";
import { createClient } from "@/lib/supabase/server";

export default async function NuevaRondaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: courses }, { data: activeRound }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("courses")
        .select("*, course_holes(*)")
        .order("name"),
      supabase
        .from("rounds")
        .select("*, courses(*, course_holes(*)), hole_scores(*)")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .maybeSingle(),
    ]);

  if (!profile) {
    redirect("/onboarding");
  }

  const sortedCourses =
    courses?.map((course) => ({
      ...course,
      course_holes: [...course.course_holes].sort(
        (a, b) => a.number - b.number,
      ),
    })) ?? [];

  return (
    <RoundFlow
      profile={profile}
      courses={sortedCourses}
      activeRound={activeRound}
    />
  );
}
