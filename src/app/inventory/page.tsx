"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Camera, Upload, Package, Filter, BarChart3, FolderOpen, ArrowUpRight, DollarSign, Calculator, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface Product {
  _id: Id<"products">;
  name: string;
  sku: string;
  category: string;
  price: number; // Selling price
  quantity: number;
  
  // MAUC fields
  movingAverageCost: number;
  totalCostInStock: number;
  totalUnitsInStock: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: number;
  
  // Construction-specific fields
  unitOfMeasure: string; // "pcs", "tons", "m3", "m2", "kg", "lbs", etc.
  materialType?: string; // "steel", "concrete", "lumber", "electrical", etc.
  specifications?: string; // Technical specs, grade, etc.
  
  // Legacy fields
  description?: string;
  imageUrl?: string;
  costPrice?: number; // Deprecated in favor of MAUC
  reorderLevel?: number;
  supplier?: string;
  _creationTime: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unitPrice: string; // Single unit price field
  quantity: string;
  
  // Construction-specific fields
  unitOfMeasure: string;
  materialType: string;
  specifications: string;
  
  // Legacy fields
  description: string;
  reorderLevel: string;
  supplier: string;
}

export default function InventoryPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isBulkPullDialogOpen, setIsBulkPullDialogOpen] = useState(false);
  const [isBulkReturnDialogOpen, setIsBulkReturnDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("all"); // 'all', 'by-project'
  
  // Admin functionality states
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitAbbreviation, setUnitAbbreviation] = useState("");
  const [unitType, setUnitType] = useState("");
  const [bulkProjectId, setBulkProjectId] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkItems, setBulkItems] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: "",
    unitPrice: "",
    quantity: "",
    unitOfMeasure: "pcs",
    materialType: "",
    specifications: "",
    description: "",
    reorderLevel: "",
    supplier: "",
  });
  const [pullData, setPullData] = useState({ quantity: "", projectId: "", notes: "" });
  const [returnData, setReturnData] = useState({ quantity: "", projectId: "", notes: "" });
  const [receiveData, setReceiveData] = useState({ 
    quantity: "", 
    unitPrice: "", 
    reference: "",
    vendorId: "",
    deliveryReceiptNumber: "",
    notes: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const products = useQuery(api.products.listProducts);
  const projects = useQuery(api.projects.getActiveProjects);
  const allProjects = useQuery(api.projects.listProjects);
  const inventoryTransactions = useQuery(api.analytics.getDashboardAnalytics);
  const categories = useQuery(api.categories.listCategories);
  const units = useQuery(api.units.listUnits);
  
  const addProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const removeProduct = useMutation(api.products.deleteProduct);
  const pullInventory = useMutation(api.products.pullInventory);
  const returnInventory = useMutation(api.products.returnInventory);
  const receiveInventory = useMutation(api.products.receiveInventory);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  
  // Admin mutations
  const addCategory = useMutation(api.categories.addCategory);
  const addUnit = useMutation(api.units.addUnit);
  
  // Get current user to check admin privileges
  const currentUser = useQuery(api.users.current);

  // Get unique categories for filter (combine custom categories with product categories)
  const allCategories = categories ? categories.map(c => c.name) : [];
  const productCategories = products ? [...new Set(products.map(p => p.category))] : [];
  const combinedCategories = [...new Set([...allCategories, ...productCategories])];
  
  const filteredProducts = products?.filter(product => 
    selectedCategory === "all" || product.category === selectedCategory
  );
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Optimized form handlers to prevent re-renders
  const handleFormChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  }, []);

  const handleUnitChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, unitOfMeasure: value }));
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category: "",
      unitPrice: "",
      quantity: "",
      unitOfMeasure: "pcs",
      materialType: "",
      specifications: "",
      description: "",
      reorderLevel: "",
      supplier: "",
    });
  };
  
  const resetAdminForms = () => {
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("");
    setUnitName("");
    setUnitAbbreviation("");
    setUnitType("");
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
      resetAdminForms();
    } catch (error: any) {
      toast.error(error.message || "Failed to add category");
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
      resetAdminForms();
    } catch (error: any) {
      toast.error(error.message || "Failed to add unit");
    }
  };

  const handleBulkPull = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to pull");
      return;
    }

    const itemsToProcess = selectedProducts.filter(product => bulkItems[product._id] && parseInt(bulkItems[product._id]) > 0);
    
    if (itemsToProcess.length === 0) {
      toast.error("Please enter valid quantities for selected items");
      return;
    }

    setIsLoading(true);

    try {
      for (const product of itemsToProcess) {
        const quantity = parseInt(bulkItems[product._id]);
        
        if (quantity > product.quantity) {
          toast.error(`Insufficient stock for ${product.name}`);
          continue;
        }

        await pullInventory({
          productId: product._id,
          quantity,
          projectId: typeof bulkProjectId === "string" && bulkProjectId !== "" ? bulkProjectId as Id<"projects"> : undefined,
          notes: bulkNotes || undefined,
        });
      }
      
      toast.success(`Successfully pulled ${itemsToProcess.length} items`);
      setIsBulkPullDialogOpen(false);
      setSelectedProducts([]);
      setBulkItems({});
      setBulkProjectId("");
      setBulkNotes("");
    } catch (error) {
      toast.error("Failed to pull some items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReturn = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select products to return");
      return;
    }

    const itemsToProcess = selectedProducts.filter(product => bulkItems[product._id] && parseInt(bulkItems[product._id]) > 0);
    
    if (itemsToProcess.length === 0) {
      toast.error("Please enter valid quantities for selected items");
      return;
    }

    setIsLoading(true);

    try {
      for (const product of itemsToProcess) {
        const quantity = parseInt(bulkItems[product._id]);

        await returnInventory({
          productId: product._id,
          quantity,
          projectId: typeof bulkProjectId === "string" && bulkProjectId !== "" ? bulkProjectId as Id<"projects"> : undefined,
          notes: bulkNotes || undefined,
        });
      }
      
      toast.success(`Successfully returned ${itemsToProcess.length} items`);
      setIsBulkReturnDialogOpen(false);
      setSelectedProducts([]);
      setBulkItems({});
      setBulkProjectId("");
      setBulkNotes("");
    } catch (error) {
      toast.error("Failed to return some items");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p._id === product._id);
      if (isSelected) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleAddProduct = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.price.toString(),
      quantity: product.quantity.toString(),
      unitOfMeasure: product.unitOfMeasure || "pcs",
      materialType: product.materialType || "",
      specifications: product.specifications || "",
      description: product.description || "",
      reorderLevel: product.reorderLevel?.toString() || "",
      supplier: product.supplier || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handlePullInventory = (product: Product) => {
    setSelectedProduct(product);
    setPullData({ quantity: "", projectId: "", notes: "" });
    setIsPullDialogOpen(true);
  };

  const handleReturnInventory = (product: Product) => {
    setSelectedProduct(product);
    setReturnData({ quantity: "", projectId: "", notes: "" });
    setIsReturnDialogOpen(true);
  };

  const handleReceiveInventory = (product: Product) => {
    setSelectedProduct(product);
    setReceiveData({ 
      quantity: "", 
      unitPrice: "", 
      reference: "",
      vendorId: "",
      deliveryReceiptNumber: "",
      notes: "" 
    });
    setIsReceiveDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      // Save file record
      await saveFile({
        storageId,
        name: file.name,
        type: file.type,
        size: file.size,
      });

      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (isEdit: boolean = false) => {
    if (!formData.name || !formData.sku || !formData.category || !formData.unitPrice || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice);
    const quantity = parseInt(formData.quantity);
    const reorderLevel = formData.reorderLevel ? parseInt(formData.reorderLevel) : undefined;

    if (isNaN(unitPrice) || unitPrice < 0) {
      toast.error("Please enter a valid unit price");
      return;
    }

    if (isNaN(quantity) || quantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (reorderLevel !== undefined && (isNaN(reorderLevel) || reorderLevel < 0)) {
      toast.error("Please enter a valid reorder level");
      return;
    }

    setIsLoading(true);

    try {
      if (isEdit && selectedProduct) {
        await updateProduct({
          id: selectedProduct._id,
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: unitPrice,
          quantity,
          description: formData.description || undefined,
          costPrice: unitPrice, // Use unit price as cost price
          reorderLevel,
          supplier: formData.supplier || undefined,
        });
        toast.success("Product updated successfully!");
        setIsEditDialogOpen(false);
      } else {
        await addProduct({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          price: unitPrice,
          quantity,
          description: formData.description || undefined,
          costPrice: unitPrice, // Use unit price as cost price
          reorderLevel,
          supplier: formData.supplier || undefined,
          // Construction-specific fields
          unitOfMeasure: formData.unitOfMeasure,
          materialType: formData.materialType || undefined,
          specifications: formData.specifications || undefined,
          // MAUC initialization
          initialCost: unitPrice, // Use unit price for MAUC initialization
        });
        toast.success("Product added successfully!");
        setIsAddDialogOpen(false);
      }
      resetForm();
      setSelectedProduct(null);
    } catch (error) {
      toast.error(isEdit ? "Failed to update product" : "Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);

    try {
      await removeProduct({ id: selectedProduct._id });
      toast.success("Product deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!selectedProduct || !pullData.quantity) return;

    const quantity = parseInt(pullData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (quantity > selectedProduct.quantity) {
      toast.error("Insufficient stock");
      return;
    }

    setIsLoading(true);

    try {
      await pullInventory({
        productId: selectedProduct._id,
        quantity,
        projectId: typeof pullData.projectId === "string" && pullData.projectId !== "" ? pullData.projectId as Id<"projects"> : undefined,
        notes: pullData.notes || undefined,
      });
      toast.success("Inventory pulled successfully!");
      setIsPullDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to pull inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedProduct || !returnData.quantity) return;

    const quantity = parseInt(returnData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsLoading(true);

    try {
      await returnInventory({
        productId: selectedProduct._id,
        quantity,
        projectId: typeof returnData.projectId === "string" && returnData.projectId !== "" ? returnData.projectId as Id<"projects"> : undefined,
        notes: returnData.notes || undefined,
      });
      toast.success("Inventory returned successfully!");
      setIsReturnDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to return inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!selectedProduct || !receiveData.quantity || !receiveData.unitPrice) {
      toast.error("Please fill in quantity and unit price");
      return;
    }

    const quantity = parseInt(receiveData.quantity);
    const unitPrice = parseFloat(receiveData.unitPrice);
    
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      toast.error("Please enter a valid unit price");
      return;
    }

    setIsLoading(true);

    try {
      const result = await receiveInventory({
        productId: selectedProduct._id,
        quantity,
        unitPrice,
        reference: receiveData.reference || undefined,
        vendorId: typeof receiveData.vendorId === "string" && receiveData.vendorId !== "" ? receiveData.vendorId as Id<"vendors"> : undefined,
        deliveryReceiptNumber: receiveData.deliveryReceiptNumber || undefined,
        notes: receiveData.notes || undefined,
      });
      
      toast.success(
        <div>
          <div>Inventory received successfully!</div>
          <div className="text-xs mt-1">
            MAUC updated: ${result.previousMAUC.toFixed(4)} → ${result.newMAUC.toFixed(4)}
          </div>
        </div>
      );
      setIsReceiveDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to receive inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex space-x-4 items-center">
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  const ProductDialog = ({ isOpen, onClose, isEdit = false }: { 
    isOpen: boolean; 
    onClose: () => void; 
    isEdit?: boolean; 
  }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? "Update product information" : "Add a new product to your inventory"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter product name"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku" className="text-foreground">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter SKU"
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category" className="text-foreground">Category *</Label>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddCategoryDialogOpen(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {/* Custom categories from database */}
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category.name}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                  {/* Default fallback categories */}
                  <SelectItem value="Steel">Steel</SelectItem>
                  <SelectItem value="Concrete">Concrete</SelectItem>
                  <SelectItem value="Lumber">Lumber</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Drywall">Drywall</SelectItem>
                  <SelectItem value="Roofing">Roofing</SelectItem>
                  <SelectItem value="Insulation">Insulation</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="materialType" className="text-foreground">Material Type</Label>
              <Input
                id="materialType"
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                placeholder="e.g., Rebar, PVC, 2x4"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="unitOfMeasure" className="text-foreground">Unit of Measure *</Label>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddUnitDialogOpen(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
              <Select value={formData.unitOfMeasure} onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Custom units from database */}
                  {units?.map((unit) => (
                    <SelectItem key={unit._id} value={unit.abbreviation}>
                      {unit.name} ({unit.abbreviation})
                    </SelectItem>
                  ))}
                  {/* Default fallback units */}
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="tons">Tons</SelectItem>
                  <SelectItem value="lbs">Pounds</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="ft">Feet</SelectItem>
                  <SelectItem value="m">Meters</SelectItem>
                  <SelectItem value="m2">Square Meters</SelectItem>
                  <SelectItem value="m3">Cubic Meters</SelectItem>
                  <SelectItem value="sf">Square Feet</SelectItem>
                  <SelectItem value="cf">Cubic Feet</SelectItem>
                  <SelectItem value="gal">Gallons</SelectItem>
                  <SelectItem value="L">Liters</SelectItem>
                  <SelectItem value="rolls">Rolls</SelectItem>
                  <SelectItem value="sheets">Sheets</SelectItem>
                  <SelectItem value="bags">Bags</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="unitPrice" className="text-foreground">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0.00"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity" className="text-foreground">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="0"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderLevel" className="text-foreground">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                placeholder="10"
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="specifications" className="text-foreground">Specifications</Label>
              <Input
                id="specifications"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                placeholder="Grade, size, etc."
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier" className="text-foreground">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Supplier name"
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              className="bg-background"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-foreground">Product Image</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Take Photo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="hidden"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSubmit(isEdit)} 
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (isEdit ? "Update Product" : "Add Product")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <LoggedInLayout title="Inventory Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage your inventory items and stock levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open('/analytics', '_blank')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
            <Button onClick={handleAddProduct} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedProducts.length} selected
                </Badge>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBulkPullDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Bulk Pull
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsBulkReturnDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Bulk Return
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {combinedCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedView === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("all")}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Products View
            </Button>
            <Button
              variant={selectedView === "by-project" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView("by-project")}
              className="flex items-center gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              By Project View
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        {selectedView === "all" ? (
          /* Products Table */
          <div className="bg-card rounded-lg border border-border shadow-sm transition-colors duration-300">
            {filteredProducts === undefined ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(filteredProducts || []);
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      checked={selectedProducts.length === filteredProducts?.length && filteredProducts.length > 0}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>MAUC</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No products found. Add your first product to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProducts.some(p => p._id === product._id)}
                          onChange={() => toggleProductSelection(product)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(product)} className="font-medium">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div>{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(product)}>{product.sku}</TableCell>
                      <TableCell onClick={() => handleRowClick(product)}>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(product)}>${product.price.toFixed(2)}</TableCell>
                      <TableCell onClick={() => handleRowClick(product)}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            ${(product.movingAverageCost || product.costPrice || 0).toFixed(4)}
                          </span>
                          {product.lastPurchasePrice && (
                            <span className="text-xs text-muted-foreground">
                              Last: ${product.lastPurchasePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => handleRowClick(product)}>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            product.quantity < (product.reorderLevel || 10)
                              ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                              : product.quantity < 25
                              ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400"
                              : "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                          }`}
                        >
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-sm min-w-48">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProduct(product);
                              }}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePullInventory(product);
                              }}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Pull Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReturnInventory(product);
                              }}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Return Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReceiveInventory(product);
                              }}
                              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                            >
                              <Package className="mr-2 h-4 w-4" />
                              Receive Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product);
                              }}
                              className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 cursor-pointer transition-colors"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          /* By Project View */
          <div className="space-y-6">
            {/* Project Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allProjects?.slice(0, 6).map((project) => (
                <Card key={project._id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        {project.name}
                      </CardTitle>
                      <Badge 
                        className={project.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                                 project.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    {project.budget && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium">${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-2"
                        onClick={() => window.open(`/projects/${project._id}`, '_blank')}
                      >
                        <BarChart3 className="h-4 w-4" />
                        View Project Analytics
                        <ArrowUpRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Project Activities */}
            {inventoryTransactions?.recentActivity && inventoryTransactions.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Inventory Activities by Project
                  </CardTitle>
                  <CardDescription>
                    Latest inventory movements organized by project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryTransactions.recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            activity.type === 'pull' 
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{activity.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type === 'pull' ? 'Pulled' : 'Returned'} {Math.abs(activity.quantity)} units
                              {activity.project ? (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <FolderOpen className="h-3 w-3" />
                                  <span className="font-medium text-primary">{activity.project.name}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground ml-2">(No project assigned)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${(Math.abs(activity.quantity) * activity.unitPrice).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Add Product Dialog */}
        <ProductDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
        />

        {/* Edit Product Dialog */}
        <ProductDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          isEdit={true}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-card border-border shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. This will permanently delete{" "}
                <strong className="text-foreground">{selectedProduct?.name}</strong> from your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pull Inventory Dialog */}
        <Dialog open={isPullDialogOpen} onOpenChange={setIsPullDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pull Inventory - {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Pull inventory from stock for a project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pullQuantity">Quantity *</Label>
                <Input
                  id="pullQuantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.quantity}
                  value={pullData.quantity}
                  onChange={(e) => setPullData({ ...pullData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pullProject">Project (Optional)</Label>
                <Select value={pullData.projectId} onValueChange={(value) => setPullData({ ...pullData, projectId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pullNotes">Notes (Optional)</Label>
                <Textarea
                  id="pullNotes"
                  value={pullData.notes}
                  onChange={(e) => setPullData({ ...pullData, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPullDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePull} disabled={isLoading}>
                {isLoading ? "Pulling..." : "Pull Inventory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Inventory Dialog */}
        <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return Inventory - {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Return inventory to stock
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="returnQuantity">Quantity *</Label>
                <Input
                  id="returnQuantity"
                  type="number"
                  min="1"
                  value={returnData.quantity}
                  onChange={(e) => setReturnData({ ...returnData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="returnProject">Project (Optional)</Label>
                <Select value={returnData.projectId} onValueChange={(value) => setReturnData({ ...returnData, projectId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Project</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="returnNotes">Notes (Optional)</Label>
                <Textarea
                  id="returnNotes"
                  value={returnData.notes}
                  onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="Enter notes"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReturn} disabled={isLoading}>
                {isLoading ? "Returning..." : "Return Inventory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receive Inventory Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Receive Inventory - {selectedProduct?.name}</DialogTitle>
              <DialogDescription>
                Receive new stock and update Moving Average Unit Cost (MAUC)
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="receiveQuantity">Quantity *</Label>
                  <Input
                    id="receiveQuantity"
                    type="number"
                    min="1"
                    value={receiveData.quantity}
                    onChange={(e) => setReceiveData({ ...receiveData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={receiveData.unitPrice}
                    onChange={(e) => setReceiveData({ ...receiveData, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference (PO Number, etc.)</Label>
                <Input
                  id="reference"
                  value={receiveData.reference}
                  onChange={(e) => setReceiveData({ ...receiveData, reference: e.target.value })}
                  placeholder="Purchase order number, invoice, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deliveryReceipt">Delivery Receipt Number</Label>
                <Input
                  id="deliveryReceipt"
                  value={receiveData.deliveryReceiptNumber}
                  onChange={(e) => setReceiveData({ ...receiveData, deliveryReceiptNumber: e.target.value })}
                  placeholder="Delivery receipt number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receiveNotes">Notes (Optional)</Label>
                <Textarea
                  id="receiveNotes"
                  value={receiveData.notes}
                  onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                  placeholder="Enter notes about the receipt"
                  rows={3}
                />
              </div>
              {selectedProduct && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Current MAUC Information</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Current MAUC:</span>
                      <span className="font-medium">
                        ${(selectedProduct.movingAverageCost || selectedProduct.costPrice || 0).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Stock:</span>
                      <span>{selectedProduct.quantity} units</span>
                    </div>
                    {receiveData.quantity && receiveData.unitPrice && (
                      <div className="pt-2 border-t border-border mt-2">
                        <div className="flex justify-between text-primary">
                          <span>New Total Value:</span>
                          <span className="font-medium">
                            ${(
                              ((selectedProduct.movingAverageCost || selectedProduct.costPrice || 0) * selectedProduct.quantity) +
                              (parseFloat(receiveData.quantity) * parseFloat(receiveData.unitPrice))
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>New Total Units:</span>
                          <span className="font-medium">
                            {selectedProduct.quantity + parseInt(receiveData.quantity || "0")} units
                          </span>
                        </div>
                        <div className="flex justify-between text-primary font-medium">
                          <span>New MAUC:</span>
                          <span>
                            ${(
                              (((selectedProduct.movingAverageCost || selectedProduct.costPrice || 0) * selectedProduct.quantity) +
                              (parseFloat(receiveData.quantity) * parseFloat(receiveData.unitPrice))) /
                              (selectedProduct.quantity + parseInt(receiveData.quantity || "0"))
                            ).toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleReceive} disabled={isLoading}>
                {isLoading ? "Receiving..." : "Receive Inventory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedProduct && (
          <ProductDetailsDialog
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            product={selectedProduct}
          />
        )}
        
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
              <Button variant="outline" onClick={() => { setIsAddCategoryDialogOpen(false); resetAdminForms(); }}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>
                Add Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
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
              <Button variant="outline" onClick={() => { setIsAddUnitDialogOpen(false); resetAdminForms(); }}>
                Cancel
              </Button>
              <Button onClick={handleAddUnit}>
                Add Unit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Pull Dialog */}
        <Dialog open={isBulkPullDialogOpen} onOpenChange={setIsBulkPullDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Bulk Pull Inventory</DialogTitle>
              <DialogDescription>
                Pull multiple items from inventory for a project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkProject">Project (Optional)</Label>
                  <Select value={bulkProjectId} onValueChange={setBulkProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Project</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulkNotes">Notes (Optional)</Label>
                  <Input
                    id="bulkNotes"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="Enter notes"
                  />
                </div>
              </div>
              
              <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <h4 className="font-medium mb-3">Selected Items ({selectedProducts.length})</h4>
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div key={product._id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Available: {product.quantity} {product.unitOfMeasure}
                        </div>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          max={product.quantity}
                          placeholder="Qty"
                          value={bulkItems[product._id] || ""}
                          onChange={(e) => setBulkItems(prev => ({
                            ...prev,
                            [product._id]: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkPullDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkPull} disabled={isLoading}>
                {isLoading ? "Processing..." : "Pull Items"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Bulk Return Dialog */}
        <Dialog open={isBulkReturnDialogOpen} onOpenChange={setIsBulkReturnDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Bulk Return Inventory</DialogTitle>
              <DialogDescription>
                Return multiple items to inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkReturnProject">Project (Optional)</Label>
                  <Select value={bulkProjectId} onValueChange={setBulkProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Project</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulkReturnNotes">Notes (Optional)</Label>
                  <Input
                    id="bulkReturnNotes"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="Enter notes"
                  />
                </div>
              </div>
              
              <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <h4 className="font-medium mb-3">Selected Items ({selectedProducts.length})</h4>
                <div className="space-y-3">
                  {selectedProducts.map((product) => (
                    <div key={product._id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current Stock: {product.quantity} {product.unitOfMeasure}
                        </div>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={bulkItems[product._id] || ""}
                          onChange={(e) => setBulkItems(prev => ({
                            ...prev,
                            [product._id]: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkReturnDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkReturn} disabled={isLoading}>
                {isLoading ? "Processing..." : "Return Items"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LoggedInLayout>
  );
}

function ProductDetailsDialog({ isOpen, onClose, product }: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}) {
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 text-xl font-bold">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {product.imageUrl && (
              <div className="flex justify-center">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-32 h-32 rounded object-cover"
                />
              </div>
            )}
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="font-medium">SKU:</span>
                <span>{product.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Category:</span>
                <span>{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price:</span>
                <span>${product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Quantity:</span>
                <span>{product.quantity}</span>
              </div>
              {product.costPrice && (
                <div className="flex justify-between">
                  <span className="font-medium">Cost Price:</span>
                  <span>${product.costPrice.toFixed(2)}</span>
                </div>
              )}
              {product.reorderLevel && (
                <div className="flex justify-between">
                  <span className="font-medium">Reorder Level:</span>
                  <span>{product.reorderLevel}</span>
                </div>
              )}
              {product.supplier && (
                <div className="flex justify-between">
                  <span className="font-medium">Supplier:</span>
                  <span>{product.supplier}</span>
                </div>
              )}
              {product.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">Vendors</h3>
              <VendorsList productId={product._id} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPurchaseDialogOpen(true)}>Request Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isPurchaseDialogOpen && (
        <PurchaseDialog
          isOpen={isPurchaseDialogOpen}
          onClose={() => setIsPurchaseDialogOpen(false)}
          product={product}
        />
      )}
    </>
  );
}

function VendorsList({ productId }: { productId: Id<"products"> }) {
  const vendors = useQuery(api.vendors.getVendorsForProduct, { productId });

  if (vendors === undefined) {
    return <div>Loading...</div>;
  }

  if (vendors.length === 0) {
    return <p>No vendors found for this product.</p>;
  }

  return (
    <ul className="space-y-2">
      {vendors.map((vendor) => (
        <li key={vendor?._id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{vendor?.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{vendor?.email}</p>
          </div>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">${vendor?.price?.toFixed(2)}</p>
        </li>
      ))}
    </ul>
  );
}

function PurchaseDialog({ isOpen, onClose, product }: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}) {
  const [quantity, setQuantity] = useState(1);
  const sendEmail = useMutation(api.emails.sendPurchaseOrderEmail);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      await sendEmail({ productId: product._id, quantity });
      toast.success("Purchase request sent successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to send purchase request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-100 text-lg font-bold">Request Purchase for {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSendRequest} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
