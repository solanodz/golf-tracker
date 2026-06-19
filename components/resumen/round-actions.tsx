"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function RoundActions({
  roundId,
  playedOn,
}: {
  roundId: string;
  playedOn: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(playedOn);
  const [pending, setPending] = useState<"date" | "edit" | "delete" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveDate() {
    setPending("date");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ played_on: date })
      .eq("id", roundId);

    setPending(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  async function editRound() {
    setPending("edit");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("rounds")
      .update({ status: "in_progress" })
      .eq("id", roundId);

    if (updateError) {
      setError(updateError.message);
      setPending(null);
      return;
    }

    router.push(`/nueva-ronda/editar/${roundId}`);
    router.refresh();
  }

  async function deleteRound() {
    setPending("delete");
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("rounds")
      .delete()
      .eq("id", roundId);

    if (deleteError) {
      setError(deleteError.message);
      setPending(null);
      return;
    }

    router.push("/historial");
    router.refresh();
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">
            Fecha de la ronda
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
        <button
          type="button"
          onClick={saveDate}
          disabled={pending === "date" || date === playedOn}
          className="mt-3 h-10 w-full rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 disabled:opacity-50"
        >
          {pending === "date" ? "Guardando..." : "Guardar fecha"}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={editRound}
        disabled={pending !== null}
        className="h-12 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700"
      >
        {pending === "edit" ? "Abriendo..." : "Editar hoyos"}
      </button>

      {!confirmDelete ? (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="h-12 rounded-xl border border-red-200 text-sm font-medium text-red-700"
        >
          Borrar ronda
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            ¿Borrar esta ronda? No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={deleteRound}
              disabled={pending === "delete"}
              className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-medium text-white"
            >
              {pending === "delete" ? "Borrando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      <Link
        href="/nueva-ronda"
        className="flex h-12 items-center justify-center rounded-xl bg-emerald-700 font-semibold text-white"
      >
        Nueva ronda
      </Link>
    </div>
  );
}
