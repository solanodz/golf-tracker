import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <main className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Perfil</h1>
        <p className="mt-1 text-zinc-600">{displayName(profile)}</p>
        <p className="text-sm text-zinc-500">{user.email}</p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
          {profile.first_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="text-sm text-zinc-500">
          Avatar: próximo paso (subida de imagen).
        </p>
      </div>

      <ProfileForm profile={profile} />

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
