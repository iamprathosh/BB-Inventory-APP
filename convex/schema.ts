import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    role: v.optional(v.string()), // "worker", "supervisor", "admin"
    isActive: v.optional(v.boolean()),
  }).index("by_token", ["tokenIdentifier"]).index("by_role", ["role"]),

  products: defineTable({
    name: v.string(),
    sku: v.string(),
    quantity: v.number(),
    price: v.number(), // Selling price
    category: v.string(),
    
    // MAUC fields
    movingAverageCost: v.number(), // Current MAUC
    totalCostInStock: v.number(), // Total cost of current inventory
    totalUnitsInStock: v.number(), // Total units in stock (should match quantity)
    lastPurchasePrice: v.optional(v.number()),
    lastPurchaseDate: v.optional(v.number()),
    
    // Construction-specific fields
    unitOfMeasure: v.string(), // "pcs", "tons", "m3", "m2", "kg", "lbs", etc.
    materialType: v.optional(v.string()), // "steel", "concrete", "lumber", "electrical", etc.
    specifications: v.optional(v.string()), // Technical specs, grade, etc.
    
    // Legacy fields (keeping for compatibility)
    costPrice: v.optional(v.number()), // Will be deprecated in favor of MAUC
    reorderLevel: v.optional(v.number()),
    supplier: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
  }).searchIndex("by_name", {
    searchField: "name",
  }).index("by_category", ["category"]).index("by_material_type", ["materialType"]),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.string(), // "active", "completed", "on-hold"
    budget: v.optional(v.number()),
    manager: v.id("users"),
  }).index("by_status", ["status"]).index("by_manager", ["manager"]),

  inventoryTransactions: defineTable({
    productId: v.id("products"),
    projectId: v.optional(v.id("projects")),
    type: v.string(), // "sale", "purchase", "adjustment", "pull", "return", "receive"
    quantity: v.number(),
    unitPrice: v.number(),
    
    // MAUC tracking fields
    maucAtTimeOfTransaction: v.optional(v.number()), // MAUC when this transaction occurred
    totalCostImpact: v.optional(v.number()), // Total cost impact on inventory
    newMaucAfterTransaction: v.optional(v.number()), // MAUC after this transaction
    
    date: v.number(),
    reference: v.optional(v.string()), // PO number, delivery receipt, etc.
    userId: v.optional(v.id("users")), // Made optional to handle existing data
    notes: v.optional(v.string()),
    
    // Receiving-specific fields
    vendorId: v.optional(v.id("vendors")), // Vendor for purchase transactions
    deliveryReceiptNumber: v.optional(v.string()),
  }).index("by_product", ["productId"]).index("by_date", ["date"]).index("by_project", ["projectId"]).index("by_user", ["userId"]).index("by_vendor", ["vendorId"]).index("by_type", ["type"]),

  purchaseOrders: defineTable({
    poNumber: v.string(),
    supplier: v.string(),
    status: v.string(), // "pending", "received", "cancelled"
    orderDate: v.number(),
    expectedDate: v.optional(v.number()),
    totalAmount: v.number(),
    projectId: v.optional(v.id("projects")),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      unitPrice: v.number(),
    })),
  }).index("by_status", ["status"]).index("by_project", ["projectId"]),

  logs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    details: v.string(),
    projectId: v.optional(v.id("projects")),
  }).index("by_userId", ["userId"]).index("by_project", ["projectId"]),

  vendors: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    
    // Construction vendor specific fields
    vendorType: v.optional(v.string()), // "supplier", "subcontractor", "service", etc.
    specialties: v.optional(v.array(v.string())), // Materials or services they provide
    certifications: v.optional(v.array(v.string())), // Safety, quality certifications
    paymentTerms: v.optional(v.string()), // "Net 30", "COD", etc.
    isActive: v.optional(v.boolean()),
  }),

  vendorProducts: defineTable({
    vendorId: v.id("vendors"),
    productId: v.id("products"),
    price: v.number(),
    
    // Additional vendor-product relationship fields
    minimumOrderQuantity: v.optional(v.number()),
    leadTimeDays: v.optional(v.number()),
    lastPriceUpdate: v.optional(v.number()),
    isPreferredVendor: v.optional(v.boolean()),
  }).index("by_vendor", ["vendorId"]).index("by_product", ["productId"]),

  // Categories for product organization (admin managed)
  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Icon name for UI
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_active", ["isActive"]),

  // Units of measure (admin managed)
  unitsOfMeasure: defineTable({
    name: v.string(), // "Bag", "Kg", "Piece", "Litre", "Meter", "Ton"
    abbreviation: v.string(), // "bag", "kg", "pcs", "ltr", "m", "t"
    type: v.string(), // "weight", "volume", "length", "count", "area"
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_type", ["type"]).index("by_active", ["isActive"]),

  // File storage for product images
  files: defineTable({
    name: v.string(),
    url: v.string(),
    type: v.string(),
    size: v.number(),
    productId: v.optional(v.id("products")),
  }).index("by_product", ["productId"]),
});
