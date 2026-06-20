"use client";

import {
  CirclePlus,
  History,
  LayoutDashboard,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/nueva-ronda", label: "Nueva Ronda", icon: CirclePlus },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/historial", label: "Historial", icon: History },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({ avatarUrl }: { avatarUrl?: string | null }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const showAvatar = tab.href === "/perfil" && avatarUrl;

          return (
            <Button
              key={tab.href}
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "h-16 flex-col gap-1 rounded-none px-1 text-[0.7rem] font-medium",
                active
                  ? "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Link href={tab.href} aria-current={active ? "page" : undefined}>
                {showAvatar ? (
                  <Avatar
                    className={cn(
                      "size-5 after:rounded-full",
                      active && "ring-2 ring-emerald-700 ring-offset-1",
                    )}
                  >
                    <AvatarImage
                      src={avatarUrl}
                      alt=""
                      className="rounded-full object-cover"
                    />
                    <AvatarFallback className="rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-800">
                      <User className="size-3" strokeWidth={2} />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-emerald-700" : "text-muted-foreground",
                    )}
                    strokeWidth={active ? 2.25 : 2}
                  />
                )}
                <span>{tab.label}</span>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
