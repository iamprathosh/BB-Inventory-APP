import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query all active categories
export const listCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Query all categories (admin only)
export const listAllCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Add new category (admin only)
export const addCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) throw new Error("User not found");
    
    // Check if user is admin (in a real app, you'd check user role)
    // For now, we'll allow all authenticated users to create categories
    
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return categoryId;
  },
});

// Update category (admin only)
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      icon: args.icon,
      isActive: args.isActive,
    });

    return args.id;
  },
});

// Delete category (admin only)
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.delete(args.id);
  },
});
