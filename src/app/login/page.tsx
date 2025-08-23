"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #153275 0%, #D10D38 50%, #0374EF 100%)'
    }}>
      <Card className="w-full max-w-md shadow-2xl border-0" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)'
      }}>
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/logo/logo-full-white.png" 
              alt="B&B Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
              style={{ filter: 'brightness(0) invert(0.2)' }}
            />
          </div>
          <CardTitle className="font-heading text-3xl font-bold" style={{ color: '#153275' }}>
            B&B Inventory
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full text-white font-bold py-3 text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(45deg, #D10D38 0%, #153275 100%)',
                  border: 'none'
                }}
              >
                {isLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Log In")}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full py-3 font-semibold transition-all duration-200 hover:scale-105"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                style={{
                  borderColor: '#0374EF',
                  color: '#0374EF',
                  backgroundColor: 'rgba(3, 116, 239, 0.1)'
                }}
              >
                {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
