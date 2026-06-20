"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { useId, useMemo, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type ChartPoint = {
  label: string;
  value: number | null;
};

const CHART_HEIGHT = "h-[210px]";
const CHART_MARGIN = { top: 4, right: 6, left: 0, bottom: 20 };

const X_AXIS_TICK = { fontSize: 10, fill: "var(--color-muted-foreground)" };
const Y_AXIS_TICK = {
  fontSize: 10,
  fill: "var(--color-muted-foreground)",
  textAnchor: "end" as const,
};

const scoreChartConfig = {
  gross: { label: "Gross", color: "var(--chart-1)" },
  net: { label: "Neto", color: "var(--chart-2)" },
} satisfies ChartConfig;

function ChartXAxis() {
  return (
    <XAxis
      dataKey="label"
      tickLine={false}
      axisLine={false}
      tickMargin={4}
      tick={X_AXIS_TICK}
      interval="preserveStartEnd"
      padding={{ left: 8, right: 8 }}
    />
  );
}

function ChartYAxis({
  domain,
  tickFormatter,
}: {
  domain: [number, number];
  tickFormatter?: (value: number) => string;
}) {
  return (
    <YAxis
      domain={domain}
      width={40}
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      allowDataOverflow={false}
      tickCount={4}
      tick={Y_AXIS_TICK}
      tickFormatter={tickFormatter}
    />
  );
}

function tightYDomain(
  values: number[],
  bounds?: { min?: number; max?: number },
): [number, number] {
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  if (minVal === maxVal) {
    const bump = bounds?.min !== undefined ? 2 : 4;
    let lo = minVal - bump;
    let hi = maxVal + bump;
    if (bounds?.min !== undefined) lo = Math.max(bounds.min, lo);
    if (bounds?.max !== undefined) hi = Math.min(bounds.max, hi);
    return [lo, hi];
  }

  const span = maxVal - minVal;
  const pad = Math.max(span * 0.05, bounds ? 2 : 3);

  let lo = minVal - pad;
  let hi = maxVal + pad;

  if (bounds?.min !== undefined) lo = Math.max(bounds.min, lo);
  if (bounds?.max !== undefined) hi = Math.min(bounds.max, hi);

  if (hi <= lo) hi = lo + 1;

  return bounds
    ? [Math.floor(lo), Math.ceil(hi)]
    : [Math.floor(lo * 10) / 10, Math.ceil(hi * 10) / 10];
}

function GradientDefs({ id, colorVar }: { id: string; colorVar: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={colorVar} stopOpacity={0.7} />
      <stop offset="50%" stopColor={colorVar} stopOpacity={0.2} />
      <stop offset="78%" stopColor={colorVar} stopOpacity={0} />
    </linearGradient>
  );
}

function ChartLegendInline({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartRangeFooter({
  labels,
  trend,
  lowerIsBetter = false,
  trendUnit = "",
}: {
  labels: string[];
  trend?: { diff: number; direction: "up" | "down" } | null;
  lowerIsBetter?: boolean;
  trendUnit?: string;
}) {
  const range =
    labels.length > 1
      ? `${labels[0]} – ${labels[labels.length - 1]}`
      : labels[0] ?? "";

  const improving =
    trend &&
    (lowerIsBetter ? trend.direction === "down" : trend.direction === "up");

  const trendText =
    trend &&
    (improving
      ? `Mejorando · ${trend.diff}${trendUnit}`
      : trend.direction === "up"
        ? `Subió ${trend.diff}${trendUnit}`
        : `Bajó ${trend.diff}${trendUnit}`);

  if (!trendText && !range) return null;

  return (
    <CardFooter className="border-t px-3 py-2">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-snug">
        {trend && trendText ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              improving ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {improving ? (
              <TrendingUp className="size-3 shrink-0" />
            ) : (
              <TrendingDown className="size-3 shrink-0" />
            )}
            {trendText}
          </span>
        ) : null}
        {trendText && range ? (
          <span className="text-muted-foreground">·</span>
        ) : null}
        {range ? (
          <span className="text-muted-foreground">{range}</span>
        ) : null}
      </div>
    </CardFooter>
  );
}

function computeTrend(values: number[]) {
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];
  const diff = Math.round((last - first) * 10) / 10;

  if (diff === 0) return null;

  return {
    diff: Math.abs(diff),
    direction: diff > 0 ? ("up" as const) : ("down" as const),
  };
}

function ChartCard({
  title,
  subtitle,
  legend,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-3 pb-0 pt-2.5">
        <div className="min-w-0">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {subtitle ? (
            <CardDescription className="text-[11px]">{subtitle}</CardDescription>
          ) : null}
        </div>
        {legend}
      </CardHeader>
      <CardContent className="px-0.5 pb-0 pt-1">{children}</CardContent>
      {footer}
    </Card>
  );
}

export function EvolutionChart({
  title,
  description,
  data,
  color = "var(--chart-1)",
  unit = "",
  domain,
  lowerIsBetter = false,
}: {
  title: string;
  description?: string;
  data: ChartPoint[];
  color?: string;
  unit?: string;
  domain?: [number, number];
  lowerIsBetter?: boolean;
}) {
  const chartId = useId().replace(/:/g, "");
  const fillId = `fillValue-${chartId}`;

  const chartConfig = {
    value: { label: title, color },
  } satisfies ChartConfig;

  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({ label: d.label, value: d.value as number }));

  const trend = useMemo(
    () => computeTrend(chartData.map((d) => d.value)),
    [chartData],
  );

  const yDomain = useMemo(() => {
    const values = chartData.map((d) => d.value);
    if (domain) {
      return tightYDomain(values, { min: domain[0], max: domain[1] });
    }
    return tightYDomain(values);
  }, [chartData, domain]);

  const baseValue = yDomain[0];

  if (chartData.length === 0) {
    return (
      <ChartCard title={title} subtitle={description}>
        <CardDescription className="px-3 py-10 text-center">
          Sin datos para este filtro.
        </CardDescription>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={title}
      subtitle={description}
      footer={
        <ChartRangeFooter
          labels={chartData.map((d) => d.label)}
          trend={trend}
          lowerIsBetter={lowerIsBetter}
          trendUnit={unit}
        />
      }
    >
      <ChartContainer config={chartConfig} className={cn("w-full", CHART_HEIGHT)}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={CHART_MARGIN}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <ChartXAxis />
          <ChartYAxis
            domain={yDomain}
            tickFormatter={
              unit === "%"
                ? (value) => `${Math.round(value)}%`
                : (value) => Number(value).toFixed(1)
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => `${value}${unit}`}
              />
            }
          />
          <defs>
            <GradientDefs id={fillId} colorVar="var(--color-value)" />
          </defs>
          <Area
            dataKey="value"
            type="monotone"
            baseValue={baseValue}
            fill={`url(#${fillId})`}
            fillOpacity={1}
            stroke="var(--color-value)"
            strokeWidth={2.5}
            dot={{
              r: 3,
              fill: "var(--color-value)",
              strokeWidth: 0,
            }}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function ScoreEvolutionChart({
  data,
}: {
  data: { label: string; gross: number; net: number }[];
}) {
  const chartId = useId().replace(/:/g, "");
  const fillGrossId = `fillGross-${chartId}`;
  const fillNetId = `fillNet-${chartId}`;

  const trend = useMemo(
    () => computeTrend(data.map((d) => d.gross)),
    [data],
  );

  const yDomain = useMemo(() => {
    const values = data.flatMap((d) => [d.gross, d.net]);
    return tightYDomain(values);
  }, [data]);

  if (data.length === 0) {
    return (
      <ChartCard title="Score" subtitle="Gross vs neto por ronda">
        <CardDescription className="px-3 py-10 text-center">
          Sin datos para este filtro.
        </CardDescription>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Score"
      subtitle="Gross vs neto por ronda"
      legend={
        <ChartLegendInline
          items={[
            { label: "Gross", color: "var(--chart-1)" },
            { label: "Neto", color: "var(--chart-2)" },
          ]}
        />
      }
      footer={
        <ChartRangeFooter
          labels={data.map((d) => d.label)}
          trend={trend}
          lowerIsBetter
          trendUnit=" golpes"
        />
      }
    >
      <ChartContainer
        config={scoreChartConfig}
        className={cn("w-full", CHART_HEIGHT)}
      >
        <AreaChart accessibilityLayer data={data} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <ChartXAxis />
          <ChartYAxis
            domain={yDomain}
            tickFormatter={(value) => String(Math.round(value))}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <GradientDefs id={fillGrossId} colorVar="var(--color-gross)" />
            <GradientDefs id={fillNetId} colorVar="var(--color-net)" />
          </defs>
          <Area
            dataKey="gross"
            type="monotone"
            baseValue={yDomain[0]}
            fill={`url(#${fillGrossId})`}
            fillOpacity={1}
            stroke="var(--color-gross)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-gross)", strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Area
            dataKey="net"
            type="monotone"
            baseValue={yDomain[0]}
            fill={`url(#${fillNetId})`}
            fillOpacity={1}
            stroke="var(--color-net)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-net)", strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
