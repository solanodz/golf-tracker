"use client";

import { useMemo, useState } from "react";

import {
  EvolutionChart,
  ScoreEvolutionChart,
} from "@/components/dashboard/evolution-chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  averageMetric,
  buildEvolutionData,
  filterEvolutionData,
  type CourseFilter,
  type DashboardRound,
  type DateRangeFilter,
  uniqueCourseNames,
} from "@/lib/dashboard-stats";

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900">{value}</p>
    </div>
  );
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

  if (rounds.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="font-medium text-zinc-700">Sin datos para el dashboard</p>
        <p className="mt-1 text-sm text-zinc-500">
          Completá al menos una ronda para ver gráficos.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Tabs
          value={courseFilter}
          onValueChange={(value) => setCourseFilter(value as CourseFilter)}
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Cancha
          </p>
          <TabsList className="h-auto w-full flex-wrap">
            <TabsTrigger value="all" className="flex-1 text-xs">
              Todas
            </TabsTrigger>
            {courseNames.map((name) => (
              <TabsTrigger key={name} value={name} className="flex-1 text-xs">
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Tabs
          value={dateRange}
          onValueChange={(value) => setDateRange(value as DateRangeFilter)}
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Período
          </p>
          <TabsList className="w-full">
            <TabsTrigger value="3m" className="flex-1 text-xs">
              3 meses
            </TabsTrigger>
            <TabsTrigger value="6m" className="flex-1 text-xs">
              6 meses
            </TabsTrigger>
            <TabsTrigger value="12m" className="flex-1 text-xs">
              12 meses
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs">
              Todo
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Prom. gross"
          value={avgGross !== null ? String(avgGross) : "—"}
        />
        <SummaryCard
          label="Prom. neto"
          value={avgNet !== null ? String(avgNet) : "—"}
        />
        <SummaryCard
          label="Prom. GIR"
          value={avgGir !== null ? `${avgGir}%` : "—"}
        />
        <SummaryCard
          label="Prom. fairways"
          value={avgFw !== null ? `${avgFw}%` : "—"}
        />
        <SummaryCard
          label="Prom. putts"
          value={avgPutts !== null ? String(avgPutts) : "—"}
        />
        <SummaryCard
          label="Rondas"
          value={String(filtered.length)}
        />
      </div>

      <ScoreEvolutionChart
        data={filtered.map((p) => ({
          label: p.label,
          gross: p.gross,
          net: p.net,
        }))}
      />

      <EvolutionChart
        title="Evolución GIR %"
        data={filtered.map((p) => ({ label: p.label, value: p.girPct }))}
        color="#047857"
        unit="%"
        domain={[0, 100]}
      />

      <EvolutionChart
        title="Evolución Fairways %"
        data={filtered.map((p) => ({
          label: p.label,
          value: p.fairwaysPct,
        }))}
        color="#059669"
        unit="%"
        domain={[0, 100]}
      />

      <EvolutionChart
        title="Evolución Putts (promedio)"
        data={filtered.map((p) => ({ label: p.label, value: p.puttsAvg }))}
        color="#10b981"
        domain={[0, 5]}
      />
    </div>
  );
}
