"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { User, Shield, Settings, Plus, Trash2, Package, Ruler } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminSetupPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  // Category management states
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  
  // Unit management states
  const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
  const [isDeleteUnitDialogOpen, setIsDeleteUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [unitName, setUnitName] = useState("");
  const [unitAbbreviation, setUnitAbbreviation] = useState("");
  const [unitType, setUnitType] = useState("");
  
  // Queries
  const users = useQuery(api.users.listUsers);
  const currentUser = useQuery(api.users.current);
  const categories = useQuery(api.categories.listCategories);
  const units = useQuery(api.units.listUnits);
  
  // Mutations
  const updateUserRole = useMutation(api.users.updateUserRole);
  const addCategory = useMutation(api.categories.addCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const addUnit = useMutation(api.units.addUnit);
  const deleteUnit = useMutation(api.units.deleteUnit);
  
  // Check if there are any existing admins
  const existingAdmins = users?.filter(user => user.role === 'admin') || [];
  const canSetupAdmin = existingAdmins.length === 0 || currentUser?.role === 'admin';

  const handleUpdateRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Please select a user and role");
      return;
    }

    try {
      await updateUserRole({
        userId: selectedUserId as Id<"users">,
        role: selectedRole,
      });
      
      toast.success(`User role updated to ${selectedRole}!`);
      setSelectedUserId("");
      setSelectedRole("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };
  
  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    try {
      await addCategory({
        name: categoryName,
        description: categoryDescription || undefined,
        icon: categoryIcon || undefined,
      });
      
      toast.success("Category added successfully!");
      setIsAddCategoryDialogOpen(false);
      setCategoryName("");
      setCategoryDescription("");
      setCategoryIcon("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await deleteCategory({ id: categoryToDelete._id });
      toast.success("Category deleted successfully!");
      setIsDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };
  
  const handleAddUnit = async () => {
    if (!unitName.trim() || !unitAbbreviation.trim() || !unitType.trim()) {
      toast.error("All unit fields are required");
      return;
    }
    
    try {
      await addUnit({
        name: unitName,
        abbreviation: unitAbbreviation,
        type: unitType,
      });
      
      toast.success("Unit added successfully!");
      setIsAddUnitDialogOpen(false);
      setUnitName("");
      setUnitAbbreviation("");
      setUnitType("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add unit");
    }
  };
  
  const handleDeleteUnit = async () => {
    if (!unitToDelete) return;
    
    try {
      await deleteUnit({ id: unitToDelete._id });
      toast.success("Unit deleted successfully!");
      setIsDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete unit");
    }
  };

  if (!canSetupAdmin) {
    return (
      <LoggedInLayout title="Admin Setup">
        <div className="min-h-[70vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-red-700">Access Denied</CardTitle>
              <CardDescription>
                Only administrators can access this page.
                {existingAdmins.length === 0 && (
                  <span className="block mt-2 text-muted-foreground">No admin users exist yet. Contact your system administrator.</span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </LoggedInLayout>
    );
  }

  return (
    <LoggedInLayout title="Admin Setup">
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-2">
              <Settings className="h-10 w-10 text-primary" />
              System Administration
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage users, roles, categories, and system configuration
            </p>
          </div>

        {/* Role Assignment Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assign User Role
            </CardTitle>
            <CardDescription>
              Select a user and assign them a role in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select User</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{user.name}</span>
                            {user.role && (
                              <Badge variant="secondary" className="ml-2">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        {users === undefined ? "Loading users..." : "No users found"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Select Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-500" />
                        Admin - Full access
                      </div>
                    </SelectItem>
                    <SelectItem value="supervisor">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Supervisor - Manage operations
                      </div>
                    </SelectItem>
                    <SelectItem value="worker">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-500" />
                        Worker - Basic operations
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleUpdateRole} 
              className="w-full"
              disabled={!selectedUserId || !selectedRole}
            >
              Update User Role
            </Button>
          </CardContent>
        </Card>

        {/* Current Users List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Users</CardTitle>
            <CardDescription>
              All users in the system and their current roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users?.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        Joined: {new Date(user._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    {user.role ? (
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : 
                               user.role === 'supervisor' ? 'default' : 'secondary'}
                      >
                        {user.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline">No role assigned</Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {!users || users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {users === undefined ? "Loading users..." : "No users found. Users will appear here after they log in for the first time."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Category Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Categories
            </CardTitle>
            <CardDescription>
              Add, remove, and manage product categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Current Categories ({categories?.length || 0})</h3>
              <Button 
                onClick={() => setIsAddCategoryDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories?.map((category) => (
                <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-lg">{category.icon}</span>}
                    <div>
                      <p className="font-medium text-sm">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryToDelete(category);
                      setIsDeleteCategoryDialogOpen(true);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {!categories || categories.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500">
                  {categories === undefined ? "Loading categories..." : "No categories found. Add your first category!"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Unit Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Manage Units of Measure
            </CardTitle>
            <CardDescription>
              Add, remove, and manage units of measurement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Current Units ({units?.length || 0})</h3>
              <Button 
                onClick={() => setIsAddUnitDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Unit
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {units?.map((unit) => (
                <div key={unit._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{unit.name} ({unit.abbreviation})</p>
                    <p className="text-xs text-gray-500 capitalize">{unit.type}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUnitToDelete(unit);
                      setIsDeleteUnitDialogOpen(true);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {!units || units.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500">
                  {units === undefined ? "Loading units..." : "No units found. Add your first unit!"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Add a new category for products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Cement, Steel, Tools"
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">Description (Optional)</Label>
              <Input
                id="categoryDescription"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="categoryIcon">Icon (Optional)</Label>
              <Select value={categoryIcon} onValueChange={setCategoryIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="🏗️">🏗️ Construction</SelectItem>
                  <SelectItem value="🔨">🔨 Tools</SelectItem>
                  <SelectItem value="🧱">🧱 Materials</SelectItem>
                  <SelectItem value="⚡">⚡ Electrical</SelectItem>
                  <SelectItem value="🔧">🔧 Hardware</SelectItem>
                  <SelectItem value="🎯">🎯 Safety</SelectItem>
                  <SelectItem value="📦">📦 General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddCategoryDialogOpen(false);
              setCategoryName("");
              setCategoryDescription("");
              setCategoryIcon("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteCategoryDialogOpen(false);
              setCategoryToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Unit Dialog */}
      <Dialog open={isAddUnitDialogOpen} onOpenChange={setIsAddUnitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Add a new unit of measure
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unitName">Unit Name *</Label>
              <Input
                id="unitName"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g., Kilogram, Piece, Meter"
              />
            </div>
            <div>
              <Label htmlFor="unitAbbreviation">Abbreviation *</Label>
              <Input
                id="unitAbbreviation"
                value={unitAbbreviation}
                onChange={(e) => setUnitAbbreviation(e.target.value)}
                placeholder="e.g., kg, pcs, m"
              />
            </div>
            <div>
              <Label htmlFor="unitType">Unit Type *</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight">Weight</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="length">Length</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddUnitDialogOpen(false);
              setUnitName("");
              setUnitAbbreviation("");
              setUnitType("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddUnit}>
              Add Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Unit Dialog */}
      <AlertDialog open={isDeleteUnitDialogOpen} onOpenChange={setIsDeleteUnitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the unit "{unitToDelete?.name} ({unitToDelete?.abbreviation})"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteUnitDialogOpen(false);
              setUnitToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </LoggedInLayout>
  );
}
