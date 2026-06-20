"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRoundDate } from "@/lib/round-stats";

export type RoundListItem = {
  id: string;
  played_on: string;
  handicap_used: number;
  courses: { name: string };
  hole_scores: { score: number }[];
  isBestOnCourse?: boolean;
};

export function RoundList({ rounds }: { rounds: RoundListItem[] }) {
  if (rounds.length === 0) {
    return (
      <Card className="mt-8 border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Sin rondas todavía</CardTitle>
          <CardDescription>
            Completá una ronda para verla acá.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
            <Link href="/nueva-ronda">Nueva ronda</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="mt-2 flex flex-col gap-3">
      {rounds.map((round) => {
        const gross = round.hole_scores.reduce((sum, h) => sum + h.score, 0);
        const net =
          Math.round((gross - Number(round.handicap_used)) * 10) / 10;

        return (
          <li key={round.id}>
            <Card className="transition-colors hover:ring-emerald-300">
              <Link href={`/resumen/${round.id}`} className="block">
                <CardContent className="flex items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {round.courses.name}
                    </p>
                    <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                      {formatRoundDate(round.played_on)}
                    </p>
                    {round.isBestOnCourse ? (
                      <Badge
                        variant="outline"
                        className="mt-1.5 gap-1 border-2 border-[#B8941F] bg-[#FDF8ED]/80 px-1.5 py-0 text-[10px] font-semibold text-[#B8941F] dark:border-[#DDB94F] dark:bg-[#2A2210]/35 dark:text-[#DDB94F]"
                      >
                        <Trophy
                          className="size-3 text-[#B8941F] dark:text-[#DDB94F]"
                          aria-hidden
                        />
                        Mejor ronda
                      </Badge>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold">{gross}</p>
                    <Badge variant="secondary">Neto {net}</Badge>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
