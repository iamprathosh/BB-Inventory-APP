import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // If the user already exists, return their ID
      return user._id;
    }

    // If the user doesn't exist, create a new user
    const userId = await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
    });

    return userId;
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user to check if they can update roles
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get current user to check if they can list users
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
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
