"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface User {
  userId: string;
  username: string;
  signInDetails?: {
    loginId?: string;
  };
}

interface UserProfile {
  id: string;
  userId: string;
  email: string | null;
  name: string | null;
  role?: string | null;
  organizationId?: string | null;
  agoraUsername?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { userId: { eq: userId } },
      });

      if (profiles && profiles.length > 0) {
        setUserProfile(profiles[0]);
        return profiles[0];
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const createUserProfile = async (cognitoUser: User) => {
    try {
      const { data: newProfile } = await client.models.UserProfile.create({
        userId: cognitoUser.userId,
        email: cognitoUser.signInDetails?.loginId || "",
        name: cognitoUser.username || "",
        agoraUsername: cognitoUser.username || cognitoUser.signInDetails?.loginId?.split("@")[0] || "",
        role: "EMPLOYEE", // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setUserProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
  };

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Fetch or create user profile
      let profile = await fetchUserProfile(currentUser.userId);
      if (!profile) {
        profile = await createUserProfile(currentUser);
      }

      setIsLoading(false);
    } catch {
      setUser(null);
      setUserProfile(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted) {
        await checkAuth();
      }
    };
    
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
      await fetchUserProfile(user.userId);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
      router.push("/auth/login");
    } catch (error: unknown) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        isAuthenticated: !!user,
        signOut: handleSignOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
