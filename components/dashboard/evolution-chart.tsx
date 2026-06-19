"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  label: string;
  value: number | null;
};

export function EvolutionChart({
  title,
  data,
  color = "#047857",
  unit = "",
  domain,
}: {
  title: string;
  data: ChartPoint[];
  color?: string;
  unit?: string;
  domain?: [number, number];
}) {
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({ label: d.label, value: d.value as number }));

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-800">{title}</h3>
        <p className="py-8 text-center text-sm text-zinc-500">
          Sin datos para este filtro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">{title}</h3>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value}${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScoreEvolutionChart({
  data,
}: {
  data: { label: string; gross: number; net: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-800">
          Evolución score
        </h3>
        <p className="py-8 text-center text-sm text-zinc-500">
          Sin datos para este filtro.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">
        Evolución score
      </h3>
      <div className="mb-3 flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          Gross
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Neto
        </span>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#71717a" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="gross"
              name="Gross"
              stroke="#047857"
              strokeWidth={2}
              dot={{ r: 4, fill: "#047857", strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="net"
              name="Neto"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 4, fill: "#34d399", strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
