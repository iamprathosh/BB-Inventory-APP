"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvexAuth } from "@/contexts/AuthContext";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  LogOut,
  Menu,
  Users,
  FolderOpen,
  Wrench,
  DollarSign,
  Settings,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface LoggedInLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function LoggedInLayout({ children, title = "Dashboard" }: LoggedInLayoutProps) {
  const { isAuthenticated, isLoading, logout } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.current);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Base navigation items
  const baseNavigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
      description: "Manage products, categories & units"
    },
    {
      name: "Worker Ops",
      href: "/worker",
      icon: Wrench,
      description: "Take Out, Stock In, Return"
    },
    {
      name: "Projects",
      href: "/projects",
      icon: FolderOpen,
    },
    {
      name: "Vendors",
      href: "/vendors",
      icon: Users,
    },
    {
      name: "Logs",
      href: "/logs",
      icon: FileText,
    },
  ];

  // Admin-only navigation items
  const adminNavigationItems = [
    {
      name: "Admin Setup",
      href: "/admin-setup",
      icon: Settings,
      description: "Manage users, roles & system settings"
    },
  ];

  // Combine navigation items based on user role
  const navigationItems = currentUser?.role === 'admin' 
    ? [...baseNavigationItems, ...adminNavigationItems]
    : baseNavigationItems;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-secondary dark:bg-slate-900 shadow-2xl border-r border-border transition-colors duration-300">
        <div className="flex h-20 items-center justify-center border-b border-white/10 dark:border-slate-700 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="font-heading text-lg font-bold text-secondary-foreground leading-tight">
              <span className="text-primary">Build</span><span className="text-accent">Buddy</span>
            </h1>
            <p className="text-xs text-secondary-foreground/70">Inventory System</p>
          </div>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-secondary-foreground font-medium hover:bg-white/20 dark:hover:bg-slate-700/50 transition-all duration-200 group border border-transparent hover:border-white/30 dark:hover:border-slate-600 hover:text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="group-hover:translate-x-1 transition-transform duration-200">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="h-16 bg-card dark:bg-slate-800 border-b-4 border-primary shadow-lg flex items-center justify-between px-6 transition-colors duration-300">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {title}
          </h2>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUser?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin-setup')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Setup
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 bg-background transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
