import { BottomNav } from "@/components/nav/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col">
      <div className="flex-1 px-2 pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
