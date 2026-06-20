"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";

import {
  RoundList,
  type RoundListItem,
} from "@/components/historial/round-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HistorialView({ rounds }: { rounds: RoundListItem[] }) {
  const [showBestOnly, setShowBestOnly] = useState(false);

  const bestRounds = rounds.filter((round) => round.isBestOnCourse);
  const visibleRounds = showBestOnly ? bestRounds : rounds;
  const count = visibleRounds.length;

  return (
    <>
      <Card className="mb-2 border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl">Historial</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge variant="secondary">
              {count} {count === 1 ? "ronda" : "rondas"}
              {showBestOnly ? " · mejores" : null}
            </Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      {rounds.length > 0 ? (
        <Button
          type="button"
          variant={showBestOnly ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowBestOnly((value) => !value)}
          className="mb-4"
        >
          <Trophy />
          {showBestOnly ? "Ver todas las rondas" : "Ver mejores rondas"}
        </Button>
      ) : null}

      <RoundList rounds={visibleRounds} />
    </>
  );
}
