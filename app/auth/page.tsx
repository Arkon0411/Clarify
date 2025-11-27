"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signInWithRedirect, signOut, fetchUserAttributes } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { IntlProvider, FormattedMessage } from "react-intl";
import { messages } from "../translations";

// Configure Amplify - outputs will be available after running 'npx ampx sandbox'
if (typeof window !== 'undefined') {
  import('@/amplify_outputs.json')
    .then((outputs) => Amplify.configure(outputs.default || outputs))
    .catch(() => console.warn("amplify_outputs.json not found. Run 'npx ampx sandbox' to generate it."));
}

function AuthComponent() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function checkUserAuthentication() {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const attributes = await fetchUserAttributes();
        const displayName = attributes.email || currentUser.username || currentUser.userId;
        setUsername(displayName);
        return true;
      }
    } catch (error) {
      console.error("Error getting current user:", error);
      setUsername(null);
      return false;
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      await checkUserAuthentication();
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleSignInWithAuth0 = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithRedirect({
        provider: { custom: "Auth0" },
      });
    } catch (error) {
      console.error("Error signing in:", error);
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUsername(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-sm border-border">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold text-foreground">
              <FormattedMessage id="welcome" values={{ username }} />
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              You are successfully authenticated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => (window.location.href = "/meetings")}
              className="w-full"
              variant="default"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={handleSignOut}
              className="w-full"
              variant="outline"
            >
              <FormattedMessage id="signOut" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-foreground">
            Welcome to Clarify
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your meetings and tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSignInWithAuth0}
            disabled={isAuthenticating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <FormattedMessage id="signInWithAuth0" />
            )}
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            onClick={handleSignInWithAuth0}
            disabled={isAuthenticating}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isAuthenticating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FormattedMessage id="signInWithEmail" />
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <IntlProvider messages={messages["en"]} locale="en" defaultLocale="en">
      <AuthComponent />
    </IntlProvider>
  );
}
