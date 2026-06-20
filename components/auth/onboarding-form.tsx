"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClubPicker } from "@/components/profile/club-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Club } from "@/lib/database.types";
import { parseLocalizedNumber } from "@/lib/parse-number";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm({
  clubs,
}: {
  clubs: Pick<Club, "id" | "name">[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubId, setClubId] = useState(clubs.length === 1 ? clubs[0].id : "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

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
        club_id: clubId,
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="first_name">Nombre</Label>
        <Input
          id="first_name"
          name="first_name"
          required
          autoComplete="given-name"
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="last_name">Apellido</Label>
        <Input
          id="last_name"
          name="last_name"
          required
          autoComplete="family-name"
          className="h-12"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Club</Label>
        <ClubPicker clubs={clubs} value={clubId} onValueChange={setClubId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="handicap">HCP</Label>
        <Input
          id="handicap"
          name="handicap"
          type="text"
          required
          inputMode="decimal"
          placeholder="12,4"
          className="h-12"
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        disabled={pending || clubs.length === 0}
        className="mt-2 h-12 bg-emerald-700 text-base font-semibold hover:bg-emerald-800"
      >
        {pending ? "Guardando..." : "Empezar"}
      </Button>
    </form>
  );
}
