"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-3 text-[#9FB2CC]/70 hover:text-[#E7ECF5] hover:bg-[#162235]/50"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {locale}
          </span>
          <span className="sr-only">{t.common.language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#162235] border-[#1E3048]">
        <DropdownMenuItem
          onClick={() => setLocale("es")}
          className={locale === "es" ? "bg-accent text-foreground" : "text-[#E7ECF5]"}
        >
          {t.common.spanish}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale("en")}
          className={locale === "en" ? "bg-accent text-foreground" : "text-[#E7ECF5]"}
        >
          {t.common.english}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
