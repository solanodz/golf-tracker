"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScoreLabelText } from "@/components/round/score-label";

export function ScoreInput({
  par,
  value,
  onChange,
}: {
  par: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label>Score</Label>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus />
        </Button>

        <Card className="flex-1">
          <CardContent className="flex flex-col items-center py-2">
            <Input
              type="number"
              min={1}
              max={15}
              value={value}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isNaN(next) && next >= 1 && next <= 15) {
                  onChange(next);
                }
              }}
              className="h-auto border-0 bg-transparent text-center text-2xl font-bold shadow-none focus-visible:ring-0"
            />
            <ScoreLabelText
              score={value}
              par={par}
              className="text-xs text-muted-foreground"
            />
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => onChange(Math.min(15, value + 1))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

export function PuttsInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Putts</Label>
      {disabled ? (
        <p className="rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">0</span> — en un
          hoyo en uno el único tiro fue desde el tee.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => onChange(Math.max(0, value - 1))}
          >
            <Minus />
          </Button>
          <Input
            type="number"
            min={0}
            max={10}
            value={value}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isNaN(next) && next >= 0 && next <= 10) {
                onChange(next);
              }
            }}
            className="h-12 flex-1 text-center text-xl font-bold"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => onChange(Math.min(10, value + 1))}
          >
            <Plus />
          </Button>
        </div>
      )}
    </div>
  );
}

const activeToggleItemClass =
  "h-11 flex-1 data-[state=on]:z-10 data-[state=on]:!border data-[state=on]:!border-emerald-600 data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-800";

export function BoolToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ToggleGroup
        type="single"
        value={value ? "yes" : "no"}
        onValueChange={(next) => {
          if (next) onChange(next === "yes");
        }}
        variant="outline"
        spacing={0}
        className="w-full"
      >
        <ToggleGroupItem value="yes" className={activeToggleItemClass}>
          Sí
        </ToggleGroupItem>
        <ToggleGroupItem value="no" className={activeToggleItemClass}>
          No
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
