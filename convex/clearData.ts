import { mutation } from "./_generated/server";

export const clearAllSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all data from all tables (except users - keep user accounts)
    
    // 1. Clear inventory transactions
    const transactions = await ctx.db.query("inventoryTransactions").collect();
    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }
    
    // 2. Clear purchase orders
    const purchaseOrders = await ctx.db.query("purchaseOrders").collect();
    for (const po of purchaseOrders) {
      await ctx.db.delete(po._id);
    }
    
    // 3. Clear vendor products
    const vendorProducts = await ctx.db.query("vendorProducts").collect();
    for (const vp of vendorProducts) {
      await ctx.db.delete(vp._id);
    }
    
    // 4. Clear products
    const products = await ctx.db.query("products").collect();
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    
    // 5. Clear vendors
    const vendors = await ctx.db.query("vendors").collect();
    for (const vendor of vendors) {
      await ctx.db.delete(vendor._id);
    }
    
    // 6. Clear projects
    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) {
      await ctx.db.delete(project._id);
    }
    
    // 7. Clear categories
    const categories = await ctx.db.query("categories").collect();
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }
    
    // 8. Clear units of measure
    const units = await ctx.db.query("unitsOfMeasure").collect();
    for (const unit of units) {
      await ctx.db.delete(unit._id);
    }
    
    // 9. Clear logs
    const logs = await ctx.db.query("logs").collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
    
    // 10. Clear files
    const files = await ctx.db.query("files").collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
    }
    
    console.log("All sample data cleared successfully!");
    
    return {
      success: true,
      message: "All sample data has been cleared from the database",
      cleared: {
        transactions: transactions.length,
        purchaseOrders: purchaseOrders.length,
        vendorProducts: vendorProducts.length,
        products: products.length,
        vendors: vendors.length,
        projects: projects.length,
        categories: categories.length,
        units: units.length,
        logs: logs.length,
        files: files.length
      }
    };
  },
});
