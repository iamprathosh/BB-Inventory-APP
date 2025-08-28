import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Function to create or get user after authentication
export const store = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if user already exists in our users table
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if this is the first user (to make them admin)
    const existingUsers = await ctx.db.query("users").collect();
    const isFirstUser = existingUsers.length === 0;

    // Create new user in our users table
    const newUserId = await ctx.db.insert("users", {
      authId: userId,
      name: args.name || "Anonymous",
      email: args.email || "",
      role: isFirstUser ? "admin" : "worker", // First user becomes admin
      isActive: true,
    });

    return newUserId;
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    return user;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(), // "worker", "supervisor", "admin"
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    // Get current user to check if they can update roles
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", authUserId))
      .unique();

    // Only allow admins to update roles, or if no admin exists yet (first admin setup)
    const existingAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    if (existingAdmins.length > 0 && currentUser?.role !== "admin") {
      throw new Error("Only administrators can update user roles");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
      isActive: true,
    });

    return "User role updated successfully";
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return [];
    }

    // Get current user to check if they can list users
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", authUserId))
      .unique();

    // Allow listing users if no admin exists yet (for initial setup) or if user is admin
    const existingAdmins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    if (existingAdmins.length > 0 && currentUser?.role !== "admin") {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});
