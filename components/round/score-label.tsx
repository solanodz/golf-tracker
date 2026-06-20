"use client";

import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  isHoleInOne,
  scoreBadgeClass,
  scoreLabel,
} from "@/lib/golf";
import { cn } from "@/lib/utils";

const holeInOneTrophyClass = "text-[#B8941F] dark:text-[#DDB94F]";

export function ScoreLabelBadge({
  score,
  par,
  className,
}: {
  score: number;
  par: number;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-0.5 text-[10px]", scoreBadgeClass(score, par), className)}
    >
      {isHoleInOne(score) ? (
        <Trophy className={cn("size-2.5", holeInOneTrophyClass)} aria-hidden />
      ) : null}
      {scoreLabel(score, par)}
    </Badge>
  );
}

export function ScoreLabelText({
  score,
  par,
  className,
}: {
  score: number;
  par: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {isHoleInOne(score) ? (
        <Trophy className={cn("size-3", holeInOneTrophyClass)} aria-hidden />
      ) : null}
      {scoreLabel(score, par)}
    </span>
  );
}
