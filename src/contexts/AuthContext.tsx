"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>
      {children}
    </ConvexAuthProvider>
  );
}

// Re-export Convex auth hooks for easy use throughout the app
export { useAuthActions } from "@convex-dev/auth/react";
export { useAuthToken } from "@convex-dev/auth/react";

// Custom hook to simulate useCurrentUser functionality
export function useCurrentUser() {
  const authToken = useAuthToken();
  // Return the token if authenticated, null if not authenticated, undefined if loading
  return authToken;
}

export function useConvexAuth() {
  const { signIn, signOut } = useAuthActions();
  const authToken = useAuthToken();
  
  return {
    isAuthenticated: !!authToken,
    isLoading: authToken === undefined,
    login: signIn,
    logout: signOut,
  };
