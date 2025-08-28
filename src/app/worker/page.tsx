"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { toast } from "sonner";
import { 
  Package, 
  PackageOpen, 
  Plus, 
  RotateCcw,
  Search,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Filter,
  X,
  ArrowLeft
} from "lucide-react";

type ActionType = "pull" | "receive" | "return" | null;

interface Product {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
  category: string;
  imageUrl?: string;
  price: number;
}

export default function WorkerOperationsPage() {
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const products = useQuery(api.products.listProducts) || [];
  const projects = useQuery(api.projects.getActiveProjects) || [];

  // Mutations
  const pullInventory = useMutation(api.products.pullInventory);
  const receiveInventory = useMutation(api.products.receiveInventory);
  const returnInventory = useMutation(api.products.returnInventory);

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p._id === product._id);
      if (isSelected) {
        // Remove from selection and clear quantity
        const newQuantities = { ...quantities };
        delete newQuantities[product._id];
        setQuantities(newQuantities);
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const selectAllVisible = () => {
    const allVisible = filteredProducts.filter(p => !selectedProducts.some(sp => sp._id === p._id));
    setSelectedProducts(prev => [...prev, ...allVisible]);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setQuantities({});
  };

  const handleBulkOperation = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const itemsWithQuantity = selectedProducts.filter(product => {
      const qty = quantities[product._id];
      return qty && parseInt(qty) > 0;
    });

    if (itemsWithQuantity.length === 0) {
      toast.error("Please enter quantities for selected items");
      return;
    }

    if (!currentAction) {
      toast.error("Please select an action");
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const product of itemsWithQuantity) {
        const qty = parseInt(quantities[product._id]);
        
        try {
          switch (currentAction) {
            case "pull":
              if (qty > product.quantity) {
                toast.error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
                errorCount++;
                continue;
              }
              await pullInventory({
                productId: product._id,
                quantity: qty,
                notes: notes || `Worker pulled ${qty} ${product.unitOfMeasure} of ${product.name}`,
              });
              break;
              
            case "receive":
              await receiveInventory({
                productId: product._id,
                quantity: qty,
                unitPrice: 1, // Default price - will be updated by supervisor
                notes: notes || `Worker received ${qty} ${product.unitOfMeasure} of ${product.name} - Price to be updated`,
              });
              break;
              
            case "return":
              await returnInventory({
                productId: product._id,
                quantity: qty,
                notes: notes || `Worker returned ${qty} ${product.unitOfMeasure} of ${product.name}`,
              });
              break;
          }
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        const actionName = currentAction === "pull" ? "pulled" : 
                         currentAction === "receive" ? "received" : "returned";
        toast.success(`✅ Successfully ${actionName} ${successCount} items!`);
      }
      
      if (errorCount > 0) {
        toast.error(`❌ Failed to process ${errorCount} items`);
      }

      // Reset form
      setSelectedProducts([]);
      setQuantities({});
      setNotes("");
      setCurrentAction(null);
      
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setCurrentAction(null);
    setSelectedProducts([]);
    setQuantities({});
    setSearchTerm("");
    setSelectedCategory("all");
    setNotes("");
  };

  // Main interface
  return (
    <LoggedInLayout title="Worker Operations">
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Welcome Section */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Worker Operations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select multiple items and perform bulk operations efficiently
            </p>
          </div>

          {/* Action Selection */}
          {!currentAction && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50"
                onClick={() => setCurrentAction("pull")}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                    <PackageOpen className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">Take Out</h3>
                  <p className="text-muted-foreground text-lg">Remove items from inventory for project use</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-secondary/50"
                onClick={() => setCurrentAction("receive")}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                    <Plus className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">Stock In</h3>
                  <p className="text-muted-foreground text-lg">Add new stock received from vendors</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-accent/50"
                onClick={() => setCurrentAction("return")}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center shadow-xl mb-6">
                    <RotateCcw className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors">Return</h3>
                  <p className="text-muted-foreground text-lg">Return unused items back to inventory</p>
                </CardContent>
              </Card>
            </div>
          )}

        {currentAction && (
          <>
            {/* Action Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
                  {currentAction === "pull" && <><PackageOpen className="h-8 w-8 text-primary" />Take Out Items</>}
                  {currentAction === "receive" && <><Plus className="h-8 w-8 text-secondary" />Stock In Items</>}
                  {currentAction === "return" && <><RotateCcw className="h-8 w-8 text-accent" />Return Items</>}
                </h2>
                {selectedProducts.length > 0 && (
                  <p className="text-muted-foreground text-lg">
                    {selectedProducts.length} items selected
                  </p>
                )}
              </div>
              <Button
                onClick={resetAll}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Selection
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  onClick={selectAllVisible} 
                  variant="outline" 
                  className="h-12"
                  disabled={filteredProducts.length === 0}
                >
                  Select All
                </Button>
                <Button 
                  onClick={clearSelection} 
                  variant="outline" 
                  className="h-12"
                  disabled={selectedProducts.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.some(p => p._id === product._id);
                return (
                  <Card 
                    key={product._id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary/50 bg-primary/5' 
                        : 'hover:shadow-lg hover:border-primary/30'
                    }`}
                    onClick={() => toggleProductSelection(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product)}
                        />
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                      
                      <div className="text-center mb-3">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg mx-auto mb-2"
                          />
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-3 mb-2 w-12 h-12 mx-auto flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        
                        <h4 className="font-bold text-sm mb-1">{product.name}</h4>
                        <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <span className="text-sm font-medium">
                            {product.quantity} {product.unitOfMeasure}
                          </span>
                          {product.quantity < 10 && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          product.quantity >= 25 
                            ? 'bg-green-100 text-green-700' 
                            : product.quantity >= 10 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {product.quantity >= 25 ? '✓ Good' : 
                           product.quantity >= 10 ? '⚠ Low' : '⚠ Critical'}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="border-t pt-3">
                          <Label className="text-xs font-medium mb-1 block">
                            Quantity ({product.unitOfMeasure})
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={currentAction === "pull" ? product.quantity : undefined}
                            value={quantities[product._id] || ""}
                            onChange={(e) => handleQuantityChange(product._id, e.target.value)}
                            placeholder="0"
                            className="h-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {currentAction === "pull" && quantities[product._id] && 
                           parseInt(quantities[product._id]) > product.quantity && (
                            <p className="text-xs text-red-600 mt-1">
                              Max: {product.quantity}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">No items found</p>
              </div>
            )}

            {/* Bottom Actions */}
            {selectedProducts.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium mb-2 block">
                        Notes (Optional)
                      </Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this operation..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Button
                        onClick={handleBulkOperation}
                        size="lg"
                        className="w-full h-12 text-lg font-semibold"
                        disabled={isLoading || selectedProducts.length === 0}
                      >
                        {isLoading && "Processing..."}
                        {!isLoading && currentAction === "pull" && `📦 Take Out ${selectedProducts.length} Items`}
                        {!isLoading && currentAction === "receive" && `➕ Stock In ${selectedProducts.length} Items`}
                        {!isLoading && currentAction === "return" && `↩️ Return ${selectedProducts.length} Items`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Add padding to prevent content being hidden behind fixed bottom bar */}
            {selectedProducts.length > 0 && <div className="h-32"></div>}
          </>
        )}
        </div>
      </div>
    </LoggedInLayout>
  );
}
