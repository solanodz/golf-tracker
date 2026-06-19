import Link from "next/link";

import { formatRoundDate } from "@/lib/round-stats";

export type RoundListItem = {
  id: string;
  played_on: string;
  handicap_used: number;
  courses: { name: string };
  hole_scores: { score: number }[];
};

export function RoundList({ rounds }: { rounds: RoundListItem[] }) {
  if (rounds.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-700">Sin rondas todavía</p>
        <p className="mt-1 text-sm text-zinc-500">
          Completá una ronda para verla acá.
        </p>
        <Link
          href="/nueva-ronda"
          className="mt-4 inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white"
        >
          Nueva ronda
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {rounds.map((round) => {
        const gross = round.hole_scores.reduce((sum, h) => sum + h.score, 0);
        const net =
          Math.round((gross - Number(round.handicap_used)) * 10) / 10;

        return (
          <li key={round.id}>
            <Link
              href={`/resumen/${round.id}`}
              className="block rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-emerald-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {round.courses.name}
                  </p>
                  <p className="mt-0.5 text-sm capitalize text-zinc-500">
                    {formatRoundDate(round.played_on)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-zinc-900">{gross}</p>
                  <p className="text-xs text-zinc-500">Neto {net}</p>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
