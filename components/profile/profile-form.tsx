"use client";

import { useState } from "react";

import { ClubPicker } from "@/components/profile/club-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Club, Profile } from "@/lib/database.types";
import { parseLocalizedNumber } from "@/lib/parse-number";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  profile,
  clubs,
}: {
  profile: Profile;
  clubs: Pick<Club, "id" | "name">[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clubId, setClubId] = useState(profile.club_id ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const handicapRaw = String(formData.get("handicap") ?? "").trim();
    const handicap = parseLocalizedNumber(handicapRaw);

    if (
      !firstName ||
      !lastName ||
      !clubId ||
      Number.isNaN(handicap) ||
      handicap < 0
    ) {
      setError("Completá nombre, apellido, club y un HCP válido.");
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
        club_id: clubId,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="handicap">HCP</Label>
        <Input
          id="handicap"
          name="handicap"
          type="text"
          required
          inputMode="decimal"
          defaultValue={profile.handicap ?? ""}
          className="h-12 sm:max-w-[8rem]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Club</Label>
        <ClubPicker clubs={clubs} value={clubId} onValueChange={setClubId} />
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
        disabled={pending || clubs.length === 0}
        className="h-12 bg-emerald-700 hover:bg-emerald-800"
      >
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
