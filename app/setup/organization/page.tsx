"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const client = generateClient<Schema>();

export default function OrganizationSetupPage() {
  const router = useRouter();
  const { user, refreshUserProfile } = useAuth();
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      // Create organization
      const { data: newOrg, errors: orgErrors } = await client.models.Organization.create({
        name: orgName,
        ownerId: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (orgErrors || !newOrg) {
        throw new Error(orgErrors?.[0]?.message || "Failed to create organization");
      }

      // Update user profile with organization ID and set as PROJECT_MANAGER
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { userId: { eq: user.userId } },
      });

      if (profiles && profiles.length > 0) {
        await client.models.UserProfile.update({
          id: profiles[0].id,
          organizationId: newOrg.id,
          role: "PROJECT_MANAGER",
          updatedAt: new Date().toISOString(),
        });
      }

      // Refresh user profile in context
      await refreshUserProfile();

      // Redirect to dashboard
      router.push("/");
    } catch (err: unknown) {
      console.error("Error creating organization:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create organization. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to start managing meetings and tasks
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll be able to invite team members after creating your organization
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || !orgName.trim()}>
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
