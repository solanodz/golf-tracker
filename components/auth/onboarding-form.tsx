"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function OnboardingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesión expirada. Volvé a ingresar.");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        handicap,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    router.replace("/nueva-ronda");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Nombre</span>
        <input
          name="first_name"
          required
          autoComplete="given-name"
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">Apellido</span>
        <input
          name="last_name"
          required
          autoComplete="family-name"
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
          inputMode="decimal"
          placeholder="12.4"
          className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-base outline-none ring-emerald-500 focus:ring-2"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-xl bg-emerald-700 text-base font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Empezar"}
      </button>
    </form>
  );
}
