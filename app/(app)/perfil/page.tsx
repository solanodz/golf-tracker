import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <main className="py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Perfil</CardTitle>
          <CardDescription>{displayName(profile)}</CardDescription>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-emerald-100 text-xl font-bold text-emerald-800">
              {profile.first_name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm text-muted-foreground">
            Avatar: próximo paso (subida de imagen).
          </p>
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      <ProfileForm profile={profile} />

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}
