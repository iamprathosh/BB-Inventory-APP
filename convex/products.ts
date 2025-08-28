import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .order("desc")
      .collect();
    return products;
  },
});

export const getProductsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();
    return products;
  },
});

export const getProduct = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    return product;
  },
});

// Generate auto SKU
export const generateSKU = mutation({
  args: {
    category: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get category prefix (first 3 letters, uppercase)
    const categoryPrefix = args.category.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    
    // Get name prefix (first 3 letters, uppercase)
    const namePrefix = args.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    
    // Get current count of products to generate sequence number
    const products = await ctx.db.query("products").collect();
    const sequenceNumber = String(products.length + 1).padStart(4, '0');
    
    // Generate timestamp-based suffix for uniqueness
    const timestamp = Date.now().toString().slice(-4);
    
    // Combine to create SKU: CAT-NAM-0001-1234
    const sku = `${categoryPrefix}-${namePrefix}-${sequenceNumber}-${timestamp}`;
    
    return sku;
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()), // Make SKU optional for auto-generation
    quantity: v.number(),
    price: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    costPrice: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    supplier: v.optional(v.string()),
    // Construction-specific fields
    unitOfMeasure: v.optional(v.string()),
    materialType: v.optional(v.string()),
    specifications: v.optional(v.string()),
    // MAUC initialization
    initialCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Auto-generate SKU if not provided
    let sku = args.sku;
    if (!sku) {
      // Get category prefix (first 3 letters, uppercase)
      const categoryPrefix = args.category.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
      
      // Get name prefix (first 3 letters, uppercase)
      const namePrefix = args.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
      
      // Get current count of products to generate sequence number
      const products = await ctx.db.query("products").collect();
      const sequenceNumber = String(products.length + 1).padStart(4, '0');
      
      // Generate timestamp-based suffix for uniqueness
      const timestamp = Date.now().toString().slice(-4);
      
      // Combine to create SKU: CAT-NAM-0001-1234
      sku = `${categoryPrefix}-${namePrefix}-${sequenceNumber}-${timestamp}`;
    }

    // Initialize MAUC fields
    const initialCost = args.initialCost || args.costPrice || args.price;
    
    // Create the product
    const productId = await ctx.db.insert("products", {
      name: args.name,
      sku: sku,
      quantity: args.quantity,
      price: args.price,
      category: args.category,
      description: args.description,
      imageUrl: args.imageUrl,
      costPrice: args.costPrice,
      reorderLevel: args.reorderLevel,
      supplier: args.supplier,
      // Construction-specific fields
      unitOfMeasure: args.unitOfMeasure || "pcs",
      materialType: args.materialType,
      specifications: args.specifications,
      // MAUC fields
      movingAverageCost: initialCost,
      totalCostInStock: args.quantity * initialCost,
      totalUnitsInStock: args.quantity,
      lastPurchasePrice: initialCost,
      lastPurchaseDate: Date.now(),
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Product Added",
      details: `Added product: ${args.name} (SKU: ${sku})`,
    });

    return productId;
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    sku: v.string(),
    quantity: v.number(),
    price: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    costPrice: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    supplier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Update the product
    await ctx.db.patch(args.id, {
      name: args.name,
      sku: args.sku,
      quantity: args.quantity,
      price: args.price,
      category: args.category,
      description: args.description,
      imageUrl: args.imageUrl,
      costPrice: args.costPrice,
      reorderLevel: args.reorderLevel,
      supplier: args.supplier,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Product Updated",
      details: `Updated product: ${args.name} (SKU: ${args.sku})`,
    });

    return args.id;
  },
});

export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get product details for logging
    const product = await ctx.db.get(args.id);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete the product
    await ctx.db.delete(args.id);

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Product Deleted",
      details: `Deleted product: ${product.name} (SKU: ${product.sku})`,
    });

    return args.id;
  },
});

export const pullInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    projectId: v.optional(v.id("projects")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if enough stock
    if (product.quantity < args.quantity) {
      throw new Error("Insufficient stock");
    }

    // Update product quantity
    await ctx.db.patch(args.productId, {
      quantity: product.quantity - args.quantity,
    });

    // Create transaction record
    await ctx.db.insert("inventoryTransactions", {
      productId: args.productId,
      projectId: args.projectId,
      type: "pull",
      quantity: -args.quantity, // Negative for pulls
      unitPrice: product.price,
      date: Date.now(),
      userId: user._id,
      notes: args.notes,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Inventory Pulled",
      details: `Pulled ${args.quantity} units of ${product.name} (SKU: ${product.sku})`,
      projectId: args.projectId,
    });

    return args.productId;
  },
});

export const returnInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    projectId: v.optional(v.id("projects")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Update product quantity
    await ctx.db.patch(args.productId, {
      quantity: product.quantity + args.quantity,
    });

    // Create transaction record
    await ctx.db.insert("inventoryTransactions", {
      productId: args.productId,
      projectId: args.projectId,
      type: "return",
      quantity: args.quantity, // Positive for returns
      unitPrice: product.price,
      date: Date.now(),
      userId: user._id,
      notes: args.notes,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Inventory Returned",
      details: `Returned ${args.quantity} units of ${product.name} (SKU: ${product.sku})`,
      projectId: args.projectId,
    });

    return args.productId;
  },
});

export const receiveInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
    reference: v.optional(v.string()),
    vendorId: v.optional(v.id("vendors")),
    deliveryReceiptNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get product
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate MAUC (Moving Average Unit Cost)
    // Formula: (Current Inventory Value + New Purchase Value) / (Current Quantity + New Quantity)
    
    // Initialize MAUC fields if they don't exist yet
    const currentMAUC = product.movingAverageCost ?? product.costPrice ?? 0;
    const totalCostInStock = product.totalCostInStock ?? (currentMAUC * product.quantity);
    const totalUnitsInStock = product.totalUnitsInStock ?? product.quantity;
    
    // Calculate new values for receiving inventory
    const newPurchaseValue = args.quantity * args.unitPrice;
    const newTotalCostInStock = totalCostInStock + newPurchaseValue;
    const newTotalUnitsInStock = totalUnitsInStock + args.quantity;
    const newMAUC = newTotalUnitsInStock > 0 ? newTotalCostInStock / newTotalUnitsInStock : 0;

    // Update product with new quantity and MAUC values
    await ctx.db.patch(args.productId, {
      quantity: product.quantity + args.quantity,
      movingAverageCost: newMAUC,
      totalCostInStock: newTotalCostInStock,
      totalUnitsInStock: newTotalUnitsInStock,
      lastPurchasePrice: args.unitPrice,
      lastPurchaseDate: Date.now(),
    });

    // Create transaction record with MAUC data
    await ctx.db.insert("inventoryTransactions", {
      productId: args.productId,
      type: "receive",
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      date: Date.now(),
      reference: args.reference,
      userId: user._id,
      notes: args.notes,
      vendorId: args.vendorId,
      deliveryReceiptNumber: args.deliveryReceiptNumber,
      // MAUC tracking fields
      maucAtTimeOfTransaction: currentMAUC,
      totalCostImpact: newPurchaseValue,
      newMaucAfterTransaction: newMAUC,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Inventory Received",
      details: `Received ${args.quantity} units of ${product.name} (SKU: ${product.sku}) at $${args.unitPrice} per unit`,
    });

    return {
      productId: args.productId,
      newMAUC: newMAUC,
      previousMAUC: currentMAUC,
      quantityAdded: args.quantity,
      newTotalQuantity: product.quantity + args.quantity,
    };
  },
});
