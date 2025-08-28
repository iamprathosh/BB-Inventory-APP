"use client";

import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, Upload, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface Product {
  _id: Id<"products">;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  movingAverageCost: number;
  totalCostInStock: number;
  totalUnitsInStock: number;
  lastPurchasePrice?: number;
  lastPurchaseDate?: number;
  unitOfMeasure: string;
  materialType?: string;
  specifications?: string;
  description?: string;
  imageUrl?: string;
  costPrice?: number;
  reorderLevel?: number;
  supplier?: string;
  _creationTime: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  quantity: string;
  unitOfMeasure: string;
  materialType: string;
  specifications: string;
  description: string;
  reorderLevel: string;
  supplier: string;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  product?: Product | null;
  onSubmit: (formData: ProductFormData, isEdit: boolean) => Promise<void>;
}

// Memoized ProductDialog component to prevent unnecessary re-renders
const ProductDialog = memo<ProductDialogProps>(({ 
  isOpen, 
  onClose, 
  isEdit = false, 
  product = null,
  onSubmit 
}) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitAbbreviation, setUnitAbbreviation] = useState("");
  const [unitType, setUnitType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useQuery(api.categories.listCategories);
  const units = useQuery(api.units.listUnits);
  const currentUser = useQuery(api.users.current);
  
  const addCategory = useMutation(api.categories.addCategory);
  const addUnit = useMutation(api.units.addUnit);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  
  const isAdmin = currentUser?.role === 'admin';

  // Initialize form data when product changes (for edit mode)
  useEffect(() => {
    if (isEdit && product) {
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
    } else if (!isEdit) {
      // Reset form for new product
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
    }
  }, [isEdit, product, isOpen]);

  // SKU generation function
  const generateSKU = useCallback((category: string, name: string) => {
    if (!category || !name) return '';
    
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${categoryPrefix}-${cleanName}-${timestamp}`;
  }, []);

  // Optimized form field change handler
  const handleFieldChange = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate SKU when name or category changes (only for new products)
      if (!isEdit && (field === 'name' || field === 'category') && updated.name && updated.category) {
        updated.sku = generateSKU(updated.category, updated.name);
      }
      
      return updated;
    });
  }, [isEdit, generateSKU]);

  // Optimized category change handler
  const handleCategoryChange = useCallback((value: string) => {
    setFormData(prev => {
      const updated = { ...prev, category: value };
      
      // Auto-generate SKU when category changes and name exists (only for new products)
      if (!isEdit && updated.name) {
        updated.sku = generateSKU(value, updated.name);
      }
      
      return updated;
    });
  }, [isEdit, generateSKU]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.name || !formData.sku || !formData.category || !formData.unitPrice || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice);
    const quantity = parseInt(formData.quantity);
    const reorderLevel = formData.reorderLevel ? parseInt(formData.reorderLevel) : undefined;

    if (isNaN(unitPrice) || unitPrice < 0) {
      toast.error("Please enter a valid unit cost");
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
      await onSubmit(formData, isEdit);
      onClose();
    } catch (error) {
      toast.error(isEdit ? "Failed to update product" : "Failed to add product");
    } finally {
      setIsLoading(false);
    }
  }, [formData, isEdit, onSubmit, onClose]);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
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

  // Admin functions
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

  return (
    <>
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
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Enter product name"
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku" className="text-foreground">
                  SKU * {!isEdit && "(Auto-generated)"}
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => isEdit && handleFieldChange('sku', e.target.value)}
                  placeholder={isEdit ? "Enter SKU" : "Auto-generated from category and name"}
                  className={isEdit ? "bg-background" : "bg-muted text-muted-foreground cursor-not-allowed"}
                  readOnly={!isEdit}
                  disabled={!isEdit}
                />
                {!isEdit && (
                  <p className="text-xs text-muted-foreground">
                    SKU is automatically generated when you enter product name and category
                  </p>
                )}
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
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category._id} value={category.name}>
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </SelectItem>
                    ))}
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
                  onChange={(e) => handleFieldChange('materialType', e.target.value)}
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
                <Select value={formData.unitOfMeasure} onValueChange={(value) => handleFieldChange('unitOfMeasure', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units?.map((unit) => (
                      <SelectItem key={unit._id} value={unit.abbreviation}>
                        {unit.name} ({unit.abbreviation})
                      </SelectItem>
                    ))}
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="unitPrice" className="text-foreground">Unit Cost *</Label>
                  <div className="group relative">
                    <Calculator className="h-4 w-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-md shadow-lg text-sm text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      This will be used for both selling price and initial MAUC calculation
                    </div>
                  </div>
                </div>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => handleFieldChange('unitPrice', e.target.value)}
                  placeholder="0.00"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Single cost field used for selling price and MAUC initialization
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity" className="text-foreground">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange('quantity', e.target.value)}
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
                  onChange={(e) => handleFieldChange('reorderLevel', e.target.value)}
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
                  onChange={(e) => handleFieldChange('specifications', e.target.value)}
                  placeholder="Grade, size, etc."
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier" className="text-foreground">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
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
                onChange={(e) => handleFieldChange('description', e.target.value)}
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
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : (isEdit ? "Update Product" : "Add Product")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
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
            <Button variant="outline" onClick={() => setIsAddUnitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUnit}>
              Add Unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

ProductDialog.displayName = 'ProductDialog';

export default ProductDialog;
