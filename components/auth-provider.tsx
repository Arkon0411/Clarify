"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, fetchUserAttributes, signOut, AuthUser } from "aws-amplify/auth";
import { Amplify } from "aws-amplify";

// Configure Amplify - outputs will be available after running 'npx ampx sandbox'
if (typeof window !== 'undefined') {
  import('@/amplify_outputs.json')
    .then((outputs) => Amplify.configure(outputs.default || outputs))
    .catch(() => console.warn("amplify_outputs.json not found. Run 'npx ampx sandbox' to generate it."));
}

interface AuthContextType {
  user: AuthUser | null;
  userAttributes: Record<string, string> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userAttributes, setUserAttributes] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes as Record<string, string>);
    } catch {
      setUser(null);
      setUserAttributes(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const signOutUser = async () => {
    try {
      await signOut();
      setUser(null);
      setUserAttributes(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await loadUser();
  };

  const value: AuthContextType = {
    user,
    userAttributes,
    isLoading,
    isAuthenticated: !!user,
    signOutUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
