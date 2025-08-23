import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  products: defineTable({
    name: v.string(),
    sku: v.string(),
    quantity: v.number(),
    price: v.number(),
    category: v.string(),
    costPrice: v.optional(v.number()),
    reorderLevel: v.optional(v.number()),
    supplier: v.optional(v.string()),
  }).searchIndex("by_name", {
    searchField: "name",
  }).index("by_category", ["category"]),

  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplier: v.string(),
    status: v.string(), // "pending", "received", "cancelled"
    orderDate: v.number(),
    expectedDate: v.optional(v.number()),
    totalAmount: v.number(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
  }).index("by_status", ["status"]),

  inventoryTransactions: defineTable({
    productId: v.id("products"),
    type: v.string(), // "sale", "purchase", "adjustment"
    quantity: v.number(),
    unitPrice: v.number(),
    date: v.number(),
    reference: v.optional(v.string()),
  }).index("by_product", ["productId"]).index("by_date", ["date"]),

  logs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    details: v.string(),
  }).index("by_userId", ["userId"]),
});
