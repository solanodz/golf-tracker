import type { Course, CourseHole, HoleScore, Round, TriState } from "@/lib/database.types";

export type CourseWithHoles = Course & {
  course_holes: CourseHole[];
};

export type RoundWithDetails = Round & {
  courses: CourseWithHoles;
  hole_scores: HoleScore[];
};

export function sortHoles(holes: CourseHole[]): CourseHole[] {
  return [...holes].sort((a, b) => a.number - b.number);
}

export function isPar3(par: number): boolean {
  return par === 3;
}

export function defaultTriStateForPar(par: number): TriState {
  return isPar3(par) ? "na" : "no";
}

export function scoreLabel(score: number, par: number): string {
  const diff = score - par;
  if (diff <= -3) return "Albatross+";
  if (diff === -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Doble";
  if (diff === 3) return "Triple";
  return `+${diff}`;
}

export type HoleEntry = {
  score: number;
  putts: number;
  gir: boolean;
  fairway: "yes" | "no" | "na";
  penalty_from_tee: "yes" | "no" | "na";
};

export function emptyHoleEntry(par: number): HoleEntry {
  return {
    score: par,
    putts: 2,
    gir: false,
    fairway: defaultTriStateForPar(par),
    penalty_from_tee: defaultTriStateForPar(par),
  };
}

export function holeEntryFromScore(score: HoleScore) {
  return {
    score: score.score,
    putts: score.putts,
    gir: score.gir,
    fairway: score.fairway,
    penalty_from_tee: score.penalty_from_tee,
  };
}

export function nextIncompleteHoleIndex(
  holes: CourseHole[],
  savedScores: HoleScore[],
): number {
  const savedHoleIds = new Set(savedScores.map((s) => s.course_hole_id));
  const index = holes.findIndex((hole) => !savedHoleIds.has(hole.id));
  return index === -1 ? holes.length - 1 : index;
}

export function formatPlayedOn(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
