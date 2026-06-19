import type { CourseHole, HoleScore } from "@/lib/database.types";

export type HoleScoreWithPar = HoleScore & {
  course_holes: Pick<CourseHole, "par" | "number">;
};

export type RoundStats = {
  gross: number;
  net: number;
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  triplePlus: number;
  fairwaysHit: number;
  fairwaysTotal: number;
  fairwaysPct: number | null;
  penaltiesFromTee: number;
  gir: number;
  girTotal: number;
  girPct: number;
  puttsTotal: number;
  puttsAvg: number;
  threePuttsPlus: number;
};

function pct(hit: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((hit / total) * 1000) / 10;
}

export function calculateRoundStats(
  holeScores: HoleScoreWithPar[],
  handicapUsed: number,
): RoundStats {
  let gross = 0;
  let eagles = 0;
  let birdies = 0;
  let pars = 0;
  let bogeys = 0;
  let doubleBogeys = 0;
  let triplePlus = 0;
  let fairwaysHit = 0;
  let fairwaysTotal = 0;
  let penaltiesFromTee = 0;
  let gir = 0;
  let puttsTotal = 0;
  let threePuttsPlus = 0;

  for (const hole of holeScores) {
    const par = hole.course_holes.par;
    const diff = hole.score - par;

    gross += hole.score;
    puttsTotal += hole.putts;

    if (diff <= -2) eagles += 1;
    else if (diff === -1) birdies += 1;
    else if (diff === 0) pars += 1;
    else if (diff === 1) bogeys += 1;
    else if (diff === 2) doubleBogeys += 1;
    else triplePlus += 1;

    if (hole.fairway !== "na") {
      fairwaysTotal += 1;
      if (hole.fairway === "yes") fairwaysHit += 1;
    }

    if (hole.penalty_from_tee === "yes") {
      penaltiesFromTee += 1;
    }

    if (hole.gir) gir += 1;
    if (hole.putts >= 3) threePuttsPlus += 1;
  }

  const girTotal = holeScores.length;

  return {
    gross,
    net: Math.round((gross - handicapUsed) * 10) / 10,
    eagles,
    birdies,
    pars,
    bogeys,
    doubleBogeys,
    triplePlus,
    fairwaysHit,
    fairwaysTotal,
    fairwaysPct: pct(fairwaysHit, fairwaysTotal),
    penaltiesFromTee,
    gir,
    girTotal,
    girPct: pct(gir, girTotal) ?? 0,
    puttsTotal,
    puttsAvg: girTotal > 0 ? Math.round((puttsTotal / girTotal) * 10) / 10 : 0,
    threePuttsPlus,
  };
}

export function formatRoundDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value}%`;
}
