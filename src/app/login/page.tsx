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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #153275 0%, #D10D38 30%, #0374EF 60%, #886DE8 80%, #EF7037 100%)'
      }}>
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-pulse" style={{
          background: 'linear-gradient(45deg, #F7C959, #EF7037)'
        }}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-lg opacity-20 animate-bounce" style={{
          background: 'linear-gradient(45deg, #886DE8, #0374EF)',
          animationDelay: '2s'
        }}></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full opacity-30 animate-ping" style={{
          background: 'linear-gradient(45deg, #D10D38, #153275)',
          animationDelay: '1s'
        }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-lg opacity-25 animate-pulse" style={{
          background: 'linear-gradient(45deg, #0374EF, #886DE8)',
          animationDelay: '3s'
        }}></div>
      </div>
      
      {/* Glass Card */}
      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10" style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(45deg, #D10D38, #153275)',
              boxShadow: '0 8px 32px rgba(209, 13, 56, 0.3)'
            }}>
              <span className="text-3xl font-bold text-white">B&B</span>
            </div>
          </div>
          <CardTitle className="font-heading text-4xl font-bold mb-2 text-white drop-shadow-lg">
            B&B Inventory
          </CardTitle>
          <CardDescription className="text-white/90 text-lg font-medium">
            {isSignUp ? "Create your account" : "Welcome back! Sign in to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-semibold text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 text-lg transition-all duration-200 focus:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Enter your email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-semibold text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 text-lg transition-all duration-200 focus:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                placeholder="Enter your password"
              />
            </div>

            <div className="space-y-4 pt-2">
              <Button 
                type="submit" 
                className="w-full text-white font-bold py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl transform active:scale-95"
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(45deg, #D10D38 0%, #153275 100%)',
                  border: 'none',
                  boxShadow: '0 8px 32px rgba(209, 13, 56, 0.4)',
                  borderRadius: '12px'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full py-4 font-semibold transition-all duration-300 hover:scale-105 text-white hover:text-white transform active:scale-95"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px'
                }}
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
