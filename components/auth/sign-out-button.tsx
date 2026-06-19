"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="h-12 w-full rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
    >
      Cerrar sesión
    </button>
  );
}
