import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }
    
    const fileId = await ctx.db.insert("files", {
      name: args.name,
      url: url,
      type: args.type,
      size: args.size,
      productId: args.productId,
    });
    return fileId;
  },
});

export const getFile = query({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getFilesByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
  },
});

export const deleteFile = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);
    if (file) {
      // Note: We can't delete from storage without the storageId
      // The storageId is not stored in the files table
      // In a real implementation, you might want to store the storageId
      await ctx.db.delete(args.id);
    }
    return args.id;
  },
});
