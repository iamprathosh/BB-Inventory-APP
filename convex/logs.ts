import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const add = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("logs", {
      userId: args.userId,
      action: args.action,
      details: args.details,
    });
    return logId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Fetch logs with user information
    const logs = await ctx.db
      .query("logs")
      .order("desc")
      .collect();

    // Fetch user information for each log
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          user: user,
        };
      })
    );

    return logsWithUsers;
  },
});
