import type { RoundStats } from "@/lib/round-stats";
import { formatPct } from "@/lib/round-stats";
import { Separator } from "@/components/ui/separator";

import { StatCard, StatRow, StatSection } from "./stat-cards";

export function RoundSummary({ stats }: { stats: RoundStats }) {
  return (
    <>
      <StatSection title="Score">
        <StatCard label="Gross" value={stats.gross} />
        <StatCard label="Neto" value={stats.net} />
        <StatCard label="Birdies" value={stats.birdies} />
        <StatCard label="Eagles" value={stats.eagles} />
        <StatCard label="Pars" value={stats.pars} />
        <StatCard label="Bogeys" value={stats.bogeys} />
        <StatCard label="Dobles bogeys" value={stats.doubleBogeys} />
        <StatCard label="Triple bogey +" value={stats.triplePlus} />
      </StatSection>

      <StatSection title="Driving">
        <StatCard
          label="Fairways"
          value={`${stats.fairwaysHit}/${stats.fairwaysTotal}`}
          sub={formatPct(stats.fairwaysPct)}
        />
        <StatCard
          label="Penalidades tee"
          value={stats.penaltiesFromTee}
        />
      </StatSection>

      <StatSection title="Approach">
        <StatCard
          label="GIR"
          value={`${stats.gir}/${stats.girTotal}`}
          sub={formatPct(stats.girPct)}
        />
      </StatSection>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Putting
          </h2>
          <Separator className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <StatRow label="Putts totales" value={stats.puttsTotal} />
          <StatRow label="Promedio putts" value={stats.puttsAvg} />
          <StatRow label="3 putts o más" value={stats.threePuttsPlus} />
        </div>
      </section>
    </>
  );
}
