"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  FolderOpen,
  Database,
  RefreshCw,
  Building2
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const analytics = useQuery(api.analytics.getDashboardAnalytics);
  const projects = useQuery(api.projects.listProjects);
  const products = useQuery(api.products.listProducts);
  const importVendors = useMutation(api.importVendors.importVendorsFromExcel);
  const createSampleData = useMutation(api.sampleData.createSampleData);
  const [isCreatingSampleData, setIsCreatingSampleData] = useState(false);
  const [isImportingVendors, setIsImportingVendors] = useState(false);

  const handleCreateSampleData = async () => {
    setIsCreatingSampleData(true);
    try {
      await createSampleData();
    } finally {
      setIsCreatingSampleData(false);
    }
  };

  const handleImportVendors = async () => {
    setIsImportingVendors(true);
    try {
      const result = await importVendors();
      console.log('Import result:', result);
    } finally {
      setIsImportingVendors(false);
    }
  };


  return (
    <LoggedInLayout title="Home">
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          <div className="space-y-12">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to BuildBuddy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your construction management platform for projects and inventory
            </p>
            
            {/* Test Red Color Visibility */}
            <div className="flex justify-center gap-4 mt-6">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Primary Action (Red)
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                Hard-coded Red Test
              </Button>
              <Button className="bg-primary-red hover:bg-primary-red/90 text-white">
                Primary Red Test
              </Button>
              <div className="px-4 py-2 bg-primary/10 border-2 border-primary rounded-lg">
                <span className="text-primary font-semibold">B&B Red Color Test</span>
              </div>
              <div className="px-4 py-2 bg-red-100 border-2 border-red-600 rounded-lg">
                <span className="text-red-600 font-semibold">Hard-coded Red Test</span>
              </div>
              <div className="px-4 py-2 bg-primary-red/10 border-2 border-primary-red rounded-lg">
                <span className="text-primary-red font-semibold">Primary Red Hex Test</span>
              </div>
            </div>
          </div>

          {/* Setup Actions */}
          {(products?.length === 0 || analytics?.kpis.totalProducts === 0) && (
            <Card className="border-dashed border-2 border-primary/20 max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Database className="h-12 w-12 text-primary/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Set up your system with sample data and import your vendor database.
                </p>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleCreateSampleData} 
                    disabled={isCreatingSampleData}
                    className="flex items-center gap-2"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${isCreatingSampleData ? 'animate-spin' : ''}`} />
                    {isCreatingSampleData ? 'Creating...' : 'Create Sample Data'}
                  </Button>
                  <Button 
                    onClick={handleImportVendors} 
                    disabled={isImportingVendors}
                    className="flex items-center gap-2"
                  >
                    <Database className={`h-4 w-4 ${isImportingVendors ? 'animate-pulse' : ''}`} />
                    {isImportingVendors ? 'Importing...' : 'Import Vendors'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Module Cards */}
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Projects Card */}
            <Card 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
              onClick={() => router.push('/projects')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">Projects</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Manage your construction projects
                  </CardDescription>
                </div>
                <FolderOpen className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{projects?.length || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Active construction projects
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Click to manage projects, timelines, and budgets</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Inventory Card */}
            <Card 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
              onClick={() => router.push('/inventory')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">Inventory</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Manage construction materials & supplies
                  </CardDescription>
                </div>
                <Package className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{products?.length || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Construction materials in stock
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>Materials, vendors, analytics, and cost tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    </LoggedInLayout>
  );
}
