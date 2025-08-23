"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvexAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface LoggedInLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function LoggedInLayout({ children, title = "Dashboard" }: LoggedInLayoutProps) {
  const { isAuthenticated, isLoading, logout } = useConvexAuth();
  const router = useRouter();

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

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "Logs",
      href: "/logs",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FBFBFB 0%, #FFFFFF 100%)' }}>
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 shadow-2xl" style={{ background: 'linear-gradient(180deg, #153275 0%, #0d2455 100%)' }}>
        <div className="flex h-20 items-center justify-center border-b border-white/10 px-4">
          <img 
            src="/images/logo/logo-full-white.png" 
            alt="B&B Logo" 
            className="h-12 w-auto"
            onError={(e) => {
              // Fallback to text if image fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <h1 className="font-heading text-xl font-bold text-white hidden">B&B Inventory</h1>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-white font-medium hover:bg-white/20 transition-all duration-200 group border border-transparent hover:border-white/30"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="group-hover:translate-x-1 transition-transform">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="h-16 shadow-lg flex items-center justify-between px-6" style={{
          background: 'linear-gradient(90deg, #FFFFFF 0%, #F7F7F7 100%)',
          borderBottom: '3px solid #D10D38'
        }}>
          <h2 className="font-heading text-2xl font-bold" style={{ color: '#153275' }}>
            {title}
          </h2>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
