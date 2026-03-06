import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, Code2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name, slug)")
    .eq("id", user?.id)
    .single();

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, primary_domain")
    .order("name");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and organization settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{profile?.full_name || "Not set"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{profile?.email || user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline" className="capitalize">{profile?.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
            <CardDescription>Your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{profile?.organizations?.name || "Not set"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Slug</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{profile?.organizations?.slug}</code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Lead API
          </CardTitle>
          <CardDescription>Integrate lead capture from external websites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                Documentation for the lead submission API endpoint.
              </p>
              <p className="text-xs text-muted-foreground">
                Includes examples for all brands and copy-paste form code.
              </p>
            </div>
            <Link href="/app/settings/api-docs">
              <Button variant="outline" size="sm" className="gap-2">
                View Docs
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Brands */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Brands
          </CardTitle>
          <CardDescription>Managed brands in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {brands && brands.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="p-4 rounded-xl bg-muted/30 border border-border/50"
                >
                  <h3 className="font-medium text-foreground">{brand.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {brand.primary_domain || brand.slug}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No brands configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Brands will appear here once they are set up.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
