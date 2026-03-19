"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clipboard, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IKINGDOM_BRIEF_URL } from "@/lib/ikingdom-office";

interface BriefLinkCardProps {
  title?: string;
  description?: string;
}

export function BriefLinkCard({
  title = "Brief general listo para enviar",
  description = "Comparta este enlace con cualquier prospecto que solicite cotización y estudio arquitectónico digital.",
}: BriefLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(IKINGDOM_BRIEF_URL);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="border-[#C8A84B]/30 bg-gradient-to-br from-[#1C2533] via-card to-[#121926] text-card-foreground shadow-lg">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[#C8A84B]/15 p-2 text-[#E6CA7A]">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base text-white">{title}</CardTitle>
              <CardDescription className="mt-1 text-slate-300">
                {description}
              </CardDescription>
            </div>
          </div>
          <Badge className="border-[#C8A84B]/30 bg-[#C8A84B]/10 text-[#E6CA7A]">
            Link oficial
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">URL</p>
          <p className="mt-2 break-all font-mono text-sm text-white">{IKINGDOM_BRIEF_URL}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={copyLink}
            className="bg-[#C8A84B] text-slate-950 hover:bg-[#d5b96f]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
          <Button variant="outline" asChild className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href={IKINGDOM_BRIEF_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir brief
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
