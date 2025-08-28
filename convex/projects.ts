import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .order("desc")
      .collect();
    return projects;
  },
});

export const getActiveProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
    return projects;
  },
});

export const getProject = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    return project;
  },
});

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(),
    budget: v.optional(v.number()),
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

    // Create the project
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      budget: args.budget,
      manager: user._id,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Project Created",
      details: `Created project: ${args.name}`,
      projectId,
    });

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(),
    budget: v.optional(v.number()),
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

    // Update the project
    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
      budget: args.budget,
    });

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Project Updated",
      details: `Updated project: ${args.name}`,
      projectId: args.id,
    });

    return args.id;
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
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

    // Get project details for logging
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    // Delete the project
    await ctx.db.delete(args.id);

    // Log the action
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Project Deleted",
      details: `Deleted project: ${project.name}`,
    });

    return args.id;
  },
});

export const getProjectAnalytics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get all transactions for this project
    const transactions = await ctx.db
      .query("inventoryTransactions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Calculate total inventory costs
    const totalInventoryCost = transactions.reduce((sum, transaction) => {
      return sum + (Math.abs(transaction.quantity) * transaction.unitPrice);
    }, 0);

    // Get transactions by user (filter out transactions without userId)
    const transactionsWithUser = transactions.filter(t => t.userId);
    const transactionsByUser = transactionsWithUser.reduce((acc, transaction) => {
      const userId = transaction.userId!;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(transaction);
      return acc;
    }, {} as Record<string, typeof transactions>);

    // Get user details
    const userIds = Object.keys(transactionsByUser);
    const users = await Promise.all(
      userIds.map(userId => ctx.db.get(userId as any))
    );

    const userActivity = users
      .map((user, index) => {
        if (!user) return null; // Handle null users
        const userTransactions = transactionsByUser[userIds[index]];
        const totalValue = userTransactions.reduce((sum, t) => 
          sum + (Math.abs(t.quantity) * t.unitPrice), 0
        );
        return {
          user: user as Doc<"users">,
          transactions: userTransactions,
          totalValue,
          transactionCount: userTransactions.length,
        };
      })
      .filter((activity): activity is { user: Doc<"users">; transactions: Doc<"inventoryTransactions">[]; totalValue: number; transactionCount: number } => activity !== null);

    // Calculate consumption by time frame
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const thisWeek = transactions.filter(t => t.date >= oneWeekAgo);
    const lastWeek = transactions.filter(t => t.date >= twoWeeksAgo && t.date < oneWeekAgo);
    const thisMonth = transactions.filter(t => t.date >= oneMonthAgo);

    // Enrich transactions with user and product data
    const enrichedThisMonthTransactions = await Promise.all(
      thisMonth.map(async (transaction) => {
        const product = await ctx.db.get(transaction.productId);
        const user = transaction.userId ? await ctx.db.get(transaction.userId) : null;
        return {
          ...transaction,
          product,
          user,
        };
      })
    );

    const consumptionData = {
      thisWeek: {
        transactions: thisWeek,
        totalValue: thisWeek.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.unitPrice), 0),
        count: thisWeek.length,
      },
      lastWeek: {
        transactions: lastWeek,
        totalValue: lastWeek.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.unitPrice), 0),
        count: lastWeek.length,
      },
      thisMonth: {
        transactions: enrichedThisMonthTransactions,
        totalValue: thisMonth.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.unitPrice), 0),
        count: thisMonth.length,
      },
    };

    return {
      project,
      totalInventoryCost,
      userActivity,
      consumptionData,
      totalTransactions: transactions.length,
    };
  },
});
