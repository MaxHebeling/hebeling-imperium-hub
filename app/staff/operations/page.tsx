// TODO: LEGACY SURFACE — /staff/operations
// This route is a legacy entry point for the editorial operations interface.
// It is pending migration to the company-first route:
//   /app/companies/reino-editorial/operations
// Do NOT add new features here. Once the company-first migration is fully
// validated, this route will be redirected and eventually removed.

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StaffOperationsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Editorial operations management — legacy staff view
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base text-amber-800 dark:text-amber-400">
              Legacy Surface
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This page is a legacy surface. The primary entry point for editorial
            operations has moved to the company-first route.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/companies/reino-editorial/operations">
              Go to Reino Editorial Operations →
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
