import type { HoleScore } from "@/lib/database.types";

export type RoundMetrics = {
  gross: number;
  net: number;
  girPct: number | null;
  fairwaysPct: number | null;
  puttsAvg: number;
};

export type EvolutionPoint = {
  id: string;
  date: string;
  label: string;
  courseName: string;
  gross: number;
  net: number;
  girPct: number | null;
  fairwaysPct: number | null;
  puttsAvg: number;
};

export type DashboardRound = {
  id: string;
  played_on: string;
  handicap_used: number;
  courseName: string;
  hole_scores: Pick<
    HoleScore,
    "score" | "fairway" | "penalty_from_tee" | "gir" | "putts"
  >[];
};

export type DateRangeFilter = "3m" | "6m" | "12m" | "all";
export type CourseFilter = "all" | string;

function pct(hit: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((hit / total) * 1000) / 10;
}

export function calculateRoundMetrics(
  holeScores: DashboardRound["hole_scores"],
  handicapUsed: number,
): RoundMetrics {
  let gross = 0;
  let fairwaysHit = 0;
  let fairwaysTotal = 0;
  let gir = 0;
  let puttsTotal = 0;

  for (const hole of holeScores) {
    gross += hole.score;
    puttsTotal += hole.putts;

    if (hole.fairway !== "na") {
      fairwaysTotal += 1;
      if (hole.fairway === "yes") fairwaysHit += 1;
    }

    if (hole.gir) gir += 1;
  }

  const total = holeScores.length;

  return {
    gross,
    net: Math.round((gross - handicapUsed) * 10) / 10,
    girPct: pct(gir, total),
    fairwaysPct: pct(fairwaysHit, fairwaysTotal),
    puttsAvg: total > 0 ? Math.round((puttsTotal / total) * 10) / 10 : 0,
  };
}

export function buildEvolutionData(rounds: DashboardRound[]): EvolutionPoint[] {
  return rounds
    .map((round) => {
      const metrics = calculateRoundMetrics(
        round.hole_scores,
        Number(round.handicap_used),
      );
      const [y, m, d] = round.played_on.split("-").map(Number);

      return {
        id: round.id,
        date: round.played_on,
        label: new Date(y, m - 1, d).toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
        }),
        courseName: round.courseName,
        ...metrics,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function filterEvolutionData(
  data: EvolutionPoint[],
  courseFilter: CourseFilter,
  dateRange: DateRangeFilter,
): EvolutionPoint[] {
  const now = new Date();
  let cutoff: Date | null = null;

  if (dateRange === "3m") {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  } else if (dateRange === "6m") {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  } else if (dateRange === "12m") {
    cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  }

  return data.filter((point) => {
    if (courseFilter !== "all" && point.courseName !== courseFilter) {
      return false;
    }

    if (cutoff) {
      const [y, m, d] = point.date.split("-").map(Number);
      const played = new Date(y, m - 1, d);
      if (played < cutoff) return false;
    }

    return true;
  });
}

export function averageMetric(
  data: EvolutionPoint[],
  key: "gross" | "net" | "girPct" | "fairwaysPct" | "puttsAvg",
): number | null {
  if (data.length === 0) return null;

  const values = data
    .map((p) => p[key])
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;

  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export function uniqueCourseNames(rounds: DashboardRound[]): string[] {
  return [...new Set(rounds.map((r) => r.courseName))].sort();
}
