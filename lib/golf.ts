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

export function isHoleInOne(score: number): boolean {
  return score === 1;
}

export function scoreLabel(score: number, par: number): string {
  if (isHoleInOne(score)) return "H-I-1";
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

export type ScoreShape =
  | "none"
  | "circle"
  | "double-circle"
  | "square"
  | "double-square";

export function scoreShape(score: number, par: number): ScoreShape {
  const diff = score - par;
  if (diff <= -2) return "double-circle";
  if (diff === -1) return "circle";
  if (diff === 0) return "none";
  if (diff === 1) return "square";
  return "double-square";
}

export type ScoreTone = "under" | "par" | "over";

export function scoreTone(score: number, par: number): ScoreTone {
  const diff = score - par;
  if (diff < 0) return "under";
  if (diff > 0) return "over";
  return "par";
}

export function scoreToneBadgeClass(tone: ScoreTone): string {
  if (tone === "under") {
    return "border-emerald-400 bg-emerald-100 text-emerald-800";
  }
  if (tone === "over") {
    return "border-orange-400 bg-orange-100 text-orange-800";
  }
  return "border-zinc-200 bg-white text-zinc-600";
}

export function scoreBadgeClass(score: number, par: number): string {
  if (isHoleInOne(score)) {
    return "border-2 border-[#B8941F] bg-[#FDF8ED]/80 font-semibold text-[#B8941F] dark:border-[#DDB94F] dark:bg-[#2A2210]/35 dark:text-[#DDB94F]";
  }
  return scoreToneBadgeClass(scoreTone(score, par));
}

export function scoreToneCardClass(tone: ScoreTone): string {
  if (tone === "under") {
    return "border-emerald-400";
  }
  if (tone === "over") {
    return "border-orange-400";
  }
  return "border-zinc-300";
}

export function scoreToneScoreColors(tone: ScoreTone): {
  text: string;
  border: string;
} {
  if (tone === "under") {
    return {
      text: "text-emerald-800",
      border: "border-emerald-700",
    };
  }
  if (tone === "over") {
    return {
      text: "text-orange-800",
      border: "border-orange-700",
    };
  }
  return {
    text: "text-zinc-600",
    border: "border-zinc-400",
  };
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

export function normalizeHoleEntry(entry: HoleEntry): HoleEntry {
  if (isHoleInOne(entry.score)) {
    return { ...entry, putts: 0 };
  }
  return entry;
}

export function applyScoreToHoleEntry(
  entry: HoleEntry,
  score: number,
): HoleEntry {
  const next = normalizeHoleEntry({ ...entry, score });
  if (isHoleInOne(entry.score) && !isHoleInOne(score) && next.putts === 0) {
    return { ...next, putts: 2 };
  }
  return next;
}

export function holeEntryFromScore(score: HoleScore) {
  return normalizeHoleEntry({
    score: score.score,
    putts: score.putts,
    gir: score.gir,
    fairway: score.fairway,
    penalty_from_tee: score.penalty_from_tee,
  });
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
