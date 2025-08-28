import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query all active units of measure
export const listUnits = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("unitsOfMeasure")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Query units by type
export const listUnitsByType = query({
  args: { type: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("unitsOfMeasure")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect()
      .then(units => units.filter(unit => unit.isActive === true));
  },
});

// Query all units (admin only)
export const listAllUnits = query({
  handler: async (ctx) => {
    return await ctx.db.query("unitsOfMeasure").collect();
  },
});

// Add new unit of measure (admin only)
export const addUnit = mutation({
  args: {
    name: v.string(),
    abbreviation: v.string(),
    type: v.string(),
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
    
    const unitId = await ctx.db.insert("unitsOfMeasure", {
      name: args.name,
      abbreviation: args.abbreviation,
      type: args.type,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    return unitId;
  },
});

// Update unit of measure (admin only)
export const updateUnit = mutation({
  args: {
    id: v.id("unitsOfMeasure"),
    name: v.string(),
    abbreviation: v.string(),
    type: v.string(),
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
      abbreviation: args.abbreviation,
      type: args.type,
      isActive: args.isActive,
    });

    return args.id;
  },
});

// Delete unit of measure (admin only)
export const deleteUnit = mutation({
  args: { id: v.id("unitsOfMeasure") },
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

// Initialize default units of measure
export const initializeDefaultUnits = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) throw new Error("User not found");

    const defaultUnits = [
      { name: "Piece", abbreviation: "pcs", type: "count" },
      { name: "Bag", abbreviation: "bag", type: "count" },
      { name: "Kilogram", abbreviation: "kg", type: "weight" },
      { name: "Gram", abbreviation: "g", type: "weight" },
      { name: "Ton", abbreviation: "t", type: "weight" },
      { name: "Litre", abbreviation: "ltr", type: "volume" },
      { name: "Millilitre", abbreviation: "ml", type: "volume" },
      { name: "Meter", abbreviation: "m", type: "length" },
      { name: "Centimeter", abbreviation: "cm", type: "length" },
      { name: "Square Meter", abbreviation: "m²", type: "area" },
      { name: "Cubic Meter", abbreviation: "m³", type: "volume" },
    ];

    const existingUnits = await ctx.db.query("unitsOfMeasure").collect();
    
    if (existingUnits.length === 0) {
      for (const unit of defaultUnits) {
        await ctx.db.insert("unitsOfMeasure", {
          ...unit,
          isActive: true,
          createdBy: user._id,
          createdAt: Date.now(),
        });
      }
    }

    return "Default units initialized";
  },
});
