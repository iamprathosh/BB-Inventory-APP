import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .order("desc")
      .collect();
    return products;
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    return product;
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    quantity: v.number(),
    price: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Create the product
    const productId = await ctx.db.insert("products", {
      name: args.name,
      sku: args.sku,
      quantity: args.quantity,
      price: args.price,
      category: args.category,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Product Added",
      details: `Added product: ${args.name} (SKU: ${args.sku})`,
    });

    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    sku: v.string(),
    quantity: v.number(),
    price: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
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

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
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
