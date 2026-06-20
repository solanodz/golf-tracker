import type { SupabaseClient } from "@supabase/supabase-js";

export type RoundWithScores = {
  id: string;
  course_id?: string;
  courseName?: string;
  hole_scores: { score: number }[];
};

export function roundGross(holeScores: { score: number }[]): number {
  return holeScores.reduce((sum, hole) => sum + hole.score, 0);
}

export function isNewPersonalBest(
  gross: number,
  otherRounds: { hole_scores: { score: number }[] }[],
): boolean {
  if (otherRounds.length === 0) return true;
  const bestOther = Math.min(
    ...otherRounds.map((round) => roundGross(round.hole_scores)),
  );
  return gross < bestOther;
}

export function getBestRoundIdsByCourse(rounds: RoundWithScores[]): string[] {
  const byCourse = new Map<string, { id: string; gross: number }[]>();

  for (const round of rounds) {
    const key = round.course_id ?? round.courseName ?? round.id;
    const gross = roundGross(round.hole_scores);
    const entries = byCourse.get(key) ?? [];
    entries.push({ id: round.id, gross });
    byCourse.set(key, entries);
  }

  const bestIds: string[] = [];
  for (const entries of byCourse.values()) {
    const minGross = Math.min(...entries.map((entry) => entry.gross));
    for (const entry of entries) {
      if (entry.gross === minGross) {
        bestIds.push(entry.id);
      }
    }
  }

  return bestIds;
}

export async function checkNewPersonalBest(
  supabase: SupabaseClient,
  {
    userId,
    roundId,
    courseId,
    gross,
  }: {
    userId: string;
    roundId: string;
    courseId: string;
    gross: number;
  },
): Promise<boolean> {
  const { data: others, error } = await supabase
    .from("rounds")
    .select("id, hole_scores(score)")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "completed")
    .neq("id", roundId);

  if (error) throw error;
  return isNewPersonalBest(gross, others ?? []);
}

export async function getPreviousBestGross(
  supabase: SupabaseClient,
  {
    userId,
    roundId,
    courseId,
  }: {
    userId: string;
    roundId: string;
    courseId: string;
  },
): Promise<number | null> {
  const { data: others, error } = await supabase
    .from("rounds")
    .select("id, hole_scores(score)")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("status", "completed")
    .neq("id", roundId);

  if (error) throw error;
  if (!others?.length) return null;

  return Math.min(...others.map((round) => roundGross(round.hole_scores)));
}
