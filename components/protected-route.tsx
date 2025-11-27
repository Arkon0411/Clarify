"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { Loader2 } from "lucide-react";

// Configure Amplify - outputs will be available after running 'npx ampx sandbox'
if (typeof window !== 'undefined') {
  import('@/amplify_outputs.json')
    .then((outputs) => Amplify.configure(outputs.default || outputs))
    .catch(() => console.warn("amplify_outputs.json not found. Run 'npx ampx sandbox' to generate it."));
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        console.error("User not authenticated:", error);
        setIsAuthenticated(false);
        router.push("/auth");
      }
    }
    checkAuth();
  }, [router]);

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
