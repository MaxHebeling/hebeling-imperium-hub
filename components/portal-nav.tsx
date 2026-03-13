"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { LogOut, BookMarked, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/portal/editorial/projects", label: "Mis Libros", icon: BookMarked },
  { href: "/portal/overview", label: "Resumen", icon: BookOpen },
];

interface PortalNavProps {
  userEmail?: string | null;
}

export function PortalNav({ userEmail }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client-login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a3a6b]/20 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/80">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal/editorial/projects" className="flex items-center gap-2">
              <Image
                src="/logo-reino-editorial.png"
                alt="Reino Editorial"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-sm text-white tracking-tight">Reino Editorial</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5",
                      isActive
                        ? "bg-[#1a3a6b]/20 text-cyan-400"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-white/30 hidden sm:inline truncate max-w-40">
                {userEmail}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white/40 hover:text-white hover:bg-white/5 h-8 px-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5 text-xs">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a3a6b]/20 bg-[#0a0a0a]/95 backdrop-blur px-4 pb-safe">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 text-xs font-medium transition-colors py-1 px-3",
                  isActive ? "text-cyan-400" : "text-white/30"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 text-xs font-medium text-white/30 py-1 px-3"
          >
            <LogOut className="h-5 w-5" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
