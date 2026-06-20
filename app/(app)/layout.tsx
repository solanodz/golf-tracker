import { BottomNav } from "@/components/nav/bottom-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
      <div className="flex-1 px-2 pb-20">{children}</div>
      <BottomNav avatarUrl={avatarUrl} />
    </div>
  );
}
