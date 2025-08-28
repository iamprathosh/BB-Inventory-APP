import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendPurchaseOrderEmail = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
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

    // Get product details
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Get vendors for this product
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

    const availableVendors = vendors.filter((v) => v !== null);

    if (availableVendors.length === 0) {
      throw new Error("No vendors found for this product");
    }

    // For now, we'll just log the purchase request
    // In a real implementation, you would send actual emails
    await ctx.scheduler.runAfter(0, internal.logs.add, {
      userId: user._id,
      action: "Purchase Request Sent",
      details: `Purchase request sent for ${args.quantity} units of ${product.name} (SKU: ${product.sku}) to ${availableVendors.length} vendor(s)`,
    });

    return {
      success: true,
      message: `Purchase request sent to ${availableVendors.length} vendor(s)`,
      vendors: availableVendors,
    };
  },
});
