"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/spinner";

const publicPaths = ["/auth/login", "/auth/register", "/auth/verify", "/auth/forgot-password", "/setup/organization"];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicPaths.includes(pathname)) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If not authenticated and not on public path, don't render
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null;
  }

  // If authenticated but no organization and not creating one, redirect to org setup
  if (
    isAuthenticated &&
    userProfile &&
    !userProfile.organizationId &&
    pathname !== "/setup/organization"
  ) {
    router.push("/setup/organization");
    return null;
  }

  return <>{children}</>;
}
