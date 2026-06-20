"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreLabelBadge } from "@/components/round/score-label";
import { scoreShape, scoreTone, scoreToneBadgeClass, scoreToneScoreColors, type ScoreShape, type ScoreTone } from "@/lib/golf";
import type { CourseHole } from "@/lib/database.types";
import { cn } from "@/lib/utils";

function HoleScoreMarker({
  score,
  shape,
  tone,
}: {
  score: number;
  shape: ScoreShape;
  tone: ScoreTone;
}) {
  const colors = scoreToneScoreColors(tone);
  const value = (
    <span
      className={cn(
        "relative z-10 text-lg font-bold tabular-nums leading-none",
        colors.text,
      )}
    >
      {score}
    </span>
  );

  if (shape === "circle") {
    return (
      <span
        className={cn(
          "mt-1 flex size-9 items-center justify-center rounded-full border-2",
          colors.border,
        )}
      >
        {value}
      </span>
    );
  }

  if (shape === "double-circle") {
    return (
      <span className="relative mt-1 flex size-10 items-center justify-center rounded-full">
        <span
          className={cn(
            "absolute inset-0 rounded-full border-2",
            colors.border,
          )}
        />
        <span
          className={cn(
            "absolute inset-[4px] rounded-full border-2",
            colors.border,
          )}
        />
        {value}
      </span>
    );
  }

  if (shape === "square") {
    return (
      <span
        className={cn(
          "mt-1 flex size-9 items-center justify-center rounded-none border-2",
          colors.border,
        )}
      >
        {value}
      </span>
    );
  }

  if (shape === "double-square") {
    return (
      <span className="relative mt-1 flex size-10 items-center justify-center rounded-none">
        <span
          className={cn(
            "absolute inset-0 rounded-none border-2",
            colors.border,
          )}
        />
        <span
          className={cn(
            "absolute inset-[4px] rounded-none border-2",
            colors.border,
          )}
        />
        {value}
      </span>
    );
  }

  return (
    <span className={cn("mt-1 text-lg font-bold tabular-nums", colors.text)}>
      {score}
    </span>
  );
}

export function HolePicker({
  holes,
  savedScores,
  selectedIndex = null,
  onSelect,
}: {
  holes: CourseHole[];
  savedScores: Map<string, { score: number; par: number }>;
  selectedIndex?: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {holes.map((hole, index) => {
        const saved = savedScores.get(hole.id);
        const tone = saved
          ? scoreTone(saved.score, saved.par)
          : ("par" as const);
        const isSelected = selectedIndex === index;

        return (
          <Button
            key={hole.id}
            type="button"
            variant="outline"
            onClick={() => onSelect(index)}
            className={cn(
              "h-auto flex-col px-2 py-3",
              tone === "under" &&
                "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100",
              tone === "over" &&
                "border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100",
              tone === "par" && "bg-white hover:bg-zinc-50",
              isSelected &&
                tone === "under" &&
                "border-emerald-500 ring-2 ring-emerald-500 ring-offset-2",
              isSelected &&
                tone === "over" &&
                "border-orange-500 ring-2 ring-orange-500 ring-offset-2",
              isSelected &&
                tone === "par" &&
                "border-zinc-500 ring-2 ring-zinc-400 ring-offset-2",
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">
              Hoyo {hole.number}
            </span>
            {saved ? (
              <>
                <HoleScoreMarker
                  score={saved.score}
                  shape={scoreShape(saved.score, hole.par)}
                  tone={tone}
                />
                <ScoreLabelBadge
                  score={saved.score}
                  par={hole.par}
                  className="mt-1"
                />
              </>
            ) : (
              <>
                <span className="mt-1 text-lg font-bold text-muted-foreground">
                  —
                </span>
                <Badge
                  variant="outline"
                  className={cn("mt-1 text-[10px]", scoreToneBadgeClass("par"))}
                >
                  Par {hole.par}
                </Badge>
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}
