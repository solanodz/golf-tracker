"use client";

import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Club } from "@/lib/database.types";
import { cn } from "@/lib/utils";

export function ClubPicker({
  clubs,
  value,
  onValueChange,
}: {
  clubs: Pick<Club, "id" | "name">[];
  value: string;
  onValueChange: (clubId: string) => void;
}) {
  if (clubs.length === 0) {
    return (
      <CardDescription>No hay clubes disponibles todavía.</CardDescription>
    );
  }

  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      className="grid w-full gap-2"
    >
      {clubs.map((club) => {
        const selected = value === club.id;

        return (
          <Label
            key={club.id}
            htmlFor={`club-${club.id}`}
            className="flex w-full cursor-pointer"
          >
            <Card
              className={cn(
                "w-full",
                selected && "ring-2 ring-emerald-600 ring-offset-2",
              )}
            >
              <CardContent className="flex w-full items-center gap-3 py-4">
                <RadioGroupItem value={club.id} id={`club-${club.id}`} />
                <p className="font-semibold">{club.name}</p>
              </CardContent>
            </Card>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
