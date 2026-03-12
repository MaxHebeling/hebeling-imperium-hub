import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Company-first Reino Editorial AI Review surface.
// TODO: Integrate Reino Editorial AI Engine (editorial stage validation,
// automated style checks, ortotipografía review) into this page.
export default function ReinoEditorialAIPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <Link
          href="/app/companies/reino-editorial"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Reino Editorial
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Reino Editorial — AI Review</h1>
        <p className="text-sm text-muted-foreground">
          AI-assisted editorial review and stage validation
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">AI Review Engine</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI Review is being configured for this company context. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
