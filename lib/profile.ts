import type { Profile } from "@/lib/database.types";

export function isProfileComplete(profile: Pick<
  Profile,
  "first_name" | "last_name" | "handicap"
> | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.first_name?.trim() &&
      profile.last_name?.trim() &&
      profile.handicap !== null &&
      profile.handicap >= 0,
  );
}

export function displayName(profile: Pick<
  Profile,
  "first_name" | "last_name"
> | null): string {
  if (!profile?.first_name) return "Jugador";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
}
