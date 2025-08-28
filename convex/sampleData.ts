import { mutation } from "./_generated/server";

export const createSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get current user for transactions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if we already have sample data
    const existingProducts = await ctx.db.query("products").collect();
    if (existingProducts.length > 0) {
      return "Sample data already exists";
    }

    // Create sample purchase orders
    const samplePOs = [
      {
        poNumber: "PO-001",
        supplier: "Tech Supplies Inc",
        status: "pending",
        orderDate: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
        expectedDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalAmount: 2500.00,
        items: []
      },
      {
        poNumber: "PO-002", 
        supplier: "Office Depot",
        status: "pending",
        orderDate: Date.now() - (3 * 24 * 60 * 60 * 1000),
        expectedDate: Date.now() + (5 * 24 * 60 * 60 * 1000),
        totalAmount: 1200.00,
        items: []
      },
      {
        poNumber: "PO-003",
        supplier: "Manufacturing Ltd",
        status: "received",
        orderDate: Date.now() - (15 * 24 * 60 * 60 * 1000),
        totalAmount: 3400.00,
        items: []
      }
    ];

    // Create sample products first
    const sampleProducts = [
      {
        name: "Wireless Headphones",
        sku: "WH-001",
        quantity: 45,
        price: 79.99,
        category: "Electronics",
        costPrice: 45.00,
        reorderLevel: 15,
        supplier: "Tech Supplies Inc"
      },
      {
        name: "Office Chair",
        sku: "OC-002", 
        quantity: 8,
        price: 199.99,
        category: "Furniture",
        costPrice: 120.00,
        reorderLevel: 10,
        supplier: "Office Depot"
      },
      {
        name: "Laptop Stand",
        sku: "LS-003",
        quantity: 23,
        price: 49.99,
        category: "Accessories",
        costPrice: 28.00,
        reorderLevel: 20,
        supplier: "Tech Supplies Inc"
      },
      {
        name: "Desk Lamp",
        sku: "DL-004",
        quantity: 5,
        price: 34.99,
        category: "Electronics",
        costPrice: 18.00,
        reorderLevel: 12,
        supplier: "Office Depot"
      },
      {
        name: "Notebook Set",
        sku: "NS-005",
        quantity: 150,
        price: 12.99,
        category: "Stationery",
        costPrice: 6.50,
        reorderLevel: 50,
        supplier: "Office Depot"
      },
      {
        name: "USB-C Cable",
        sku: "UC-006",
        quantity: 3,
        price: 19.99,
        category: "Electronics",
        costPrice: 8.00,
        reorderLevel: 25,
        supplier: "Tech Supplies Inc"
      },
      {
        name: "Monitor Stand",
        sku: "MS-007",
        quantity: 12,
        price: 89.99,
        category: "Accessories",
        costPrice: 52.00,
        reorderLevel: 8,
        supplier: "Manufacturing Ltd"
      },
      {
        name: "Keyboard",
        sku: "KB-008",
        quantity: 28,
        price: 119.99,
        category: "Electronics",
        costPrice: 68.00,
        reorderLevel: 15,
        supplier: "Tech Supplies Inc"
      },
      {
        name: "Printer Paper",
        sku: "PP-009",
        quantity: 85,
        price: 24.99,
        category: "Stationery",
        costPrice: 12.00,
        reorderLevel: 30,
        supplier: "Office Depot"
      },
      {
        name: "Webcam",
        sku: "WC-010",
        quantity: 7,
        price: 159.99,
        category: "Electronics",
        costPrice: 95.00,
        reorderLevel: 12,
        supplier: "Tech Supplies Inc"
      }
    ];

    // Insert products with MAUC initialization
    const productIds = [];
    for (const product of sampleProducts) {
      const initialCost = product.costPrice || product.price;
      const productWithMAUC = {
        ...product,
        // Add required MAUC fields
        movingAverageCost: initialCost,
        totalCostInStock: product.quantity * initialCost,
        totalUnitsInStock: product.quantity,
        unitOfMeasure: "pcs", // Default unit
        lastPurchasePrice: initialCost,
        lastPurchaseDate: Date.now(),
      };
      const productId = await ctx.db.insert("products", productWithMAUC);
      productIds.push(productId);
    }

    // Insert purchase orders
    for (const po of samplePOs) {
      await ctx.db.insert("purchaseOrders", po);
    }

    // Create sample inventory transactions (sales history)
    const sampleTransactions = [];
    const now = Date.now();
    
    // Generate transactions for the last 6 months
    for (let i = 0; i < 50; i++) {
      const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
      const randomDaysAgo = Math.floor(Math.random() * 180); // Last 6 months
      const transactionDate = now - (randomDaysAgo * 24 * 60 * 60 * 1000);
      
      const transaction = {
        productId: randomProductId,
        type: Math.random() > 0.3 ? "sale" : "purchase", // 70% sales, 30% purchases
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: 20 + Math.random() * 100,
        date: transactionDate,
        reference: `TXN-${1000 + i}`,
        userId: user._id // Add the required userId field
      };
      
      sampleTransactions.push(transaction);
    }

    // Insert transactions
    for (const transaction of sampleTransactions) {
      await ctx.db.insert("inventoryTransactions", transaction);
    }

    return "Sample data created successfully!";
  }
});

// Migration function to fix existing products with missing MAUC fields
export const migrateProductsForMAUC = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all products that might be missing required fields
    const products = await ctx.db.query("products").collect();
    let updatedCount = 0;

    for (const product of products) {
      const needsUpdate = !product.movingAverageCost || 
                         !product.totalCostInStock || 
                         !product.totalUnitsInStock || 
                         !product.unitOfMeasure;

      if (needsUpdate) {
        const costPrice = product.costPrice || product.price || 0;
        const quantity = product.quantity || 0;
        
        await ctx.db.patch(product._id, {
          movingAverageCost: product.movingAverageCost || costPrice,
          totalCostInStock: product.totalCostInStock || (quantity * costPrice),
          totalUnitsInStock: product.totalUnitsInStock || quantity,
          unitOfMeasure: product.unitOfMeasure || "pcs",
          lastPurchasePrice: product.lastPurchasePrice || costPrice,
          lastPurchaseDate: product.lastPurchaseDate || Date.now(),
        });
        updatedCount++;
      }
    }

    return `Updated ${updatedCount} products with MAUC fields`;
  }
});

// Migration function to fix existing inventory transactions without userId
export const migrateInventoryTransactions = mutation({
  args: {},
  handler: async (ctx) => {
    // Get current user for migration
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all inventory transactions without userId
    const transactions = await ctx.db.query("inventoryTransactions").collect();
    let updatedCount = 0;

    for (const transaction of transactions) {
      if (!transaction.userId) {
        await ctx.db.patch(transaction._id, {
          userId: user._id,
        });
        updatedCount++;
      }
    }

    return `Updated ${updatedCount} inventory transactions with userId`;
  }
});
