"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="first_name">Nombre</Label>
        <Input
          id="first_name"
          name="first_name"
          required
          defaultValue={profile.first_name ?? ""}
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="last_name">Apellido</Label>
        <Input
          id="last_name"
          name="last_name"
          required
          defaultValue={profile.last_name ?? ""}
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="handicap">HCP</Label>
        <Input
          id="handicap"
          name="handicap"
          type="number"
          required
          min={0}
          step={0.1}
          defaultValue={profile.handicap ?? ""}
          className="h-12"
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert>
          <AlertDescription className="text-emerald-700">
            Perfil actualizado.
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-12 bg-emerald-700 hover:bg-emerald-800"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
