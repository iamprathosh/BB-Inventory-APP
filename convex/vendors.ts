import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createVendor = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    products: v.array(v.object({ productId: v.id("products"), price: v.number() })),
  },
  handler: async (ctx, args) => {
    const vendorId = await ctx.db.insert("vendors", {
      name: args.name,
      email: args.email,
      phone: args.phone,
    });

    for (const product of args.products) {
      await ctx.db.insert("vendorProducts", {
        vendorId,
        productId: product.productId,
        price: product.price,
      });
    }

    return vendorId;
  },
});

export const listVendors = query({
  handler: async (ctx) => {
    const vendors = await ctx.db.query("vendors").collect();
    return vendors;
  },
});

export const getVendor = query({
  args: { vendorId: v.id("vendors") },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.vendorId);
    return vendor;
  },
});

export const getVendorsForProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const vendorProducts = await ctx.db
      .query("vendorProducts")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const vendors = await Promise.all(
      vendorProducts.map(async (vp) => {
        const vendor = await ctx.db.get(vp.vendorId);
        return { ...vendor, price: vp.price };
      })
    );

    return vendors.filter((v) => v !== null);
  },
});
