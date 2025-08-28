"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useConvexAuth } from "@/contexts/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { isAuthenticated, isLoading: authLoading, login } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For now, we'll simulate authentication
      // In a real app, you'd integrate with Convex Auth or another auth provider
      if (isSignUp) {
        // Simulate user creation
        toast.success("Account created successfully! Please log in.");
        setIsSignUp(false);
      } else {
        // Simulate login
        // In a real implementation, you'd validate credentials here
        await login();
        toast.success("Logged in successfully!");
        router.push("/");
      }
    } catch (error) {
      toast.error(isSignUp ? "Failed to create account" : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300 relative">
      {/* Theme toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md shadow-lg border bg-card transition-colors duration-300">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-primary shadow-lg transition-colors duration-300">
              <span className="text-2xl font-bold text-primary-foreground">B&B</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold mb-2 text-foreground">
            B&B Inventory
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
                placeholder="Enter your password"
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button 
                type="submit" 
                className="w-full bg-[#D10D38] hover:bg-[#B8082F] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#0374EF] text-[#0374EF] hover:bg-[#0374EF] hover:text-white"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
