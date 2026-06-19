export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-400">{sub}</p> : null}
    </div>
  );
}

export function StatSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

export function StatRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <span className="text-sm text-zinc-600">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
