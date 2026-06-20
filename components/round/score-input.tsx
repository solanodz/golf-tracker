"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScoreLabelText } from "@/components/round/score-label";
import { parseLocalizedInteger } from "@/lib/parse-number";

const stepperCardClass =
  "gap-0 overflow-hidden rounded-xl border-2 border-emerald-700 bg-transparent p-0 shadow-none ring-0";

const stepperButtonClass =
  "inline-flex h-auto min-w-[4.5rem] shrink-0 items-center justify-center rounded-none border-0 bg-emerald-700 px-6 font-bold text-white outline-none transition-colors hover:bg-emerald-800 focus-visible:outline-none [&_svg]:stroke-[2.5]";

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

      <Card className={stepperCardClass}>
        <CardContent className="flex items-stretch p-0">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, value - 1))}
            className={`${stepperButtonClass} rounded-l-[10px] border-r border-emerald-800 py-5`}
          >
            <Minus />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center bg-card py-3">
            <Input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw !== "" && !/^-?\d*[.,]?\d*$/.test(raw.trim())) {
                  return;
                }
                const next = parseLocalizedInteger(raw);
                if (!Number.isNaN(next) && next >= 1 && next <= 15) {
                  onChange(next);
                }
              }}
              className="h-auto min-h-0 w-full border-0 bg-transparent py-0 text-center !text-4xl !font-bold shadow-none focus-visible:ring-0 md:!text-4xl"
            />
            <ScoreLabelText
              score={value}
              par={par}
              className="text-xs text-muted-foreground"
            />
          </div>

          <button
            type="button"
            onClick={() => onChange(Math.min(15, value + 1))}
            className={`${stepperButtonClass} rounded-r-[10px] border-l border-emerald-800 py-5`}
          >
            <Plus />
          </button>
        </CardContent>
      </Card>
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
        <Card className={stepperCardClass}>
          <CardContent className="flex items-stretch p-0">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, value - 1))}
              className={`${stepperButtonClass} rounded-l-[10px] border-r border-emerald-800 py-4`}
            >
              <Minus />
            </button>
            <Input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => {
                const raw = event.target.value;
                if (raw !== "" && !/^-?\d*[.,]?\d*$/.test(raw.trim())) {
                  return;
                }
                const next = parseLocalizedInteger(raw);
                if (!Number.isNaN(next) && next >= 0 && next <= 10) {
                  onChange(next);
                }
              }}
              className="h-auto min-h-12 flex-1 rounded-none border-0 bg-card py-3 text-center !text-xl !font-bold shadow-none focus-visible:ring-0 md:!text-xl"
            />
            <button
              type="button"
              onClick={() => onChange(Math.min(10, value + 1))}
              className={`${stepperButtonClass} rounded-r-[10px] border-l border-emerald-800 py-4`}
            >
              <Plus />
            </button>
          </CardContent>
        </Card>
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
