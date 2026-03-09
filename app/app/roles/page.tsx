import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function RolesPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">
          Manage roles and access control.
        </p>
      </div>
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Coming soon
          </CardTitle>
          <CardDescription>
            This module is not yet implemented. Role and permission management will be available here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder page to avoid 404 from sidebar. Replace with real roles UI when ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
