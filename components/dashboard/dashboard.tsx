"use client";

import {
  Flag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  EvolutionChart,
  ScoreEvolutionChart,
} from "@/components/dashboard/evolution-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  averageMetric,
  buildEvolutionData,
  filterEvolutionData,
  type CourseFilter,
  type DashboardRound,
  type DateRangeFilter,
  type EvolutionPoint,
  uniqueCourseNames,
} from "@/lib/dashboard-stats";
import { cn } from "@/lib/utils";

type MetricTone = "positive" | "negative" | "neutral";

const TONE_BORDER: Record<MetricTone, string> = {
  positive: "border-emerald-400",
  negative: "border-amber-400",
  neutral: "border-zinc-200",
};

const TONE_HINT: Record<MetricTone, string> = {
  positive: "text-emerald-700",
  negative: "text-amber-700",
  neutral: "text-muted-foreground",
};

function metricTrend(
  filtered: EvolutionPoint[],
  key: "gross" | "net" | "girPct" | "fairwaysPct" | "puttsAvg",
  lowerIsBetter = false,
): MetricTone {
  if (filtered.length < 2) return "neutral";

  const first = filtered[0][key];
  const last = filtered[filtered.length - 1][key];

  if (first === null || last === null || first === last) return "neutral";

  const improving = lowerIsBetter ? last < first : last > first;
  return improving ? "positive" : "negative";
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {title}
        </h2>
        <Separator className="flex-1" />
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  meta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  meta?: string;
  tone?: MetricTone;
}) {
  return (
    <Card
      size="sm"
      className={cn("gap-0 border py-0 shadow-none", TONE_BORDER[tone])}
    >
      <CardContent className="px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {meta ? (
          <p className={cn("mt-0.5 text-[11px] tabular-nums", TONE_HINT[tone])}>
            {meta}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  label,
  gross,
  net,
  meta,
  tone = "positive",
}: {
  label: string;
  gross: number;
  net: number;
  meta: string;
  tone?: MetricTone;
}) {
  return (
    <Card
      size="sm"
      className={cn("gap-0 border py-0 shadow-none", TONE_BORDER[tone])}
    >
      <CardContent className="px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tabular-nums tracking-tight">
            {gross}
          </span>
          <span className="text-xs text-muted-foreground">
            gross · <span className={TONE_HINT[tone]}>{net} neto</span>
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  );
}

function grossTrend(filtered: EvolutionPoint[]) {
  if (filtered.length < 2) return null;

  const last = filtered[filtered.length - 1].gross;
  const prev = filtered[filtered.length - 2].gross;
  const diff = last - prev;

  if (diff < 0) {
    return { direction: "down" as const, diff: Math.abs(diff) };
  }
  if (diff > 0) {
    return { direction: "up" as const, diff };
  }
  return null;
}

export function Dashboard({ rounds }: { rounds: DashboardRound[] }) {
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");

  const courseNames = useMemo(() => uniqueCourseNames(rounds), [rounds]);

  const allData = useMemo(() => buildEvolutionData(rounds), [rounds]);

  const filtered = useMemo(
    () => filterEvolutionData(allData, courseFilter, dateRange),
    [allData, courseFilter, dateRange],
  );

  const avgGross = averageMetric(filtered, "gross");
  const avgNet = averageMetric(filtered, "net");
  const avgGir = averageMetric(filtered, "girPct");
  const avgFw = averageMetric(filtered, "fairwaysPct");
  const avgPutts = averageMetric(filtered, "puttsAvg");
  const trend = useMemo(() => grossTrend(filtered), [filtered]);

  const bestRound = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, point) =>
      point.gross < best.gross ? point : best,
    );
  }, [filtered]);

  const latestRound =
    filtered.length > 0 ? filtered[filtered.length - 1] : null;

  const trendHint =
    trend === null
      ? undefined
      : trend.direction === "down"
        ? `↓ ${trend.diff} vs ronda anterior`
        : `↑ ${trend.diff} vs ronda anterior`;

  const grossTone = trend
    ? trend.direction === "down"
      ? "positive"
      : "negative"
    : "neutral";

  const latestTone =
    trend && latestRound
      ? trend.direction === "down"
        ? "positive"
        : "negative"
      : "neutral";

  const girTone = metricTrend(filtered, "girPct");
  const fairwaysTone = metricTrend(filtered, "fairwaysPct");
  const puttsTone = metricTrend(filtered, "puttsAvg", true);
  const netTone = metricTrend(filtered, "net");

  if (rounds.length === 0) {
    return (
      <Card className="mt-6 border-dashed">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Flag className="size-5" />
          </div>
          <CardTitle>Sin datos para el dashboard</CardTitle>
          <CardDescription>
            Completá al menos una ronda para ver tu evolución.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Tabs
          variant="rounded"
          value={courseFilter}
          onValueChange={(value) => setCourseFilter(value as CourseFilter)}
        >
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Cancha
          </p>
          <TabsList>
            <TabsTrigger value="all" className="flex-1">
              Todas
            </TabsTrigger>
            {courseNames.map((name) => (
              <TabsTrigger key={name} value={name} className="flex-1">
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs
          variant="rounded"
          value={dateRange}
          onValueChange={(value) => setDateRange(value as DateRangeFilter)}
        >
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Período
          </p>
          <TabsList>
            <TabsTrigger value="3m" className="flex-1">
              3 meses
            </TabsTrigger>
            <TabsTrigger value="6m" className="flex-1">
              6 meses
            </TabsTrigger>
            <TabsTrigger value="12m" className="flex-1">
              12 meses
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1">
              Todo
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {bestRound && latestRound ? (
        <DashboardSection title="Destacados">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <HighlightCard
              label="Mejor ronda"
              gross={bestRound.gross}
              net={bestRound.net}
              meta={`${bestRound.label} · ${bestRound.courseName}`}
              tone="positive"
            />
            <HighlightCard
              label="Última ronda"
              gross={latestRound.gross}
              net={latestRound.net}
              meta={`${latestRound.label} · ${latestRound.courseName}`}
              tone={latestTone}
            />
          </div>
        </DashboardSection>
      ) : null}

      <DashboardSection title="Promedios">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 text-emerald-800">
            {filtered.length} {filtered.length === 1 ? "ronda" : "rondas"}
          </Badge>
          {trend ? (
            <Badge
              variant="outline"
              className={cn(
                trend.direction === "down"
                  ? "border-emerald-300 text-emerald-800"
                  : "border-amber-300 text-amber-800",
              )}
            >
              {trend.direction === "down" ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}
              {trend.direction === "down" ? "Mejorando" : "Subió el score"}
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <StatCard
            label="Prom. gross"
            value={avgGross !== null ? String(avgGross) : "—"}
            meta={trendHint}
            tone={grossTone}
          />
          <StatCard
            label="Prom. neto"
            value={avgNet !== null ? String(avgNet) : "—"}
            tone={netTone}
          />
          <StatCard
            label="Prom. GIR"
            value={avgGir !== null ? `${avgGir}%` : "—"}
            tone={girTone}
          />
          <StatCard
            label="Prom. fairways"
            value={avgFw !== null ? `${avgFw}%` : "—"}
            tone={fairwaysTone}
          />
          <StatCard
            label="Prom. putts"
            value={avgPutts !== null ? String(avgPutts) : "—"}
            tone={puttsTone}
          />
          <StatCard
            label="Rondas"
            value={String(filtered.length)}
            tone="neutral"
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Evolución">
        <div className="flex flex-col gap-4">
          <ScoreEvolutionChart
            data={filtered.map((p) => ({
              label: p.label,
              gross: p.gross,
              net: p.net,
            }))}
          />

          <EvolutionChart
            title="GIR %"
            description="Green in regulation por ronda"
            data={filtered.map((p) => ({ label: p.label, value: p.girPct }))}
            color="var(--chart-1)"
            unit="%"
            domain={[0, 100]}
          />

          <EvolutionChart
            title="Fairways %"
            description="Fairways acertados"
            data={filtered.map((p) => ({
              label: p.label,
              value: p.fairwaysPct,
            }))}
            color="var(--chart-2)"
            unit="%"
            domain={[0, 100]}
          />

          <EvolutionChart
            title="Putts"
            description="Promedio de putts por hoyo"
            data={filtered.map((p) => ({ label: p.label, value: p.puttsAvg }))}
            color="var(--chart-3)"
            domain={[0, 5]}
            lowerIsBetter
          />
        </div>
      </DashboardSection>
    </div>
  );
}
