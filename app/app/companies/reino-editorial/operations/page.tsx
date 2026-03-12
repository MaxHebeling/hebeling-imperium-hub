import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Company-first Reino Editorial Operations surface.
// TODO: Build out team assignments, deadline tracking, and editorial
// operations dashboards scoped to Reino Editorial.
export default function ReinoEditorialOperationsPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Reino Editorial — Operations</h1>
        <p className="text-sm text-muted-foreground">
          Team assignments, deadlines, and editorial operations
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Operations Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Operations management for Reino Editorial is being configured. Check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
