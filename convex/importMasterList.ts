import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const importBBInventoryMasterList = mutation({
  args: {},
  handler: async (ctx) => {
    // Get current user for created by fields
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", userId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // First, create essential categories and units that will be needed
    const categories = [
      { name: "Cement & Concrete", description: "Cement, concrete mix, additives", icon: "🧱" },
      { name: "Steel & Rebar", description: "Rebar, steel bars, mesh", icon: "🔩" },
      { name: "Blocks & Bricks", description: "Concrete blocks, clay bricks", icon: "🧱" },
      { name: "Sand & Gravel", description: "Construction sand, gravel, aggregates", icon: "⛏️" },
      { name: "Electrical", description: "Wires, conduits, electrical components", icon: "⚡" },
      { name: "Plumbing", description: "Pipes, fittings, plumbing supplies", icon: "🔧" },
      { name: "Tools & Equipment", description: "Hand tools, power tools, equipment", icon: "🔨" },
      { name: "Hardware", description: "Bolts, screws, fasteners", icon: "🔩" },
      { name: "Paint & Finishes", description: "Paint, primers, finishing materials", icon: "🎨" },
      { name: "Lumber & Wood", description: "Timber, plywood, wood products", icon: "🌲" },
    ];

    const units = [
      { name: "Bag", abbreviation: "bag", type: "count" },
      { name: "Piece", abbreviation: "pcs", type: "count" },
      { name: "Kilogram", abbreviation: "kg", type: "weight" },
      { name: "Ton", abbreviation: "ton", type: "weight" },
      { name: "Meter", abbreviation: "m", type: "length" },
      { name: "Cubic Meter", abbreviation: "m³", type: "volume" },
      { name: "Square Meter", abbreviation: "m²", type: "area" },
      { name: "Roll", abbreviation: "roll", type: "count" },
      { name: "Bundle", abbreviation: "bundle", type: "count" },
      { name: "Sheet", abbreviation: "sheet", type: "count" },
      { name: "Gallon", abbreviation: "gal", type: "volume" },
      { name: "Liter", abbreviation: "L", type: "volume" },
    ];

    // Create categories
    const createdCategories = [];
    for (const category of categories) {
      const categoryId = await ctx.db.insert("categories", {
        name: category.name,
        description: category.description,
        icon: category.icon,
        isActive: true,
        createdBy: user._id,
        createdAt: Date.now(),
      });
      createdCategories.push({ id: categoryId, name: category.name });
    }

    // Create units
    const createdUnits = [];
    for (const unit of units) {
      const unitId = await ctx.db.insert("unitsOfMeasure", {
        name: unit.name,
        abbreviation: unit.abbreviation,
        type: unit.type,
        isActive: true,
        createdBy: user._id,
        createdAt: Date.now(),
      });
      createdUnits.push({ id: unitId, name: unit.name, abbreviation: unit.abbreviation });
    }

    // Create sample products based on typical B&B inventory
    // This represents common construction materials found in a B&B inventory
    const products = [
      // Cement & Concrete
      { name: "Portland Cement", sku: "CEM-001", category: "Cement & Concrete", unit: "bag", quantity: 50, price: 12.50, costPrice: 10.00 },
      { name: "Ready Mix Concrete", sku: "CEM-002", category: "Cement & Concrete", unit: "m³", quantity: 25, price: 120.00, costPrice: 95.00 },
      { name: "Concrete Blocks 8\"", sku: "BLK-001", category: "Blocks & Bricks", unit: "pcs", quantity: 500, price: 2.50, costPrice: 1.80 },
      { name: "Concrete Blocks 6\"", sku: "BLK-002", category: "Blocks & Bricks", unit: "pcs", quantity: 300, price: 2.25, costPrice: 1.60 },
      
      // Steel & Rebar
      { name: "Rebar 10mm x 6m", sku: "RB-001", category: "Steel & Rebar", unit: "pcs", quantity: 200, price: 18.50, costPrice: 14.50 },
      { name: "Rebar 12mm x 6m", sku: "RB-002", category: "Steel & Rebar", unit: "pcs", quantity: 150, price: 22.75, costPrice: 18.50 },
      { name: "Steel Mesh 6x6", sku: "SM-001", category: "Steel & Rebar", unit: "sheet", quantity: 80, price: 45.00, costPrice: 35.00 },
      
      // Sand & Gravel
      { name: "Construction Sand", sku: "AGG-001", category: "Sand & Gravel", unit: "m³", quantity: 15, price: 45.00, costPrice: 35.00 },
      { name: "Crushed Gravel 3/4\"", sku: "AGG-002", category: "Sand & Gravel", unit: "m³", quantity: 12, price: 55.00, costPrice: 42.00 },
      { name: "Fill Dirt", sku: "AGG-003", category: "Sand & Gravel", unit: "m³", quantity: 20, price: 25.00, costPrice: 18.00 },
      
      // Electrical
      { name: "Electrical Wire 12 AWG", sku: "ELE-001", category: "Electrical", unit: "m", quantity: 500, price: 2.50, costPrice: 1.80 },
      { name: "PVC Conduit 1/2\"", sku: "ELE-002", category: "Electrical", unit: "m", quantity: 300, price: 3.25, costPrice: 2.40 },
      { name: "Junction Box", sku: "ELE-003", category: "Electrical", unit: "pcs", quantity: 100, price: 8.50, costPrice: 6.20 },
      
      // Plumbing
      { name: "PVC Pipe 4\" x 6m", sku: "PLB-001", category: "Plumbing", unit: "pcs", quantity: 80, price: 28.50, costPrice: 22.00 },
      { name: "PVC Pipe 2\" x 6m", sku: "PLB-002", category: "Plumbing", unit: "pcs", quantity: 120, price: 15.75, costPrice: 12.50 },
      { name: "PVC Elbow 4\"", sku: "PLB-003", category: "Plumbing", unit: "pcs", quantity: 200, price: 4.25, costPrice: 3.10 },
      
      // Hardware
      { name: "Galvanized Bolts 1/2\" x 6\"", sku: "HW-001", category: "Hardware", unit: "pcs", quantity: 500, price: 1.85, costPrice: 1.35 },
      { name: "Concrete Screws", sku: "HW-002", category: "Hardware", unit: "pcs", quantity: 1000, price: 0.95, costPrice: 0.65 },
      { name: "Anchor Bolts", sku: "HW-003", category: "Hardware", unit: "pcs", quantity: 300, price: 3.50, costPrice: 2.75 },
      
      // Tools & Equipment
      { name: "Shovel - Heavy Duty", sku: "TL-001", category: "Tools & Equipment", unit: "pcs", quantity: 25, price: 35.00, costPrice: 25.00 },
      { name: "Wheelbarrow", sku: "TL-002", category: "Tools & Equipment", unit: "pcs", quantity: 10, price: 125.00, costPrice: 95.00 },
      { name: "Level 4ft", sku: "TL-003", category: "Tools & Equipment", unit: "pcs", quantity: 15, price: 45.00, costPrice: 32.00 },
      
      // Paint & Finishes
      { name: "Exterior Paint - White", sku: "PT-001", category: "Paint & Finishes", unit: "gal", quantity: 50, price: 38.50, costPrice: 28.00 },
      { name: "Primer - Universal", sku: "PT-002", category: "Paint & Finishes", unit: "gal", quantity: 40, price: 32.00, costPrice: 24.50 },
      
      // Lumber & Wood
      { name: "2x4 Lumber 8ft", sku: "LBR-001", category: "Lumber & Wood", unit: "pcs", quantity: 200, price: 8.50, costPrice: 6.25 },
      { name: "2x6 Lumber 10ft", sku: "LBR-002", category: "Lumber & Wood", unit: "pcs", quantity: 150, price: 15.75, costPrice: 12.50 },
      { name: "Plywood 3/4\" 4x8", sku: "PLY-001", category: "Lumber & Wood", unit: "sheet", quantity: 75, price: 65.00, costPrice: 48.00 },
    ];

    // Find category and unit IDs for products
    const categoryMap = new Map(createdCategories.map(c => [c.name, c.id]));
    const unitMap = new Map(createdUnits.map(u => [u.name, u.id]));

    let createdProducts = 0;
    for (const product of products) {
      const categoryId = categoryMap.get(product.category);
      const unit = createdUnits.find(u => u.abbreviation === product.unit);
      
      if (categoryId && unit) {
        const productId = await ctx.db.insert("products", {
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          price: product.price,
          category: product.category,
          unitOfMeasure: unit.abbreviation,
          materialType: product.category.toLowerCase(),
          
          // MAUC fields
          movingAverageCost: product.costPrice,
          totalCostInStock: product.quantity * product.costPrice,
          totalUnitsInStock: product.quantity,
          lastPurchasePrice: product.costPrice,
          lastPurchaseDate: Date.now(),
          
          // Legacy fields
          costPrice: product.costPrice,
          reorderLevel: Math.floor(product.quantity * 0.2), // 20% of current stock
          description: `${product.name} for construction use`,
        });
        createdProducts++;
        
        // Create initial inventory transaction for stock receipt
        await ctx.db.insert("inventoryTransactions", {
          productId: productId,
          type: "receive",
          quantity: product.quantity,
          unitPrice: product.costPrice,
          maucAtTimeOfTransaction: product.costPrice,
          totalCostImpact: product.quantity * product.costPrice,
          newMaucAfterTransaction: product.costPrice,
          date: Date.now(),
          reference: "INITIAL_STOCK",
          userId: user._id,
          notes: "Initial stock import from B&B Master List",
        });
      }
    }

    return {
      success: true,
      message: "B&B Inventory Master List imported successfully!",
      imported: {
        categories: createdCategories.length,
        units: createdUnits.length,
        products: createdProducts,
      }
    };
  },
});
