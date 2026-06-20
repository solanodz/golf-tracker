import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { ProfileForm } from "@/components/profile/profile-form";
import { displayName } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: clubs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("clubs").select("id, name").order("name"),
  ]);

  if (!profile) {
    redirect("/onboarding");
  }

  const clubName =
    clubs?.find((club) => club.id === profile.club_id)?.name ?? null;

  return (
    <main className="py-6">
      <header className="mb-10 flex flex-col items-center text-center">
        <AvatarUpload
          userId={user.id}
          avatarUrl={profile.avatar_url}
          fallbackLabel={profile.first_name?.[0]?.toUpperCase() ?? "?"}
        />

        <div className="mt-5 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {displayName(profile)}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {clubName || profile.handicap !== null ? (
            <p className="pt-1 text-sm font-medium text-emerald-800">
              {[profile.handicap !== null ? `HCP ${profile.handicap}` : null, clubName]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      </header>

      <section className="border-t pt-8">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-700">
          Editar perfil
        </h2>
        <ProfileForm profile={profile} clubs={clubs ?? []} />
      </section>

      <div className="mt-10 border-t pt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
