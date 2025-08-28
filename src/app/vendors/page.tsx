"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LoggedInLayout } from "@/components/layout/LoggedInLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function VendorsPage() {
  const vendors = useQuery(api.vendors.listVendors);

  const VendorsSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex space-x-4 items-center">
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <LoggedInLayout title="Vendor Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage your vendors and their product pricing
          </p>
          <AddVendorDialog />
        </div>

        {/* Vendors Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm transition-colors duration-300">
          {vendors === undefined ? (
            <div className="p-6">
              <VendorsSkeleton />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No vendors found. Add your first vendor to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor._id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.email}</TableCell>
                      <TableCell>{vendor.phone || "N/A"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </LoggedInLayout>
  );
}

function AddVendorDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [prices, setPrices] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const products = useQuery(api.products.listProducts);
  const createVendor = useMutation(api.vendors.createVendor);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSelectedProducts([]);
    setPrices({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error("Please fill in name and email fields");
      return;
    }

    setIsLoading(true);

    try {
      await createVendor({
        name,
        email,
        phone: phone || undefined,
        products: selectedProducts.map(productId => ({
          productId: productId as any, // Type assertion for Convex ID
          price: parseFloat(prices[productId] || "0")
        })),
      });
      
      toast.success("Vendor added successfully!");
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to add vendor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Vendor</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new vendor to your system with their contact information and product pricing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-foreground">
                Vendor Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter vendor name"
                className="bg-background"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-foreground">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="bg-background"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="products" className="text-foreground">
                Products
              </Label>
              <select
                multiple
                className="w-full border border-border rounded-md p-2 bg-background text-foreground min-h-[100px] transition-colors"
                value={selectedProducts}
                onChange={(e) =>
                  setSelectedProducts(
                    Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    )
                  )
                }
              >
                {products?.map((product) => (
                  <option key={product._id} value={product._id} className="py-1">
                    {product.name} (SKU: {product.sku})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Hold Ctrl/Cmd to select multiple products
              </p>
            </div>
            {selectedProducts.map(productId => {
              const product = products?.find(p => p._id === productId);
              return (
                <div key={productId} className="grid gap-2">
                  <Label htmlFor={`price-${productId}`} className="text-foreground">
                    Price for {product?.name} ($)
                  </Label>
                  <Input
                    id={`price-${productId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={prices[productId] || ""}
                    onChange={(e) => setPrices({...prices, [productId]: e.target.value})}
                    placeholder="0.00"
                    className="bg-background"
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
