import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * MAUC (Moving Average Unit Cost) Calculation Logic
 * 
 * Formula: MAUC = Total Cost of Stock on Hand / Total Units on Hand
 * 
 * When receiving new inventory:
 * 1. Calculate new total cost = existing total cost + (new quantity × new unit cost)
 * 2. Calculate new total units = existing units + new quantity
 * 3. Calculate new MAUC = new total cost / new total units
 * 4. Update product with new MAUC and totals
 */

export const calculateMAUC = internalMutation({
  args: {
    productId: v.id("products"),
    newQuantity: v.number(),
    newUnitCost: v.number(),
    transactionType: v.string(), // "receive", "adjust", "return"
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let newTotalUnits: number;
    let newTotalCost: number;
    let newMAUC: number;

    // Handle optional fields with fallbacks
    const currentTotalUnits = product.totalUnitsInStock ?? product.quantity;
    const currentTotalCost = product.totalCostInStock ?? (product.quantity * (product.costPrice || product.price || 0));
    const currentMAUC = product.movingAverageCost ?? (product.costPrice || product.price || 0);
    
    if (args.transactionType === "receive" || args.transactionType === "return") {
      // Adding inventory - calculate new MAUC
      newTotalUnits = currentTotalUnits + args.newQuantity;
      newTotalCost = currentTotalCost + (args.newQuantity * args.newUnitCost);
      
      if (newTotalUnits <= 0) {
        // If total units becomes 0 or negative, reset everything to 0
        newTotalUnits = 0;
        newTotalCost = 0;
        newMAUC = 0;
      } else {
        newMAUC = newTotalCost / newTotalUnits;
      }
    } else if (args.transactionType === "pull" || args.transactionType === "sale") {
      // Removing inventory - use current MAUC, reduce totals
      if (args.newQuantity > currentTotalUnits) {
        throw new Error("Cannot remove more inventory than available");
      }
      
      newTotalUnits = currentTotalUnits - Math.abs(args.newQuantity);
      newTotalCost = currentTotalCost - (Math.abs(args.newQuantity) * currentMAUC);
      
      if (newTotalUnits <= 0) {
        newTotalUnits = 0;
        newTotalCost = 0;
        newMAUC = 0;
      } else {
        newMAUC = currentMAUC; // MAUC doesn't change when removing inventory
      }
    } else if (args.transactionType === "adjust") {
      // Inventory adjustment - could be positive or negative
      newTotalUnits = currentTotalUnits + args.newQuantity;
      
      if (args.newQuantity > 0) {
        // Positive adjustment - treat like receiving
        newTotalCost = currentTotalCost + (args.newQuantity * args.newUnitCost);
      } else {
        // Negative adjustment - treat like pulling
        newTotalCost = currentTotalCost + (args.newQuantity * currentMAUC);
      }
      
      if (newTotalUnits <= 0) {
        newTotalUnits = 0;
        newTotalCost = 0;
        newMAUC = 0;
      } else {
        newMAUC = newTotalCost / newTotalUnits;
      }
    } else {
      throw new Error(`Unsupported transaction type: ${args.transactionType}`);
    }

    // Update the product with new MAUC values
    await ctx.db.patch(args.productId, {
      quantity: newTotalUnits, // Keep quantity in sync with totalUnitsInStock
      totalUnitsInStock: newTotalUnits,
      totalCostInStock: Math.max(0, newTotalCost), // Ensure non-negative
      movingAverageCost: newMAUC,
      lastPurchasePrice: args.transactionType === "receive" ? args.newUnitCost : product.lastPurchasePrice,
      lastPurchaseDate: args.transactionType === "receive" ? Date.now() : product.lastPurchaseDate,
    });

    return {
      oldMAUC: product.movingAverageCost ?? 0,
      newMAUC: newMAUC,
      oldTotalCost: product.totalCostInStock ?? 0,
      newTotalCost: newTotalCost,
      oldTotalUnits: product.totalUnitsInStock ?? 0,
      newTotalUnits: newTotalUnits,
    };
  },
});

interface MAUCResult {
  oldMAUC: number;
  newMAUC: number;
  oldTotalCost: number;
  newTotalCost: number;
  oldTotalUnits: number;
  newTotalUnits: number;
}

export const receiveInventory = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    unitCost: v.number(),
    vendorId: v.optional(v.id("vendors")),
    projectId: v.optional(v.id("projects")),
    reference: v.optional(v.string()),
    deliveryReceiptNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"inventoryTransactions">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate new MAUC directly (instead of using scheduler)
    const currentMAUC = product.movingAverageCost ?? product.costPrice ?? 0;
    const totalCostInStock = product.totalCostInStock ?? (currentMAUC * product.quantity);
    const totalUnitsInStock = product.totalUnitsInStock ?? product.quantity;
    
    const newPurchaseValue = args.quantity * args.unitCost;
    const newTotalCostInStock = totalCostInStock + newPurchaseValue;
    const newTotalUnitsInStock = totalUnitsInStock + args.quantity;
    const newMAUC = newTotalUnitsInStock > 0 ? newTotalCostInStock / newTotalUnitsInStock : 0;

    // Update product with new quantity and MAUC values
    await ctx.db.patch(args.productId, {
      quantity: product.quantity + args.quantity,
      movingAverageCost: newMAUC,
      totalCostInStock: newTotalCostInStock,
      totalUnitsInStock: newTotalUnitsInStock,
      lastPurchasePrice: args.unitCost,
      lastPurchaseDate: Date.now(),
    });

    // Create transaction record
    const transactionId: Id<"inventoryTransactions"> = await ctx.db.insert("inventoryTransactions", {
      productId: args.productId,
      projectId: args.projectId,
      type: "receive",
      quantity: args.quantity,
      unitPrice: args.unitCost,
      maucAtTimeOfTransaction: currentMAUC,
      totalCostImpact: newPurchaseValue,
      newMaucAfterTransaction: newMAUC,
      date: Date.now(),
      reference: args.reference,
      userId: user._id,
      notes: args.notes,
      vendorId: args.vendorId,
      deliveryReceiptNumber: args.deliveryReceiptNumber,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Inventory Received",
      details: `Received ${args.quantity} ${product.unitOfMeasure || 'units'} of ${product.name} at $${args.unitCost.toFixed(2)} per unit. New MAUC: $${newMAUC.toFixed(2)}`,
      projectId: args.projectId,
    });

    return transactionId;
  },
});

export const getMAUCHistory = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const transactions = await ctx.db
      .query("inventoryTransactions")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.or(
        q.eq(q.field("type"), "receive"),
        q.eq(q.field("type"), "adjust")
      ))
      .order("desc")
      .take(limit);

    // Enrich with vendor information
    const enrichedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const vendor = transaction.vendorId ? await ctx.db.get(transaction.vendorId) : null;
        const user = transaction.userId ? await ctx.db.get(transaction.userId) : null;
        const project = transaction.projectId ? await ctx.db.get(transaction.projectId) : null;
        
        return {
          ...transaction,
          vendor,
          user,
          project,
        };
      })
    );

    return enrichedTransactions;
  },
});

export const getProductMAUCAnalytics = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get all receive transactions for this product
    const receiveTransactions = await ctx.db
      .query("inventoryTransactions")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .filter((q) => q.eq(q.field("type"), "receive"))
      .order("desc")
      .collect();

    // Calculate price variance statistics
    const prices = receiveTransactions.map(t => t.unitPrice);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    
    // Calculate current inventory value at MAUC vs market price  
    const totalUnits = product.totalUnitsInStock ?? 0;
    const mauc = product.movingAverageCost ?? 0;
    const inventoryValueAtMAUC = totalUnits * mauc;
    const inventoryValueAtMarket = totalUnits * product.price;
    const potentialProfit = inventoryValueAtMarket - inventoryValueAtMAUC;
    const marginPercentage = inventoryValueAtMAUC > 0 ? (potentialProfit / inventoryValueAtMAUC) * 100 : 0;

    return {
      product,
      currentMAUC: product.movingAverageCost,
      totalUnitsInStock: product.totalUnitsInStock,
      totalCostInStock: product.totalCostInStock,
      lastPurchasePrice: product.lastPurchasePrice || 0,
      lastPurchaseDate: product.lastPurchaseDate,
      
      priceStatistics: {
        minPrice,
        maxPrice,
        avgPrice,
        priceVariance: maxPrice - minPrice,
        priceVariancePercent: minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0,
      },
      
      valuationAnalysis: {
        inventoryValueAtMAUC,
        inventoryValueAtMarket,
        potentialProfit,
        marginPercentage,
      },
      
      totalReceiveTransactions: receiveTransactions.length,
      recentTransactions: receiveTransactions.slice(0, 5),
    };
  },
});

// Utility function to initialize MAUC for existing products
export const initializeMAUCForProduct = mutation({
  args: {
    productId: v.id("products"),
    initialUnitCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Use provided initial cost, or costPrice, or price as fallback
    const initialCost = args.initialUnitCost || product.costPrice || product.price;
    
    await ctx.db.patch(args.productId, {
      movingAverageCost: initialCost,
      totalCostInStock: product.quantity * initialCost,
      totalUnitsInStock: product.quantity,
      lastPurchasePrice: initialCost,
      lastPurchaseDate: Date.now(),
    });

    return {
      productId: args.productId,
      initializedMAUC: initialCost,
      totalCostInStock: product.quantity * initialCost,
      totalUnitsInStock: product.quantity,
    };
  },
});
