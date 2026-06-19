"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/database.types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const handicapRaw = String(formData.get("handicap") ?? "").trim();
    const handicap = Number(handicapRaw);

    if (!firstName || !lastName || Number.isNaN(handicap) || handicap < 0) {
      setError("Completá nombre, apellido y un HCP válido.");
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        handicap,
      })
      .eq("id", profile.id);

    setPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Nombre</span>
        <input
          name="first_name"
          required
          defaultValue={profile.first_name ?? ""}
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Apellido</span>
        <input
          name="last_name"
          required
          defaultValue={profile.last_name ?? ""}
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">HCP</span>
        <input
          name="handicap"
          type="number"
          required
          min={0}
          step={0.1}
          defaultValue={profile.handicap ?? ""}
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-700">Perfil actualizado.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
