"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/lib/i18n";

interface AppTopbarProps {
  organizationName: string;
  userName: string;
}

export function AppTopbar({ organizationName, userName }: AppTopbarProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{organizationName}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{userName}</span>
        <LanguageSelector />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t.nav.logout}
        </Button>
      </div>
    </header>
  );
}
